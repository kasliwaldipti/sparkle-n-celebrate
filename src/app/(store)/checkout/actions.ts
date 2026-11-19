"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createRazorpayOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { lineTotalPaise } from "@/lib/money";
import { checkoutSchema, razorpayVerifySchema } from "@/lib/validators/checkout";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SHIPPING_PAISE = 0; // TODO: shipping rules (free above a threshold, etc.)

/**
 * Creates a PENDING order and a Razorpay order. Prices come from the DB, never the client.
 * Returns what the Razorpay Checkout widget needs.
 */
export async function createCheckout(
  input: unknown,
): Promise<ActionResult<{ razorpayOrderId: string; amountPaise: number; keyId: string; orderId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to check out." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your cart and address." };
  const { items, address } = parsed.data;

  const inventory = await db.inventoryItem.findMany({
    where: { id: { in: items.map((i) => i.inventoryItemId) }, product: { isActive: true } },
    include: { product: true },
  });
  if (inventory.length !== items.length) return { ok: false, error: "Some items are no longer available." };

  const lines = items.map((item) => {
    const inv = inventory.find((x) => x.id === item.inventoryItemId)!;
    return { inv, quantity: item.quantity, total: lineTotalPaise(inv.product.pricePaise, item.quantity) };
  });
  if (lines.some((l) => l.inv.quantity < l.quantity)) {
    return { ok: false, error: "Some items don't have enough stock." };
  }

  const subtotalPaise = lines.reduce((s, l) => s + l.total, 0);
  const totalPaise = subtotalPaise + SHIPPING_PAISE;
  const orderNumber = `SNC-${Date.now().toString(36).toUpperCase()}`;

  // TODO: reserve stock inside this transaction (decrement with a quantity >= n guard).
  const order = await db.order.create({
    data: {
      orderNumber,
      userId: user.id,
      subtotalPaise,
      shippingPaise: SHIPPING_PAISE,
      totalPaise,
      shippingAddress: address,
      items: {
        create: lines.map((l) => ({
          productId: l.inv.productId,
          inventoryItemId: l.inv.id,
          quantity: l.quantity,
          unitPricePaise: l.inv.product.pricePaise,
          productName: l.inv.product.name,
          sku: l.inv.sku,
        })),
      },
    },
  });

  const rzp = await createRazorpayOrder(totalPaise, orderNumber);
  await db.payment.create({
    data: { orderId: order.id, razorpayOrderId: rzp.id, amountPaise: totalPaise },
  });

  return {
    ok: true,
    data: {
      razorpayOrderId: rzp.id,
      amountPaise: totalPaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      orderId: order.id,
    },
  };
}

/** Called after the Razorpay widget succeeds. The webhook is the source of truth; this gives fast feedback. */
export async function confirmPayment(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const parsed = razorpayVerifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment response." };
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return { ok: false, error: "Payment could not be verified." };
  }

  const payment = await db.payment.findFirst({
    where: { razorpayOrderId: razorpay_order_id, order: { userId: user.id } },
  });
  if (!payment) return { ok: false, error: "Order not found." };

  await db.payment.update({
    where: { id: payment.id },
    data: { razorpayPaymentId: razorpay_payment_id, status: "AUTHORIZED" },
  });
  return { ok: true, data: { orderId: payment.orderId } };
}
