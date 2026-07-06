import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Alert } from "@/lib/types";

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="min-h-[316px]">
      <CardHeader>
        <CardTitle>Alerts</CardTitle>
        <Badge variant="neutral">{alerts.length}</Badge>
      </CardHeader>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.severity === "low" ? CheckCircle2 : AlertTriangle;
          return (
            <div key={alert.id} className="rounded-md border border-line bg-[#fbfcfd] p-3">
              <div className="flex items-start gap-3">
                <Icon
                  className={alert.severity === "high" ? "text-coral" : alert.severity === "medium" ? "text-amber" : "text-mint"}
                  size={18}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{alert.title}</p>
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#617080]">{alert.detail}</p>
                  {alert.action ? <p className="mt-2 text-sm font-medium text-cobalt">{alert.action}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
