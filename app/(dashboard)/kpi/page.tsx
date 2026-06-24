import Link from "next/link";
import { Suspense } from "react";
import { getKpiDashboardData } from "@/lib/actions/kpi";
import {
  KPI_DAILY_TABLE_METRICS,
  KPI_SNAPSHOT_AGGREGATION_HINT,
  KPI_TRANSITION_AGGREGATION_HINT,
} from "@/lib/kpi/constants";
import { currentYearMonth, formatMonthLabel } from "@/lib/kpi/dates";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { KpiMetricGrid } from "@/components/kpi/kpi-progress-card";
import { KpiDailyTable } from "@/components/kpi/kpi-daily-table";
import { KpiScopeFilters } from "@/components/kpi/kpi-scope-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{
    yearMonth?: string;
    scope?: "personal" | "team";
    userId?: string;
  }>;
};

export default async function KpiPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getKpiDashboardData({
    yearMonth: params.yearMonth ?? currentYearMonth(),
    scope: params.scope,
    userId: params.userId,
  });

  return (
    <>
      <DashboardHeader title="KPI ダッシュボード" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Suspense fallback={null}>
          <KpiScopeFilters
            yearMonth={data.yearMonth}
            scope={data.scope}
            scopeUserId={data.scopeUserId}
            canSelectUser={data.canSelectUser}
            assignableUsers={data.assignableUsers}
          />
        </Suspense>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            表示中: <strong className="text-foreground">{data.scopeLabel}</strong>
            {" · "}
            アウトバウンド連絡 {data.totalOutboundComms} 件
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/kpi/goals?yearMonth=${data.yearMonth}`}>
              目標を編集
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">月次活動実績</h2>
            <p className="text-sm text-muted-foreground">
              {KPI_TRANSITION_AGGREGATION_HINT}（{formatMonthLabel(data.yearMonth)}）
            </p>
          </div>
          <KpiMetricGrid
            items={data.transitionCountProgress}
            labelContext="transition"
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">進行中パイプライン</h2>
            <p className="text-sm text-muted-foreground">
              {KPI_SNAPSHOT_AGGREGATION_HINT}（{data.snapshotAsOfLabel}）
            </p>
          </div>
          <KpiMetricGrid
            items={data.pipelineCountProgress}
            labelContext="pipeline"
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">金額面（万円・累計）</h2>
            <p className="text-sm text-muted-foreground">
              {KPI_SNAPSHOT_AGGREGATION_HINT}（{data.snapshotAsOfLabel}）
            </p>
          </div>
          <KpiMetricGrid
            items={data.amountProgress}
            unitSuffix="万円"
            labelContext="amount"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>日次行動量</CardTitle>
            <CardDescription>
              選択月の日別ステータス遷移件数。上の「スナップ」指標とは集計方式が異なります。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KpiDailyTable
              rows={data.dailyRows}
              highlightMetrics={[...KPI_DAILY_TABLE_METRICS]}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
