import { cn } from "@/lib/utils";
import {
  KPI_METRIC_UNITS,
  formatMetricValue,
  getMetricLabel,
  type MetricLabelContext,
} from "@/lib/kpi/constants";
import type { KpiProgressItem } from "@/lib/actions/kpi";

type KpiProgressCardProps = {
  item: KpiProgressItem;
  unitSuffix?: string;
  compact?: boolean;
  labelContext?: MetricLabelContext;
};

export function KpiProgressCard({
  item,
  unitSuffix,
  compact,
  labelContext = "default",
}: KpiProgressCardProps) {
  const { metricType, actual, target, progressPercent } = item;
  const label = getMetricLabel(metricType, labelContext);
  const hasTarget = target > 0;

  return (
    <div className={cn("rounded-lg border bg-card p-4", compact && "p-3")}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          {label}
        </p>
        {hasTarget && (
          <span className="text-xs text-muted-foreground">{progressPercent}%</span>
        )}
      </div>
      <p className={cn("mt-1 font-bold", compact ? "text-xl" : "text-2xl")}>
        {formatMetricValue(metricType, actual)}
        {unitSuffix && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {unitSuffix}
          </span>
        )}
      </p>
      {hasTarget ? (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            目標 {formatMetricValue(metricType, target)}
            {unitSuffix ?? ""}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">目標未設定</p>
      )}
    </div>
  );
}

type KpiMetricGridProps = {
  items: KpiProgressItem[];
  unitSuffix?: string;
  labelContext?: MetricLabelContext;
};

export function KpiMetricGrid({
  items,
  unitSuffix,
  labelContext = "default",
}: KpiMetricGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <KpiProgressCard
          key={item.metricType}
          item={item}
          unitSuffix={unitSuffix ?? KPI_METRIC_UNITS[item.metricType]}
          labelContext={labelContext}
        />
      ))}
    </div>
  );
}
