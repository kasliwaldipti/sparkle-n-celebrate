import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderChat } from "./order-chat";

export const metadata: Metadata = { title: "My Orders" };

export default function MyOrdersPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">My Orders</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading your orders…</p>}>
        <OrderList />
      </Suspense>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Ask about an order</h2>
        <OrderChat />
      </section>
    </div>
  );
}

async function OrderList() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/account/orders");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, status: true, totalPaise: true, createdAt: true },
  });

  if (orders.length === 0) {
    return <p className="text-muted-foreground">You haven&apos;t placed any orders yet.</p>;
  }

  return (
    <ul className="divide-y rounded-xl border">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50">
            <div>
              <p className="font-medium">{o.orderNumber}</p>
              <p className="text-sm text-muted-foreground">{o.createdAt.toLocaleDateString("en-IN")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span>{formatPaise(o.totalPaise)}</span>
              <OrderStatusBadge status={o.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
