import { GoalPeriodType, KpiMetricType } from "@prisma/client";
import type { AnalyticsFilters } from "@/lib/analytics/filters";
import {
  currentYearMonth,
  formatMonthLabel,
  formatYearMonth,
  monthPeriodFromYearMonth,
  parseYearMonth,
  periodEndExclusive,
  toDateOnly,
} from "@/lib/kpi/dates";
import { metricProgressPercent } from "@/lib/kpi/constants";
import { computeMetricValue, type MetricScope } from "@/lib/kpi/metrics";
import { prisma } from "@/lib/prisma";

export type ExecutiveSummary = {
  yearMonth: string;
  monthLabel: string;
  salesTarget: number;
  salesActual: number;
  achievementRate: number | null;
  monthEndForecast: number | null;
  isCurrentMonth: boolean;
  elapsedDays: number;
  daysInMonth: number;
};

export function resolveExecutiveYearMonth(filters: AnalyticsFilters): string {
  switch (filters.period) {
    case "week":
      return formatYearMonth(new Date(`${filters.weekStart}T00:00:00.000Z`));
    case "day":
      return formatYearMonth(new Date(`${filters.dateFrom}T00:00:00.000Z`));
    default:
      return filters.yearMonth;
  }
}

function daysInMonth(yearMonth: string): number {
  const { year, month } = parseYearMonth(yearMonth);
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function elapsedDaysInMonth(yearMonth: string, now: Date): number {
  const { year, month } = parseYearMonth(yearMonth);
  const monthStart = toDateOnly(new Date(Date.UTC(year, month, 1)));
  const today = toDateOnly(now);
  const currentYm = formatYearMonth(now);

  if (yearMonth < currentYm) {
    return daysInMonth(yearMonth);
  }
  if (yearMonth > currentYm) {
    return 0;
  }

  const diffMs = today.getTime() - monthStart.getTime();
  return Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
}

/** 内部単位（万円）を十万円単位（= 10 万円刻み）に丸める */
export function roundToHundredThousandYen(amountInMan: number): number {
  return Math.round(amountInMan / 10) * 10;
}

function computeMonthEndForecast(
  salesActual: number,
  elapsed: number,
  totalDays: number,
  isCurrentMonth: boolean
): number | null {
  if (!isCurrentMonth) return null;

  let linearForecast: number;
  if (elapsed > 0 && elapsed < totalDays) {
    linearForecast = (salesActual / elapsed) * totalDays;
  } else if (elapsed >= totalDays) {
    linearForecast = salesActual;
  } else {
    return null;
  }

  return roundToHundredThousandYen(linearForecast);
}

export async function computeExecutiveSummary(
  tenantId: string,
  metricScope: MetricScope,
  filters: AnalyticsFilters
): Promise<ExecutiveSummary> {
  const yearMonth = resolveExecutiveYearMonth(filters);
  const { periodStart } = monthPeriodFromYearMonth(yearMonth);
  const monthEndExclusive = periodEndExclusive(
    periodStart,
    GoalPeriodType.MONTHLY
  );
  const now = new Date();
  const isCurrentMonth = yearMonth === currentYearMonth();
  const totalDays = daysInMonth(yearMonth);
  const elapsed = elapsedDaysInMonth(yearMonth, now);

  const actualRange = {
    from: periodStart,
    to: isCurrentMonth ? now : monthEndExclusive,
  };

  const [goal, salesActual] = await Promise.all([
    prisma.kpiGoal.findFirst({
      where: {
        tenantId,
        userId: null,
        metricType: KpiMetricType.JOINED_AMOUNT,
        periodType: GoalPeriodType.MONTHLY,
        periodStart,
      },
      select: { targetValue: true },
    }),
    computeMetricValue(metricScope, KpiMetricType.JOINED_AMOUNT, actualRange),
  ]);

  const salesTarget = goal ? Number(goal.targetValue) : 0;
  const achievementRate =
    salesTarget > 0 ? metricProgressPercent(salesActual, salesTarget) : null;

  let monthEndForecast: number | null = computeMonthEndForecast(
    salesActual,
    elapsed,
    totalDays,
    isCurrentMonth
  );

  return {
    yearMonth,
    monthLabel: formatMonthLabel(yearMonth),
    salesTarget,
    salesActual,
    achievementRate,
    monthEndForecast,
    isCurrentMonth,
    elapsedDays: elapsed,
    daysInMonth: totalDays,
  };
}
