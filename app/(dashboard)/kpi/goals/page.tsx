import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getKpiGoalsForMonth } from "@/lib/actions/kpi";
import { currentYearMonth, formatMonthLabel } from "@/lib/kpi/dates";
import { kpiGoalsToInitialValues } from "@/lib/kpi/serialize";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { KpiGoalsBulkForm } from "@/components/kpi/kpi-goals-bulk-form";
import { KpiGoalsTable } from "@/components/kpi/kpi-goals-table";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{ yearMonth?: string }>;
};

export default async function KpiGoalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const yearMonth = params.yearMonth ?? currentYearMonth();
  const {
    personalCountGoals,
    personalAmountGoals,
    teamCountGoals,
    teamAmountGoals,
    canManageTeamGoals,
  } = await getKpiGoalsForMonth(yearMonth);

  const personalInitial = kpiGoalsToInitialValues([
    ...personalCountGoals,
    ...personalAmountGoals,
  ]);
  const teamInitial = kpiGoalsToInitialValues([
    ...teamCountGoals,
    ...teamAmountGoals,
  ]);

  return (
    <>
      <DashboardHeader title="月次目標設定" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/kpi?yearMonth=${yearMonth}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              KPI ダッシュボード
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {formatMonthLabel(yearMonth)}
          </p>
        </div>

        <KpiGoalsBulkForm
          yearMonth={yearMonth}
          scope="personal"
          title="個人目標"
          initialValues={personalInitial}
        />

        {canManageTeamGoals && (
          <KpiGoalsBulkForm
            yearMonth={yearMonth}
            scope="team"
            title="チーム目標"
            initialValues={teamInitial}
          />
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">設定済み — 個人</h2>
          <KpiGoalsTable
            goals={personalCountGoals}
            title="数値面"
            unitSuffix="名"
            emptyMessage="数値面の個人目標がまだ設定されていません"
          />
          <KpiGoalsTable
            goals={personalAmountGoals}
            title="金額面"
            unitSuffix="万円"
            emptyMessage="金額面の個人目標がまだ設定されていません"
          />
        </section>

        {canManageTeamGoals && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">設定済み — チーム</h2>
            <KpiGoalsTable
              goals={teamCountGoals}
              title="数値面"
              unitSuffix="名"
              emptyMessage="数値面のチーム目標がまだ設定されていません"
            />
            <KpiGoalsTable
              goals={teamAmountGoals}
              title="金額面"
              unitSuffix="万円"
              emptyMessage="金額面のチーム目標がまだ設定されていません"
            />
          </section>
        )}
      </main>
    </>
  );
}
