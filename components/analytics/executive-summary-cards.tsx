import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMetricValue } from "@/lib/kpi/constants";
import { KpiMetricType } from "@prisma/client";
import type { ExecutiveSummary } from "@/lib/analytics/executive-metrics";

type ExecutiveSummaryCardsProps = {
  summary: ExecutiveSummary;
  scopeLabel: string;
};

function formatAmount(value: number): string {
  return `${formatMetricValue(KpiMetricType.JOINED_AMOUNT, value)} 万円`;
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function ExecutiveSummaryCards({
  summary,
  scopeLabel,
}: ExecutiveSummaryCardsProps) {
  const {
    monthLabel,
    salesTarget,
    salesActual,
    achievementRate,
    monthEndForecast,
    isCurrentMonth,
    elapsedDays,
    daysInMonth,
  } = summary;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          経営ダッシュボード
        </CardTitle>
        <CardDescription>
          {monthLabel} · {scopeLabel} · 入社売上（紹介料・万円）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="売上目標"
            value={
              salesTarget > 0 ? formatAmount(salesTarget) : "未設定"
            }
            description="チーム目標（JOINED_AMOUNT）"
          />
          <SummaryCard
            title="売上実績"
            value={formatAmount(salesActual)}
            description={
              isCurrentMonth
                ? `${elapsedDays} 日目までの入社遷移ベース`
                : "当月入社遷移ベース"
            }
          />
          <SummaryCard
            title="達成率"
            value={
              achievementRate !== null
                ? `${achievementRate.toLocaleString("ja-JP")}%`
                : "—"
            }
            description={
              salesTarget > 0
                ? `実績 ${formatAmount(salesActual)} / 目標 ${formatAmount(salesTarget)}`
                : "目標未設定のため算出不可"
            }
          />
          <SummaryCard
            title="月末着地予測"
            value={
              monthEndForecast !== null
                ? formatAmount(monthEndForecast)
                : isCurrentMonth
                  ? "—"
                  : "当月のみ"
            }
            description={
              monthEndForecast !== null
                ? `日次ペース (${elapsedDays}/${daysInMonth} 日) から線形予測 · 十万円単位`
                : isCurrentMonth
                  ? "予測に十分な日数がありません"
                  : "当月表示時のみ予測を表示"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
