import { KpiMetricType } from "@prisma/client";
import { toDateOnly } from "@/lib/kpi/dates";
import type { MetricScope } from "@/lib/kpi/metrics";
import { prisma } from "@/lib/prisma";

function dateKey(date: Date): string {
  return toDateOnly(date).toISOString().slice(0, 10);
}

function buildCacheWhere(
  scope: MetricScope,
  metricTypes: readonly KpiMetricType[],
  from: Date,
  to: Date
) {
  const base = {
    tenantId: scope.tenantId,
    metricType: { in: [...metricTypes] as KpiMetricType[] },
    date: { gte: toDateOnly(from), lte: toDateOnly(to) },
  };

  if (scope.userId) {
    return { ...base, userId: scope.userId };
  }

  if (scope.userIds?.length) {
    return { ...base, userId: { in: scope.userIds } };
  }

  return { ...base, userId: null };
}

/** 日次キャッシュを date → metricType → value で返す */
export async function readDailyMetricsCache(
  scope: MetricScope,
  metricTypes: readonly KpiMetricType[],
  from: Date,
  to: Date
): Promise<Map<string, Partial<Record<KpiMetricType, number>>>> {
  const rows = await prisma.activityMetricDaily.findMany({
    where: buildCacheWhere(scope, metricTypes, from, to),
    select: { date: true, metricType: true, value: true, userId: true },
  });

  const byDate = new Map<string, Partial<Record<KpiMetricType, number>>>();

  for (const row of rows) {
    const key = dateKey(row.date);
    const bucket = byDate.get(key) ?? {};
    const value = Number(row.value);

    if (scope.userIds?.length && row.userId) {
      bucket[row.metricType] = (bucket[row.metricType] ?? 0) + value;
    } else {
      bucket[row.metricType] = value;
    }

    byDate.set(key, bucket);
  }

  return byDate;
}

export function hasFullDailyCache(
  cached: Map<string, Partial<Record<KpiMetricType, number>>>,
  date: Date,
  metricTypes: readonly KpiMetricType[]
): boolean {
  const values = cached.get(dateKey(date));
  if (!values) return false;
  return metricTypes.every((metricType) => values[metricType] !== undefined);
}
