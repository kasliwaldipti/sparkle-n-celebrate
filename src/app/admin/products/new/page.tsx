import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin";

export const metadata: Metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <Suspense>
        <Guarded />
      </Suspense>
    </div>
  );
}

async function Guarded() {
  await requireAdminPage();
  return <ProductForm />;
}
