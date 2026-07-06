"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Banknote, CalendarClock, Landmark, RefreshCcw, ShieldAlert, WalletCards } from "lucide-react";
import { AccountList } from "./account-list";
import { AlertsPanel } from "./alerts-panel";
import { CashflowChart } from "./cashflow-chart";
import { CategoryBreakdown } from "./category-breakdown";
import { ForecastChart } from "./forecast-chart";
import { MetricCard } from "./metric-card";
import { TransactionTable } from "./transaction-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { connectBank, fetchDashboard, syncTransactions } from "@/lib/api";
import { currency, fullDate } from "@/lib/utils";

const metricIcons = [WalletCards, Banknote, Activity, CalendarClock];

export function DashboardShell() {
  const queryClient = useQueryClient();
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, refetchInterval: 60_000 });
  const sync = useMutation({
    mutationFn: syncTransactions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  });
  const connect = useMutation({
    mutationFn: connectBank,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  });

  if (dashboard.isLoading) {
    return <LoadingDashboard />;
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-6">
        <Card className="max-w-xl">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 text-coral" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold text-ink">API unavailable</h1>
              <p className="mt-2 text-sm leading-6 text-[#617080]">
                Start the FastAPI service on port 8000, then refresh this page.
              </p>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  const data = dashboard.data;
  const shortage = data.forecast.shortage_date ? fullDate(data.forecast.shortage_date) : "No shortage";
  const runway = data.forecast.runway_days ? `${data.forecast.runway_days} days` : "Stable";

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-ink">Cashflow OS</h1>
              <Badge variant={data.forecast.risk}>{data.forecast.risk} risk</Badge>
            </div>
            <p className="mt-1 truncate text-sm text-[#617080]">{data.business.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => connect.mutate()} disabled={connect.isPending} title="Connect bank">
              <Landmark aria-hidden="true" size={16} />
              {connect.isPending ? "Connecting" : "Connect bank"}
            </Button>
            <Button variant="primary" onClick={() => sync.mutate()} disabled={sync.isPending} title="Sync transactions">
              <RefreshCcw aria-hidden="true" size={16} className={sync.isPending ? "animate-spin" : ""} />
              {sync.isPending ? "Syncing" : "Sync"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6 lg:py-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.summary.map((metric, index) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} delta={metric.delta} icon={metricIcons[index] ?? Activity} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <CashflowChart data={data.cashflow} />
          </div>
          <div className="xl:col-span-5">
            <ForecastChart forecast={data.forecast} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="min-h-[316px]">
            <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Runway</h2>
              <Badge variant={data.forecast.risk}>{data.forecast.risk}</Badge>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-sm text-[#617080]">Burn rate</p>
                <p className="mt-2 text-3xl font-semibold text-ink">{currency.format(data.forecast.burn_rate_daily)}/day</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-line bg-[#fbfcfd] p-3">
                  <p className="text-xs font-semibold uppercase text-[#617080]">Runway</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{runway}</p>
                </div>
                <div className="rounded-md border border-line bg-[#fbfcfd] p-3">
                  <p className="text-xs font-semibold uppercase text-[#617080]">Floor date</p>
                  <p className="mt-2 text-lg font-semibold text-ink">{shortage}</p>
                </div>
              </div>
              <div className="rounded-md border border-line bg-[#fbfcfd] p-3">
                <p className="text-xs font-semibold uppercase text-[#617080]">Forecast confidence</p>
                <div className="mt-3 h-2 rounded-full bg-[#e5e9ee]">
                  <div className="h-2 rounded-full bg-cobalt" style={{ width: `${Math.round(data.forecast.confidence * 100)}%` }} />
                </div>
              </div>
            </div>
          </Card>
          <AlertsPanel alerts={data.alerts} />
          <AccountList accounts={data.accounts} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <CategoryBreakdown categories={data.categories} />
          </div>
          <div className="xl:col-span-7">
            <TransactionTable transactions={data.transactions} />
          </div>
        </section>
      </div>
    </main>
  );
}

function LoadingDashboard() {
  return (
    <main className="mx-auto max-w-[1440px] space-y-4 p-4 sm:p-6">
      <div className="h-16 rounded-lg border border-line bg-white shadow-panel" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-lg border border-line bg-white shadow-panel" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-[360px] animate-pulse rounded-lg border border-line bg-white shadow-panel" />
        <div className="h-[360px] animate-pulse rounded-lg border border-line bg-white shadow-panel" />
      </div>
    </main>
  );
}
