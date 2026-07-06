"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import type { CategorySpend } from "@/lib/types";

export function CategoryBreakdown({ categories }: { categories: CategorySpend[] }) {
  const data = categories.slice(0, 7);

  return (
    <Card className="min-h-[316px]">
      <CardHeader>
        <CardTitle>Top Expense Categories</CardTitle>
      </CardHeader>
      <div className="h-[248px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid stroke="#e5e9ee" horizontal={false} />
            <XAxis type="number" tickFormatter={(value) => currency.format(Number(value))} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="category" width={96} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => currency.format(value)} />
            <Bar dataKey="amount" name="Spend" fill="#c47f12" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
