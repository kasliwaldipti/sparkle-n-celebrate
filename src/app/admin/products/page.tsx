import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products & inventory</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          Add product
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <ProductTable />
      </Suspense>
    </div>
  );
}

async function ProductTable() {
  await requireAdminPage();
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { inventory: true, category: true },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.category?.name ?? "—"}</TableCell>
            <TableCell>{formatPaise(p.pricePaise)}</TableCell>
            {/* TODO: inline stock editing via updateInventory() */}
            <TableCell>{p.inventory.reduce((s, i) => s + i.quantity, 0)}</TableCell>
            <TableCell>{p.isActive ? "Active" : "Hidden"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
