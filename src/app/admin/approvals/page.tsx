import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";
import { reviewApproval } from "./actions";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Approval queue</h1>
        <p className="text-sm text-muted-foreground">
          Refunds, cancellations and address changes the order assistant has escalated. Nothing here happens
          automatically.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Queue />
      </Suspense>
    </div>
  );
}

async function Queue() {
  await requireAdminPage();
  const requests = await db.approvalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { order: { select: { orderNumber: true } }, user: { select: { email: true } } },
  });

  if (requests.length === 0) return <p className="text-muted-foreground">Nothing waiting. 🎉</p>;

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Badge>{r.type.replace("_", " ")}</Badge>
            <span className="font-medium">{r.order.orderNumber}</span>
            <span className="text-sm text-muted-foreground">{r.user.email}</span>
          </div>
          <p className="text-sm">{r.reason}</p>
          <form action={reviewApproval} className="flex gap-2">
            <input type="hidden" name="id" value={r.id} />
            <Button name="decision" value="APPROVED" size="sm">
              Approve
            </Button>
            <Button name="decision" value="REJECTED" size="sm" variant="outline">
              Reject
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
