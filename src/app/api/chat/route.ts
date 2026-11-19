import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAgent } from "@/lib/agent/agent";
import { chatRequestSchema } from "@/lib/validators/chat";

const HISTORY_LIMIT = 20;

// "Where's my order?" chat. A plain POST request/response: no streaming, no WebSockets.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const userId = session.user.id;

  const parsed = chatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  const { message, orderId } = parsed.data;

  // The orderId from the client is only a hint; tools re-check ownership on every call.
  const ownedOrderId = orderId
    ? (await db.order.findFirst({ where: { id: orderId, userId }, select: { id: true } }))?.id
    : undefined;

  const previous = await db.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  const history: Anthropic.MessageParam[] = previous.reverse().map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
  // History must start with a user turn.
  while (history[0]?.role === "assistant") history.shift();

  const content = ownedOrderId ? `(About order ${ownedOrderId}) ${message}` : message;
  history.push({ role: "user", content });

  // TODO: add per-user rate limiting (e.g. count ChatMessage rows in the last minute).
  const result = await runAgent({ scope: { trigger: "CHAT", userId }, messages: history });

  await db.chatMessage.createMany({
    data: [
      { userId, orderId: ownedOrderId, role: "USER", content: message },
      { userId, orderId: ownedOrderId, role: "ASSISTANT", content: result.text },
    ],
  });

  return NextResponse.json({ reply: result.text });
}
