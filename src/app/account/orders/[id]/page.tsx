import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPaise, lineTotalPaise } from "@/lib/money";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderChat } from "../order-chat";

export default function OrderDetailPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading order…</p>}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const { id } = await params;

  // Ownership check: only this user's order.
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: {
      items: true,
      shipments: { include: { events: { orderBy: { occurredAt: "desc" } } } },
    },
  });
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order {order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="divide-y rounded-xl border">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between p-4">
            <span>
              {i.productName} × {i.quantity}
            </span>
            <span>{formatPaise(lineTotalPaise(i.unitPricePaise, i.quantity))}</span>
          </li>
        ))}
        <li className="flex justify-between p-4 font-medium">
          <span>Total</span>
          <span>{formatPaise(order.totalPaise)}</span>
        </li>
      </ul>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Tracking</h2>
        {order.shipments.length === 0 && <p className="text-muted-foreground">Not shipped yet.</p>}
        {order.shipments.map((s) => (
          <div key={s.id} className="rounded-xl border p-4">
            <p className="font-medium">
              {s.courier} · {s.trackingNumber}
            </p>
            <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
              {s.events.map((e) => (
                <li key={e.id}>
                  {e.occurredAt.toLocaleString("en-IN")}: {e.message} {e.location && `(${e.location})`}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Questions about this order?</h2>
        <OrderChat orderId={order.id} />
      </section>
    </div>
  );
}
