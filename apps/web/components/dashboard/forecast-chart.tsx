"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compactDate, currency } from "@/lib/utils";
import type { ForecastSummary } from "@/lib/types";

export function ForecastChart({ forecast }: { forecast: ForecastSummary }) {
  return (
    <Card className="min-h-[360px]">
      <CardHeader>
        <CardTitle>30-Day Forecast</CardTitle>
        <Badge variant={forecast.risk}>{forecast.risk} risk</Badge>
      </CardHeader>
      <div className="h-[292px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecast.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2f6fed" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2f6fed" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e5e9ee" vertical={false} />
            <XAxis dataKey="date" tickFormatter={compactDate} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tickFormatter={(value) => currency.format(Number(value))} tickLine={false} axisLine={false} width={72} />
            <ReferenceLine y={5000} stroke="#c47f12" strokeDasharray="4 4" />
            <Tooltip
              formatter={(value: number, name: string) => [currency.format(value), name === "projected_balance" ? "Projected balance" : name]}
              labelFormatter={(value) => compactDate(String(value))}
            />
            <Area
              type="monotone"
              dataKey="projected_balance"
              stroke="#2f6fed"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              name="Projected balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
