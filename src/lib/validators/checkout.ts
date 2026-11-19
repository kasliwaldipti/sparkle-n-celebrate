import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
});

export const cartItemSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.int().min(1).max(20),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  address: addressSchema,
});

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type Address = z.infer<typeof addressSchema>;
