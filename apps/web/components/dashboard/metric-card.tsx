import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number;
  delta: number | null;
  icon: LucideIcon;
}

export function MetricCard({ label, value, delta, icon: Icon }: MetricCardProps) {
  const positive = (delta ?? 0) >= 0;
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="min-h-32">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#617080]">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-ink">{currency.format(value)}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md bg-[#eef3f7] text-cobalt">
          <Icon aria-hidden="true" size={20} />
        </div>
      </div>
      {delta !== null ? (
        <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${positive ? "text-mint" : "text-coral"}`}>
          <DeltaIcon aria-hidden="true" size={16} />
          <span>{currency.format(Math.abs(delta))}</span>
        </div>
      ) : (
        <div className="mt-4 h-5" />
      )}
    </Card>
  );
}
