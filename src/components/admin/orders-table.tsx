"use client";

import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPaise } from "@/lib/money";
import type { OrderStatus } from "@/generated/prisma/enums";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customer: string;
  status: OrderStatus;
  totalPaise: number;
  createdAt: string;
}

const features = tableFeatures({});
const col = createColumnHelper<typeof features, AdminOrderRow>();

const columns = col.columns([
  col.accessor("orderNumber", { header: "Order" }),
  col.accessor("customer", { header: "Customer" }),
  col.accessor("status", { header: "Status", cell: (c) => <OrderStatusBadge status={c.getValue()} /> }),
  col.accessor("totalPaise", { header: "Total", cell: (c) => formatPaise(c.getValue()) }),
  col.accessor("createdAt", {
    header: "Placed",
    cell: (c) => new Date(c.getValue()).toLocaleDateString("en-IN"),
  }),
]);

// TODO: add sorting, filtering and pagination features.
export function OrdersTable({ data }: { data: AdminOrderRow[] }) {
  const table = useTable({ features, columns, data });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((h) => (
              <TableHead key={h.id}>
                <table.FlexRender header={h} />
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
