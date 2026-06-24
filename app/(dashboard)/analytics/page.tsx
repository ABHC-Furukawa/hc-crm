import { Suspense } from "react";
import { getAnalyticsDashboardData } from "@/lib/actions/analytics";
import { ANALYTICS_PERIOD_LABELS } from "@/lib/analytics/period-client";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { AnalyticsPeriodFilters } from "@/components/analytics/analytics-period-filters";
import { ExecutiveSummaryCards } from "@/components/analytics/executive-summary-cards";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { FunnelStagesTable } from "@/components/analytics/funnel-stages-table";
import { FunnelCvrTable } from "@/components/analytics/funnel-cvr-table";
import { FunnelDailyTable } from "@/components/analytics/funnel-daily-table";
import { BottleneckCard } from "@/components/analytics/bottleneck-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{
    period?: string;
    yearMonth?: string;
    weekStart?: string;
    from?: string;
    to?: string;
    scope?: "personal" | "team";
    userId?: string;
  }>;
};

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getAnalyticsDashboardData(params);

  const periodUnit = ANALYTICS_PERIOD_LABELS[data.period];

  return (
    <>
      <DashboardHeader title="ファネル分析" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Suspense fallback={null}>
          <AnalyticsPeriodFilters
            period={data.period}
            yearMonth={data.yearMonth}
            weekStart={data.weekStart}
            dateFrom={data.dateFrom}
            dateTo={data.dateTo}
            scope={data.scope}
            scopeUserId={data.scopeUserId}
            canSelectUser={data.canSelectUser}
            assignableUsers={data.assignableUsers}
          />
        </Suspense>

        <p className="text-sm text-muted-foreground">
          表示中: <strong className="text-foreground">{data.scopeLabel}</strong>
          {" · "}
          {periodUnit} {data.periodLabel}
          {" · "}
          {data.aggregationHint}
        </p>

        {data.showExecutiveDashboard && data.executiveSummary && (
          <ExecutiveSummaryCards
            summary={data.executiveSummary}
            scopeLabel={data.scopeLabel}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>ファネルチャート</CardTitle>
                <CardDescription>
                  応募から入社までの{periodUnit}イベント件数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelChart stages={data.stages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ファネル（8 ステージ）</CardTitle>
                <CardDescription>
                  応募から入社までの{periodUnit}イベント件数
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelStagesTable stages={data.stages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ステージ間 CVR</CardTitle>
                <CardDescription>
                  下流件数 ÷ 上流件数（分母 0 の場合は —）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelCvrTable
                  conversions={data.conversions}
                  bottleneckFromStageId={data.bottleneck?.pair.fromStageId}
                  bottleneckToStageId={data.bottleneck?.pair.toStageId}
                />
              </CardContent>
            </Card>

            {data.showDailyTable && (
              <Card>
                <CardHeader>
                  <CardTitle>日次内訳</CardTitle>
                  <CardDescription>
                    期間内の日別ファネルイベント件数（最大 31 日）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FunnelDailyTable rows={data.dailyRows} />
                </CardContent>
              </Card>
            )}
          </div>

          <BottleneckCard
            bottleneck={data.bottleneck}
            overallConversionRate={data.overallConversionRate}
          />
        </div>
      </main>
    </>
  );
}
