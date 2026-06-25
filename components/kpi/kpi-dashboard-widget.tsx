import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { getKpiWidgetSummary } from "@/lib/actions/kpi";
import { KpiProgressCard } from "@/components/kpi/kpi-progress-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KPI_PIPELINE_PERIOD_AGGREGATION_HINT } from "@/lib/kpi/constants";
import { formatMonthLabel } from "@/lib/kpi/dates";

export async function KpiDashboardWidget() {
  const { yearMonth, countItems, amountItems } = await getKpiWidgetSummary();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">今月の KPI</CardTitle>
          <CardDescription>
            {formatMonthLabel(yearMonth)} · 個人 · {KPI_PIPELINE_PERIOD_AGGREGATION_HINT}
          </CardDescription>
        </div>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">数値面（名）</h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {countItems.map((item) => (
              <KpiProgressCard
                key={item.metricType}
                item={item}
                unitSuffix="名"
                compact
                labelContext="pipeline"
              />
            ))}
          </div>
        </section>
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            金額面（万円・累計）
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {amountItems.map((item) => (
              <KpiProgressCard
                key={item.metricType}
                item={item}
                unitSuffix="万円"
                compact
                labelContext="amount"
              />
            ))}
          </div>
        </section>
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href="/kpi">
            KPI ダッシュボード
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
