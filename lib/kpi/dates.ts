import { GoalPeriodType } from "@prisma/client";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toJstDateParts(date: Date): { year: number; month: number; day: number } {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth(),
    day: jst.getUTCDate(),
  };
}

/** JST 基準の日付（UTC midnight として保存） */
export function toDateOnly(date: Date): Date {
  const { year, month, day } = toJstDateParts(date);
  return new Date(Date.UTC(year, month, day));
}

export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) {
    const now = toJstDateParts(new Date());
    return { year: now.year, month: now.month };
  }
  return { year: Number(match[1]), month: Number(match[2]) - 1 };
}

export function formatYearMonth(date: Date): string {
  const { year, month } = toJstDateParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0));
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** 期間の終了（exclusive）— 翌日 0:00 JST */
export function periodEndExclusive(periodStart: Date, periodType: GoalPeriodType): Date {
  if (periodType === GoalPeriodType.WEEKLY) {
    return addDays(periodStart, 7);
  }
  const { year, month } = toJstDateParts(periodStart);
  return startOfMonth(year, month + 1);
}

export function eachDayInRange(start: Date, endInclusive: Date): Date[] {
  const days: Date[] = [];
  let cursor = toDateOnly(start);
  const end = toDateOnly(endInclusive);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** 日次集計用: [dayStart, nextDayStart) in UTC storage */
export function dayRange(date: Date): { gte: Date; lt: Date } {
  const day = toDateOnly(date);
  return { gte: day, lt: addDays(day, 1) };
}

export function formatMonthLabel(yearMonth: string): string {
  const { year, month } = parseYearMonth(yearMonth);
  return `${year}年${month + 1}月`;
}

export function shiftYearMonth(yearMonth: string, delta: number): string {
  const { year, month } = parseYearMonth(yearMonth);
  const d = new Date(Date.UTC(year, month + delta, 1));
  return formatYearMonth(d);
}

export function currentYearMonth(): string {
  return formatYearMonth(new Date());
}

export function monthPeriodFromYearMonth(yearMonth: string): {
  periodStart: Date;
  periodEnd: Date;
} {
  const { year, month } = parseYearMonth(yearMonth);
  return {
    periodStart: startOfMonth(year, month),
    periodEnd: endOfMonth(year, month),
  };
}

/**
 * スナップショット集計の基準日時。
 * - 過去月: 月末 23:59:59 JST 相当（翌月 0:00 exclusive の直前）
 * - 当月: 現在時刻（月末前のため）
 */
export function snapshotAsOfDate(periodEndExclusive: Date): Date {
  const now = new Date();
  return now < periodEndExclusive ? now : periodEndExclusive;
}
