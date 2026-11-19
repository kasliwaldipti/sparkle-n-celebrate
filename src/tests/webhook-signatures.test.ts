import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { verifyAftershipSignature } from "@/lib/aftership";
import { verifyWebhookSignature } from "@/lib/razorpay";

const body = JSON.stringify({ event: "test" });

beforeAll(() => {
  process.env.AFTERSHIP_WEBHOOK_SECRET = "aftership-test-secret";
  process.env.RAZORPAY_WEBHOOK_SECRET = "razorpay-test-secret";
});

describe("AfterShip signature", () => {
  it("accepts a valid signature", () => {
    const sig = createHmac("sha256", "aftership-test-secret").update(body).digest("base64");
    expect(verifyAftershipSignature(body, sig)).toBe(true);
  });

  it("rejects a missing or tampered signature", () => {
    const sig = createHmac("sha256", "aftership-test-secret").update(body).digest("base64");
    expect(verifyAftershipSignature(body, null)).toBe(false);
    expect(verifyAftershipSignature(body + " ", sig)).toBe(false);
  });
});

describe("Razorpay webhook signature", () => {
  it("accepts a valid signature", () => {
    const sig = createHmac("sha256", "razorpay-test-secret").update(body).digest("hex");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a missing or wrong signature", () => {
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });
});
