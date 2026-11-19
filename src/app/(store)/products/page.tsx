import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid";

export const metadata: Metadata = { title: "Shop" };

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">All jewellery</h1>
      {/* TODO: category filters, sorting, pagination */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
