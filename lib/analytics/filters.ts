import {
  aggregationHintForPeriod,
  currentMonthDateRange,
  currentWeekStart,
  formatPeriodLabel,
  resolveDayRange,
  resolveMonthRange,
  resolveWeekRange,
  type AnalyticsDateRange,
  type AnalyticsPeriodType,
} from "@/lib/analytics/periods";
import { currentYearMonth } from "@/lib/kpi/dates";

export type AnalyticsFilters = {
  period: AnalyticsPeriodType;
  yearMonth: string;
  weekStart: string;
  dateFrom: string;
  dateTo: string;
  scope?: "personal" | "team";
  userId?: string;
};

export type ResolvedAnalyticsPeriod = {
  filters: AnalyticsFilters;
  range: AnalyticsDateRange;
  periodLabel: string;
  aggregationHint: string;
};

function parsePeriod(value: string | undefined): AnalyticsPeriodType {
  if (value === "week" || value === "day") return value;
  return "month";
}

export function parseAnalyticsFilters(params: {
  period?: string;
  yearMonth?: string;
  weekStart?: string;
  from?: string;
  to?: string;
  scope?: "personal" | "team";
  userId?: string;
}): AnalyticsFilters {
  const period = parsePeriod(params.period);
  const monthDefaults = currentMonthDateRange();

  return {
    period,
    yearMonth: params.yearMonth ?? currentYearMonth(),
    weekStart: params.weekStart ?? currentWeekStart(),
    dateFrom: params.from ?? monthDefaults.from,
    dateTo: params.to ?? monthDefaults.to,
    scope: params.scope,
    userId: params.userId,
  };
}

export function resolveAnalyticsPeriod(
  filters: AnalyticsFilters
): ResolvedAnalyticsPeriod {
  let range: AnalyticsDateRange;

  switch (filters.period) {
    case "week":
      range = resolveWeekRange(filters.weekStart);
      break;
    case "day":
      range = resolveDayRange(filters.dateFrom, filters.dateTo);
      break;
    default:
      range = resolveMonthRange(filters.yearMonth);
      break;
  }

  return {
    filters,
    range,
    periodLabel: formatPeriodLabel(filters.period, filters),
    aggregationHint: aggregationHintForPeriod(filters.period),
  };
}
