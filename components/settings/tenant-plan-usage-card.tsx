import { TenantLimitPolicy } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TENANT_LIMIT_POLICY_DESCRIPTIONS,
  TENANT_LIMIT_POLICY_LABELS,
  TENANT_RESOURCE_LABELS,
  type ResourceLimitConfig,
  type TenantLimitResource,
} from "@/lib/tenant/plan-config";
import type { TenantUsageCounts } from "@/lib/tenant/usage";
import { cn } from "@/lib/utils";

type TenantPlanUsageCardProps = {
  planLabel: string;
  usage: TenantUsageCounts;
  limits: Record<TenantLimitResource, ResourceLimitConfig>;
};

const RESOURCE_ORDER: TenantLimitResource[] = [
  "users",
  "callLeads",
  "candidates",
];

function usagePercent(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}

export function TenantPlanUsageCard({
  planLabel,
  usage,
  limits,
}: TenantPlanUsageCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>プラン・利用状況</CardTitle>
          <Badge variant="secondary">{planLabel}</Badge>
        </div>
        <CardDescription>
          現在のプランとリソース上限の利用状況です。上限数値は運用開始前に調整される場合があります。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {RESOURCE_ORDER.map((resource) => {
          const current = usage[resource];
          const { max, policy } = limits[resource];
          const percent = usagePercent(current, max);
          const atLimit = current >= max;
          const nearLimit = !atLimit && percent >= 90;

          return (
            <div key={resource} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {TENANT_RESOURCE_LABELS[resource]}
                </span>
                <span className={cn(atLimit && "font-medium text-destructive")}>
                  {current.toLocaleString()} / {max.toLocaleString()}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    atLimit
                      ? "bg-destructive"
                      : nearLimit
                        ? "bg-amber-500"
                        : "bg-primary"
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {atLimit && policy === TenantLimitPolicy.BLOCK && (
                <p className="text-xs text-destructive">
                  上限に達しています。新規登録・取込はできません。
                </p>
              )}
              {atLimit && policy === TenantLimitPolicy.EVICT_OLDEST && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  上限に達しています。新規作成時に古いデータが自動整理される場合があります。
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {TENANT_LIMIT_POLICY_LABELS[policy]}
                {policy === TenantLimitPolicy.EVICT_OLDEST && (
                  <> — {TENANT_LIMIT_POLICY_DESCRIPTIONS[policy]}</>
                )}
              </p>
            </div>
          );
        })}

        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">上限ポリシーについて</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>{TENANT_LIMIT_POLICY_DESCRIPTIONS[TenantLimitPolicy.BLOCK]}</li>
            <li>{TENANT_LIMIT_POLICY_DESCRIPTIONS[TenantLimitPolicy.EVICT_OLDEST]}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
