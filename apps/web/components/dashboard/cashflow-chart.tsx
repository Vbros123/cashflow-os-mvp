"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { compactDate, currency } from "@/lib/utils";
import type { DailyCashflow } from "@/lib/types";

export function CashflowChart({ data }: { data: DailyCashflow[] }) {
  return (
    <Card className="min-h-[360px]">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
      </CardHeader>
      <div className="h-[292px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e5e9ee" vertical={false} />
            <XAxis dataKey="date" tickFormatter={compactDate} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tickFormatter={(value) => currency.format(Number(value))} tickLine={false} axisLine={false} width={72} />
            <Tooltip
              cursor={{ fill: "#eef3f7" }}
              formatter={(value: number, name: string) => [currency.format(value), name]}
              labelFormatter={(value) => compactDate(String(value))}
            />
            <Bar dataKey="income" name="Income" fill="#1f9d70" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#de5b49" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
