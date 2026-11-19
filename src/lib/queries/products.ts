import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";
import type { ProductCardData } from "@/components/store/product-card";

// Read helpers for the store. They run at request time (not at build time, since CI has no DB).
// TODO: add "use cache" + cacheTag("products") once the DB is reachable at build time, and
// revalidateTag("products") from the admin product actions.

export async function listActiveProducts(limit = 24): Promise<ProductCardData[]> {
  await connection();
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    pricePaise: p.pricePaise,
    imagePublicId: p.images[0]?.cloudinaryPublicId ?? null,
    imageAlt: p.images[0]?.alt ?? null,
  }));
}

export async function getProductBySlug(slug: string) {
  await connection();
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      inventory: true,
      category: true,
    },
  });
}
