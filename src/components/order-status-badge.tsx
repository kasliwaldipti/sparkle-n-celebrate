import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/generated/prisma/enums";

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Being packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = status === "CANCELLED" || status === "REFUNDED" ? "destructive" : "secondary";
  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
