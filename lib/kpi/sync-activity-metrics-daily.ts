import { KpiMetricType } from "@prisma/client";
import { KPI_DAILY_TABLE_METRICS } from "@/lib/kpi/constants";
import { addDays, dayRange, eachDayInRange, toDateOnly } from "@/lib/kpi/dates";
import { computeMetricValue, type MetricScope } from "@/lib/kpi/metrics";
import { prisma } from "@/lib/prisma";

export type SyncActivityMetricsDailyOptions = {
  /** 省略時は昨日のみ */
  from?: Date;
  to?: Date;
  /** 省略時は全アクティブ tenant */
  tenantId?: string;
  /** 省略時は KPI_DAILY_TABLE_METRICS */
  metricTypes?: readonly KpiMetricType[];
};

export type SyncActivityMetricsDailyResult = {
  tenants: number;
  dates: number;
  upserted: number;
  from: string;
  to: string;
};

async function upsertDailyMetric(
  tenantId: string,
  userId: string | null,
  metricType: KpiMetricType,
  date: Date,
  value: number
): Promise<void> {
  const dateOnly = toDateOnly(date);
  const existing = await prisma.activityMetricDaily.findFirst({
    where: {
      tenantId,
      userId,
      metricType,
      date: dateOnly,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.activityMetricDaily.update({
      where: { id: existing.id },
      data: { value, computedAt: new Date() },
    });
    return;
  }

  await prisma.activityMetricDaily.create({
    data: {
      tenantId,
      userId,
      metricType,
      date: dateOnly,
      value,
    },
  });
}

async function syncScopeForDate(
  scope: MetricScope,
  metricTypes: readonly KpiMetricType[],
  date: Date
): Promise<number> {
  const { gte, lt } = dayRange(date);
  const range = { from: gte, to: lt };
  let count = 0;

  for (const metricType of metricTypes) {
    const value = await computeMetricValue(scope, metricType, range, {
      daily: true,
    });
    await upsertDailyMetric(
      scope.tenantId,
      scope.userId ?? null,
      metricType,
      date,
      value
    );
    count += 1;
  }

  return count;
}

function resolveSyncRange(options?: SyncActivityMetricsDailyOptions): {
  from: Date;
  to: Date;
} {
  if (options?.from && options?.to) {
    return {
      from: toDateOnly(options.from),
      to: toDateOnly(options.to),
    };
  }

  const yesterday = addDays(toDateOnly(new Date()), -1);
  return { from: yesterday, to: yesterday };
}

export async function syncActivityMetricsDaily(
  options?: SyncActivityMetricsDailyOptions
): Promise<SyncActivityMetricsDailyResult> {
  const { from, to } = resolveSyncRange(options);
  const metricTypes = options?.metricTypes ?? KPI_DAILY_TABLE_METRICS;
  const days = eachDayInRange(from, to);

  const tenants = await prisma.tenant.findMany({
    where: options?.tenantId ? { id: options.tenantId } : undefined,
    select: { id: true },
  });

  let upserted = 0;

  for (const tenant of tenants) {
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id, isActive: true },
      select: { id: true },
    });

    for (const date of days) {
      for (const user of users) {
        upserted += await syncScopeForDate(
          { tenantId: tenant.id, userId: user.id },
          metricTypes,
          date
        );
      }

      upserted += await syncScopeForDate(
        { tenantId: tenant.id, userId: null },
        metricTypes,
        date
      );
    }
  }

  return {
    tenants: tenants.length,
    dates: days.length,
    upserted,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function parseSyncRangeFromRequest(body: {
  days?: number;
  from?: string;
  to?: string;
}): { from: Date; to: Date } {
  if (body.from && body.to) {
    return {
      from: toDateOnly(new Date(body.from)),
      to: toDateOnly(new Date(body.to)),
    };
  }

  const days = Math.max(1, Math.min(body.days ?? 1, 366));
  const end = addDays(toDateOnly(new Date()), -1);
  const start = addDays(end, -(days - 1));
  return { from: start, to: end };
}
