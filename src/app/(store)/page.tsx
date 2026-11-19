import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-grid";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* TODO: real hero image and copy */}
      <section className="rounded-2xl bg-muted px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="mt-3 text-muted-foreground">{siteConfig.tagline}</p>
        <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
          Shop the collection
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">New arrivals</h2>
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductGrid limit={8} />
        </Suspense>
      </section>
    </div>
  );
}
