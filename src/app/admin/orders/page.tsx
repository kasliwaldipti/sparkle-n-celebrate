import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersTable, type AdminOrderRow } from "@/components/admin/orders-table";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Orders />
      </Suspense>
    </div>
  );
}

async function Orders() {
  await requireAdminPage();
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200, // TODO: server-side pagination
    include: { user: { select: { email: true } } },
  });
  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.user.email,
    status: o.status,
    totalPaise: o.totalPaise,
    createdAt: o.createdAt.toISOString(),
  }));
  // TODO: order detail page with "add shipment" (creates Shipment + AfterShip tracking).
  return <OrdersTable data={rows} />;
}
