"use server";

import { resolveMetricsView } from "@/lib/auth/data-scope";
import { canViewExecutiveDashboard } from "@/lib/auth/rbac";
import {
  computeFunnelConversions,
  computeOverallConversionRate,
  findFunnelBottleneck,
} from "@/lib/analytics/bottleneck";
import {
  computeExecutiveSummary,
  type ExecutiveSummary,
} from "@/lib/analytics/executive-metrics";
import {
  parseAnalyticsFilters,
  resolveAnalyticsPeriod,
  type AnalyticsFilters,
} from "@/lib/analytics/filters";
import type { AnalyticsPeriodType } from "@/lib/analytics/period-client";
import { shouldShowDailyTable } from "@/lib/analytics/periods";
import {
  computeDailyFunnelMetrics,
  computeFunnelStageCounts,
} from "@/lib/analytics/funnel-metrics";
import { requireTenantContext } from "@/lib/tenant/context";
import type { AssignableUser } from "@/lib/users/queries";

export type AnalyticsDashboardData = {
  period: AnalyticsPeriodType;
  yearMonth: string;
  weekStart: string;
  dateFrom: string;
  dateTo: string;
  scope: "personal" | "team";
  scopeUserId: string | null;
  scopeLabel: string;
  canSelectUser: boolean;
  assignableUsers: AssignableUser[];
  aggregationHint: string;
  periodLabel: string;
  stages: Awaited<ReturnType<typeof computeFunnelStageCounts>>;
  conversions: ReturnType<typeof computeFunnelConversions>;
  bottleneck: ReturnType<typeof findFunnelBottleneck>;
  overallConversionRate: number | null;
  dailyRows: Awaited<ReturnType<typeof computeDailyFunnelMetrics>>;
  showDailyTable: boolean;
  showExecutiveDashboard: boolean;
  executiveSummary: ExecutiveSummary | null;
};

export async function getAnalyticsDashboardData(options?: {
  period?: string;
  yearMonth?: string;
  weekStart?: string;
  from?: string;
  to?: string;
  scope?: "personal" | "team";
  userId?: string;
}): Promise<AnalyticsDashboardData> {
  const { user, tenantId } = await requireTenantContext();

  const filters: AnalyticsFilters = parseAnalyticsFilters(options ?? {});
  const { range, periodLabel, aggregationHint } =
    resolveAnalyticsPeriod(filters);

  const metricsView = await resolveMetricsView(user, tenantId, {
    scope: filters.scope,
    userId: filters.userId,
  });

  const queryRange = { from: range.from, to: range.to };

  const stages = await computeFunnelStageCounts(
    metricsView.metricScope,
    queryRange
  );

  const conversions = computeFunnelConversions(stages);
  const bottleneck = findFunnelBottleneck(conversions);
  const overallConversionRate = computeOverallConversionRate(stages);

  const showDailyTable = shouldShowDailyTable(
    range.endInclusive,
    range.from
  );

  const dailyRows = showDailyTable
    ? await computeDailyFunnelMetrics(
        metricsView.metricScope,
        range.from,
        range.endInclusive
      )
    : [];

  const showExecutiveDashboard = canViewExecutiveDashboard(user.role);
  const executiveSummary = showExecutiveDashboard
    ? await computeExecutiveSummary(
        tenantId,
        metricsView.metricScope,
        filters
      )
    : null;

  return {
    period: filters.period,
    yearMonth: filters.yearMonth,
    weekStart: filters.weekStart,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    scope: metricsView.scopeMode,
    scopeUserId: metricsView.scopeUserId,
    scopeLabel: metricsView.scopeLabel,
    canSelectUser: metricsView.canSelectUser,
    assignableUsers: metricsView.visibleUsers,
    aggregationHint,
    periodLabel,
    stages,
    conversions,
    bottleneck,
    overallConversionRate,
    dailyRows,
    showDailyTable,
    showExecutiveDashboard,
    executiveSummary,
  };
}
