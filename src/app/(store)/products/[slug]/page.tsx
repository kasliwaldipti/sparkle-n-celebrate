import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug } from "@/lib/queries/products";
import { formatPaise } from "@/lib/money";
import { AddToCartButton } from "@/components/store/add-to-cart-button";

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const inStock = product.inventory.filter((i) => i.quantity > 0);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-3">
        {product.images.length === 0 && <div className="aspect-square rounded-xl bg-muted" />}
        {product.images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <Image
              src={img.cloudinaryPublicId}
              alt={img.alt ?? product.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {product.category && <Badge variant="secondary">{product.category.name}</Badge>}
        <h1 className="text-3xl font-semibold">{product.name}</h1>
        <p className="text-2xl">{formatPaise(product.pricePaise)}</p>
        <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
        {inStock.length > 0 ? (
          <AddToCartButton
            variants={inStock.map((i) => ({ id: i.id, label: i.variant ?? "Standard" }))}
            name={product.name}
            pricePaise={product.pricePaise}
          />
        ) : (
          <p className="font-medium text-destructive">Out of stock</p>
        )}
      </div>
    </div>
  );
}
