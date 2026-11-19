import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/env";
import type { ShipmentStatus } from "@/generated/prisma/enums";

/** Verifies the aftership-hmac-sha256 header (base64 HMAC-SHA256 of the raw body). */
export function verifyAftershipSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", requireEnv("AFTERSHIP_WEBHOOK_SECRET"))
    .update(rawBody, "utf8")
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

const TAG_TO_STATUS: Record<string, ShipmentStatus> = {
  Pending: "PENDING",
  InfoReceived: "INFO_RECEIVED",
  InTransit: "IN_TRANSIT",
  OutForDelivery: "OUT_FOR_DELIVERY",
  Delivered: "DELIVERED",
  AttemptFail: "FAILED_ATTEMPT",
  Exception: "EXCEPTION",
  Expired: "EXPIRED",
};

export function mapAftershipTag(tag: string): ShipmentStatus {
  return TAG_TO_STATUS[tag] ?? "IN_TRANSIT";
}

/** TODO: register a tracking with AfterShip when an admin adds a shipment. */
export async function createTracking(_courierSlug: string, _trackingNumber: string) {
  throw new Error("TODO: implement AfterShip createTracking");
}
