import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { inngest, shipmentUpdated } from "@/lib/inngest";
import { mapAftershipTag, verifyAftershipSignature } from "@/lib/aftership";
import { aftershipWebhookSchema } from "@/lib/validators/aftership";
import { Prisma } from "@/generated/prisma/client";

// Courier tracking webhook. Verify -> store the event -> hand off to Inngest -> return fast.
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyAftershipSignature(rawBody, req.headers.get("aftership-hmac-sha256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = aftershipWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unexpected payload" }, { status: 400 });
  }
  const { msg } = parsed.data;

  const shipment = await db.shipment.findFirst({
    where: { OR: [{ aftershipId: msg.id }, { trackingNumber: msg.tracking_number }] },
  });
  // Unknown tracking number: acknowledge so AfterShip doesn't retry forever.
  if (!shipment) return NextResponse.json({ ok: true, ignored: true });

  const latest = msg.checkpoints.at(-1);
  const status = mapAftershipTag(msg.tag);
  const externalId =
    latest?.id ??
    createHash("sha256").update(`${msg.tag}|${latest?.checkpoint_time ?? ""}|${latest?.message ?? ""}`).digest("hex");

  const event = await db.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        status,
        aftershipId: msg.id,
        estimatedDelivery: msg.expected_delivery ? new Date(msg.expected_delivery) : undefined,
      },
    });
    // Duplicate webhooks hit the unique key and update nothing.
    return tx.trackingEvent.upsert({
      where: { shipmentId_externalId: { shipmentId: shipment.id, externalId } },
      update: {},
      create: {
        shipmentId: shipment.id,
        externalId,
        status,
        message: latest?.message ?? msg.tag,
        location: latest?.location ?? null,
        occurredAt: latest ? new Date(latest.checkpoint_time) : new Date(),
        raw: json as Prisma.InputJsonValue,
      },
    });
  });

  // TODO: if status is DELIVERED, also move the Order to DELIVERED.
  await inngest.send(
    shipmentUpdated.create(
      { shipmentId: shipment.id, trackingEventId: event.id },
      // Same tracking event -> same Inngest event ID -> processed once.
      { id: `tracking-${event.id}` },
    ),
  );

  return NextResponse.json({ ok: true });
}
