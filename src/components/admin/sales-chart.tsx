"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface SalesPoint {
  day: string;
  rupees: number;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function SalesChart({ data }: { data: SalesPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No paid orders in the last 30 days.</p>;
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" tickLine={false} fontSize={12} />
          <YAxis tickFormatter={(v: number) => inr.format(v)} width={80} fontSize={12} />
          <Tooltip formatter={(v) => inr.format(Number(v))} />
          <Bar dataKey="rupees" name="Sales" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
