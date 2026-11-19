import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: slugSchema,
  description: z.string().trim().max(5000),
  pricePaise: z.int().nonnegative(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  images: z
    .array(z.object({ publicId: z.string().min(1), alt: z.string().max(200).optional() }))
    .max(10)
    .default([]),
});

export const inventoryUpdateSchema = z.object({
  inventoryItemId: z.string().min(1),
  quantity: z.int().nonnegative(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/** "Rose Gold Heart Pendant" -> "rose-gold-heart-pendant" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}
