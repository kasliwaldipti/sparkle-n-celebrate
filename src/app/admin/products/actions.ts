"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryUpdateSchema, productInputSchema } from "@/lib/validators/product";

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProduct(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product" };
  const { images, ...data } = parsed.data;

  const existing = await db.product.findUnique({ where: { slug: data.slug } });
  if (existing) return { ok: false, error: "That slug is already used by another product." };

  const product = await db.product.create({
    data: {
      ...data,
      images: {
        create: images.map((img, position) => ({ cloudinaryPublicId: img.publicId, alt: img.alt, position })),
      },
      // TODO: let the admin add variants/SKUs; for now one default SKU with zero stock.
      inventory: { create: { sku: `${data.slug}-default`.toUpperCase(), quantity: 0 } },
    },
  });

  revalidatePath("/admin/products");
  return { ok: true, id: product.id };
}

export async function updateInventory(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN");
  const parsed = inventoryUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid quantity" };

  const item = await db.inventoryItem.update({
    where: { id: parsed.data.inventoryItemId },
    data: { quantity: parsed.data.quantity },
  });
  revalidatePath("/admin/products");
  return { ok: true, id: item.id };
}

// TODO: updateProduct, archiveProduct, reorder/delete images (call deleteImage from lib/cloudinary).
