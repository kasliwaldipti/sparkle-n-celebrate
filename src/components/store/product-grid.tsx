import { ProductCard } from "@/components/store/product-card";
import { listActiveProducts } from "@/lib/queries/products";

export async function ProductGrid({ limit }: { limit?: number }) {
  const products = await listActiveProducts(limit);
  if (products.length === 0) {
    return <p className="text-muted-foreground">No products yet. Check back soon!</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
