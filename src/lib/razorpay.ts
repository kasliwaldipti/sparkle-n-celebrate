import "server-only";
import Razorpay from "razorpay";
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from "razorpay/dist/utils/razorpay-utils";
import { requireEnv } from "@/lib/env";
import { assertPaise } from "@/lib/money";

let client: Razorpay | undefined;

function getClient() {
  client ??= new Razorpay({
    key_id: requireEnv("RAZORPAY_KEY_ID"),
    key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
  });
  return client;
}

/** Creates a Razorpay order. Amount is integer paise. */
export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  return getClient().orders.create({
    amount: assertPaise(amountPaise),
    currency: "INR",
    receipt,
  });
}

/** Verifies the checkout handler response (order_id|payment_id signed with the key secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  return validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    signature,
    requireEnv("RAZORPAY_KEY_SECRET"),
  );
}

/** Verifies the X-Razorpay-Signature header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  return validateWebhookSignature(rawBody, signature, requireEnv("RAZORPAY_WEBHOOK_SECRET"));
}
