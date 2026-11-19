import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesChart, type SalesPoint } from "@/components/admin/sales-chart";
import { requireAdminPage } from "@/lib/admin";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = { title: "Admin dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading numbers…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  await requireAdminPage();
  const d = await getDashboardStats(30);
  // Paise -> rupees only for the chart's display.
  const series: SalesPoint[] = d.dailySalesPaise.map(({ day, paise }) => ({ day, rupees: paise / 100 }));

  const stats = [
    ["Revenue (30 days)", formatPaise(d.revenuePaise)],
    ["Orders (30 days)", d.orderCount.toString()],
    ["Active products", d.productCount.toString()],
    ["Low-stock SKUs", d.lowStock.toString()],
    ["Pending approvals", d.pendingApprovals.toString()],
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{value}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daily sales</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesChart data={series} />
        </CardContent>
      </Card>
    </>
  );
}
