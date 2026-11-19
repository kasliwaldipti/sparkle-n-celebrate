import "server-only";
import { db } from "@/lib/db";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/** Admin dashboard numbers for the last `days` days. Money stays in paise. */
export async function getDashboardStats(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const paidSince = { status: { in: [...PAID_STATUSES] }, createdAt: { gte: since } };

  const [revenue, orderCount, productCount, lowStock, pendingApprovals, paidOrders] = await Promise.all([
    db.order.aggregate({ _sum: { totalPaise: true }, where: paidSince }),
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.product.count({ where: { isActive: true } }),
    db.inventoryItem.count({ where: { quantity: { lte: 5 } } }), // TODO: compare to lowStockThreshold per item
    db.approvalRequest.count({ where: { status: "PENDING" } }),
    db.order.findMany({ where: paidSince, select: { createdAt: true, totalPaise: true } }),
  ]);

  const byDay = new Map<string, number>();
  for (const o of paidOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + o.totalPaise);
  }
  const dailySalesPaise = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, paise]) => ({ day, paise }));

  return {
    revenuePaise: revenue._sum.totalPaise ?? 0,
    orderCount,
    productCount,
    lowStock,
    pendingApprovals,
    dailySalesPaise,
  };
}
