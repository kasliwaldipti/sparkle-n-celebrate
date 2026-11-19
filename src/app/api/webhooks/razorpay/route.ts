import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { Prisma } from "@/generated/prisma/client";

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: { id: string; order_id: string; amount: number; status: string } };
  };
}

// Razorpay payment webhook. The signature is checked against the raw body before anything else.
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const payment = body.payload?.payment?.entity;
  if (!payment) return NextResponse.json({ ok: true, ignored: true });

  const record = await db.payment.findUnique({ where: { razorpayOrderId: payment.order_id } });
  if (!record) return NextResponse.json({ ok: true, ignored: true });

  if (body.event === "payment.captured") {
    // Never trust the amount blindly: it must match what we asked for.
    if (payment.amount !== record.amountPaise) {
      console.error("Razorpay amount mismatch", { orderId: record.orderId });
      return NextResponse.json({ ok: true, flagged: true });
    }
    await db.$transaction([
      db.payment.update({
        where: { id: record.id },
        data: { status: "CAPTURED", razorpayPaymentId: payment.id, raw: body as unknown as Prisma.InputJsonValue },
      }),
      db.order.updateMany({
        where: { id: record.orderId, status: "PENDING" },
        data: { status: "PAID" },
      }),
    ]);
    // TODO: send order-confirmation email; decrement inventory if not already done at checkout.
  } else if (body.event === "payment.failed") {
    await db.payment.update({ where: { id: record.id }, data: { status: "FAILED" } });
  }
  // TODO: handle refund.processed once admin-approved refunds are implemented.

  return NextResponse.json({ ok: true });
}
