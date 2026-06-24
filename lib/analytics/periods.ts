import {
  addDays,
  currentYearMonth,
  formatMonthLabel,
  monthPeriodFromYearMonth,
  toDateOnly,
} from "@/lib/kpi/dates";
import {
  ANALYTICS_PERIOD_LABELS,
  currentWeekStart,
  formatIsoDate,
  formatWeekLabel,
  parseIsoDate,
  type AnalyticsPeriodType,
} from "@/lib/analytics/period-client";

export type { AnalyticsPeriodType };
export {
  ANALYTICS_PERIOD_LABELS,
  currentWeekStart,
  formatIsoDate,
  formatWeekLabel,
  parseIsoDate,
  shiftWeek,
} from "@/lib/analytics/period-client";

export function currentMonthDateRange(): { from: string; to: string } {
  const { periodStart, periodEnd } = monthPeriodFromYearMonth(currentYearMonth());
  const today = toDateOnly(new Date());
  const end = today < periodEnd ? today : periodEnd;
  return {
    from: formatIsoDate(periodStart),
    to: formatIsoDate(end),
  };
}

export type AnalyticsDateRange = {
  from: Date;
  to: Date;
  endInclusive: Date;
};

export function resolveMonthRange(yearMonth: string): AnalyticsDateRange {
  const { periodStart, periodEnd } = monthPeriodFromYearMonth(yearMonth);
  return {
    from: periodStart,
    to: addDays(periodEnd, 1),
    endInclusive: periodEnd,
  };
}

export function resolveWeekRange(weekStart: string): AnalyticsDateRange {
  const from = parseIsoDate(weekStart, new Date());
  const endInclusive = addDays(from, 6);
  return {
    from,
    to: addDays(from, 7),
    endInclusive,
  };
}

export function resolveDayRange(fromStr: string, toStr: string): AnalyticsDateRange {
  const from = parseIsoDate(fromStr, new Date());
  let endInclusive = parseIsoDate(toStr, from);
  if (endInclusive < from) {
    endInclusive = from;
  }
  const maxEnd = addDays(from, 30);
  if (endInclusive > maxEnd) {
    endInclusive = maxEnd;
  }
  return {
    from,
    to: addDays(endInclusive, 1),
    endInclusive,
  };
}

export function formatDayRangeLabel(fromStr: string, toStr: string): string {
  if (fromStr === toStr) return fromStr;
  return `${fromStr} 〜 ${toStr}`;
}

export function formatPeriodLabel(
  period: AnalyticsPeriodType,
  options: {
    yearMonth: string;
    weekStart: string;
    dateFrom: string;
    dateTo: string;
  }
): string {
  switch (period) {
    case "week":
      return formatWeekLabel(options.weekStart);
    case "day":
      return formatDayRangeLabel(options.dateFrom, options.dateTo);
    default:
      return formatMonthLabel(options.yearMonth);
  }
}

export function aggregationHintForPeriod(period: AnalyticsPeriodType): string {
  switch (period) {
    case "week":
      return "選択週内のイベント件数（期間イベント型）。各ステージは独立集計です。";
    case "day":
      return "選択日付範囲内のイベント件数（期間イベント型）。各ステージは独立集計です。";
    default:
      return "選択月内のイベント件数（期間イベント型）。各ステージは独立集計です。";
  }
}

/** 日次テーブル表示の最大日数 */
export const MAX_DAILY_TABLE_DAYS = 31;

export function shouldShowDailyTable(endInclusive: Date, from: Date): boolean {
  const days =
    Math.floor(
      (toDateOnly(endInclusive).getTime() - toDateOnly(from).getTime()) /
        (24 * 60 * 60 * 1000)
    ) + 1;
  return days >= 1 && days <= MAX_DAILY_TABLE_DAYS;
}
