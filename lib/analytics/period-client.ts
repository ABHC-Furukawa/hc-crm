import { addDays, toDateOnly } from "@/lib/kpi/dates";

export type AnalyticsPeriodType = "month" | "week" | "day";

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriodType, string> = {
  month: "月次",
  week: "週次",
  day: "日次",
};

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(value: string | undefined, fallback: Date): Date {
  if (!value) return toDateOnly(fallback);
  const match = ISO_DATE_RE.exec(value);
  if (!match) return toDateOnly(fallback);
  return new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );
}

export function formatIsoDate(date: Date): string {
  const d = toDateOnly(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeekMonday(date: Date): Date {
  const d = toDateOnly(date);
  const weekday = d.getUTCDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(d, -daysFromMonday);
}

export function currentWeekStart(): string {
  return formatIsoDate(startOfWeekMonday(new Date()));
}

export function shiftWeek(weekStart: string, deltaWeeks: number): string {
  const start = parseIsoDate(weekStart, new Date());
  return formatIsoDate(addDays(start, deltaWeeks * 7));
}

export function formatWeekLabel(weekStart: string): string {
  const start = parseIsoDate(weekStart, new Date());
  const end = addDays(start, 6);
  return `${formatIsoDate(start)} 〜 ${formatIsoDate(end)}`;
}
