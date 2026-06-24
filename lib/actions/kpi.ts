"use server";

import { revalidatePath } from "next/cache";
import {
  GoalPeriodType,
  KpiMetricType,
  UserRole,
  type KpiGoal,
} from "@prisma/client";
import { getVisibleUserIds, resolveMetricsView } from "@/lib/auth/data-scope";
import { canManageTenantTeamGoals } from "@/lib/auth/rbac";
import {
  KPI_AMOUNT_METRICS,
  KPI_COUNT_METRICS,
  KPI_DAILY_TABLE_METRICS,
  KPI_GOAL_METRICS,
  KPI_PIPELINE_COUNT_METRICS,
  KPI_TRANSITION_COUNT_METRICS,
  KPI_WIDGET_AMOUNT_METRICS,
  KPI_WIDGET_COUNT_METRICS,
  metricProgressPercent,
} from "@/lib/kpi/constants";
import {
  currentYearMonth,
  formatMonthLabel,
  monthPeriodFromYearMonth,
  parseYearMonth,
  periodEndExclusive,
  startOfMonth,
} from "@/lib/kpi/dates";
import {
  computePeriodMetrics,
  computeDailyMetrics,
  type MetricScope,
} from "@/lib/kpi/metrics";
import { serializeKpiGoals, type KpiGoalRow } from "@/lib/kpi/serialize";
import { requireTenantContext } from "@/lib/tenant/context";
import { getActiveUsersForAssignment } from "@/lib/users/queries";
import { prisma } from "@/lib/prisma";
import { kpiGoalsBulkSchema, parseBulkGoalTargets } from "@/lib/validators/kpi";

export type KpiGoalActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export type KpiProgressItem = {
  metricType: KpiMetricType;
  actual: number;
  target: number;
  progressPercent: number;
};

export type KpiDashboardData = {
  yearMonth: string;
  scope: "personal" | "team";
  scopeUserId: string | null;
  scopeLabel: string;
  canManageTeamGoals: boolean;
  canSelectUser: boolean;
  assignableUsers: Awaited<ReturnType<typeof getActiveUsersForAssignment>>;
  transitionCountProgress: KpiProgressItem[];
  pipelineCountProgress: KpiProgressItem[];
  amountProgress: KpiProgressItem[];
  dailyRows: Awaited<ReturnType<typeof computeDailyMetrics>>;
  totalOutboundComms: number;
  snapshotAsOfLabel: string;
};

function buildProgressItems(
  metricTypes: readonly KpiMetricType[],
  actuals: Partial<Record<KpiMetricType, number>>,
  goalMap: Map<KpiMetricType, number>
): KpiProgressItem[] {
  return metricTypes.map((metricType) => {
    const actual = actuals[metricType] ?? 0;
    const target = goalMap.get(metricType) ?? 0;
    return {
      metricType,
      actual,
      target,
      progressPercent: metricProgressPercent(actual, target),
    };
  });
}


export async function getKpiDashboardData(options?: {
  yearMonth?: string;
  scope?: "personal" | "team";
  userId?: string;
}): Promise<KpiDashboardData> {
  const { user, tenantId } = await requireTenantContext();
  const yearMonth = options?.yearMonth ?? currentYearMonth();

  const metricsView = await resolveMetricsView(user, tenantId, {
    scope: options?.scope,
    userId: options?.userId,
  });
  const { scopeUserId, metricScope, scopeLabel } = metricsView;

  const { periodStart, periodEnd } = monthPeriodFromYearMonth(yearMonth);
  const range = {
    from: periodStart,
    to: periodEndExclusive(periodStart, GoalPeriodType.MONTHLY),
  };

  const [goals, totalOutboundComms] = await Promise.all([
    prisma.kpiGoal.findMany({
      where: {
        tenantId,
        userId: scopeUserId,
        periodType: GoalPeriodType.MONTHLY,
        periodStart,
      },
    }),
    prisma.communication.count({
      where: {
        direction: "OUTBOUND",
        occurredAt: { gte: range.from, lt: range.to },
        user: scopeUserId
          ? { id: scopeUserId, tenantId }
          : metricScope.userIds?.length
            ? { id: { in: metricScope.userIds }, tenantId }
            : { tenantId, isActive: true },
        candidate: { deletedAt: null },
      },
    }),
  ]);

  const actuals = await computePeriodMetrics(
    metricScope,
    KPI_GOAL_METRICS,
    range
  );
  const dailyRows = await computeDailyMetrics(
    metricScope,
    KPI_DAILY_TABLE_METRICS,
    periodStart,
    periodEnd
  );

  const goalMap = new Map(
    goals.map((g) => [g.metricType, Number(g.targetValue)])
  );

  const amountProgress = buildProgressItems(
    KPI_AMOUNT_METRICS,
    actuals,
    goalMap
  );

  const transitionCountProgress = buildProgressItems(
    KPI_TRANSITION_COUNT_METRICS,
    actuals,
    goalMap
  );
  const pipelineCountProgress = buildProgressItems(
    KPI_PIPELINE_COUNT_METRICS,
    actuals,
    goalMap
  );

  const isCurrentMonth = yearMonth === currentYearMonth();
  const snapshotAsOfLabel = isCurrentMonth
    ? "本日時点"
    : `${formatMonthLabel(yearMonth)}末時点`;

  return {
    yearMonth,
    scope: metricsView.scopeMode,
    scopeUserId,
    scopeLabel,
    canManageTeamGoals: metricsView.canManageTeamGoals,
    canSelectUser: metricsView.canSelectUser,
    assignableUsers: metricsView.visibleUsers,
    transitionCountProgress,
    pipelineCountProgress,
    amountProgress,
    dailyRows,
    totalOutboundComms,
    snapshotAsOfLabel,
  };
}

export async function getKpiWidgetSummary(): Promise<{
  yearMonth: string;
  countItems: KpiProgressItem[];
  amountItems: KpiProgressItem[];
}> {
  const { user, tenantId } = await requireTenantContext();
  const yearMonth = currentYearMonth();
  const { periodStart } = monthPeriodFromYearMonth(yearMonth);
  const range = {
    from: periodStart,
    to: periodEndExclusive(periodStart, GoalPeriodType.MONTHLY),
  };

  const metricScope: MetricScope = { tenantId, userId: user.id };
  const widgetMetrics = [
    ...KPI_WIDGET_COUNT_METRICS,
    ...KPI_WIDGET_AMOUNT_METRICS,
  ];

  const [actuals, goals] = await Promise.all([
    computePeriodMetrics(metricScope, widgetMetrics, range),
    prisma.kpiGoal.findMany({
      where: {
        tenantId,
        userId: user.id,
        periodType: GoalPeriodType.MONTHLY,
        periodStart,
        metricType: { in: [...widgetMetrics] },
      },
    }),
  ]);

  const goalMap = new Map(
    goals.map((g) => [g.metricType, Number(g.targetValue)])
  );

  return {
    yearMonth,
    countItems: buildProgressItems(KPI_WIDGET_COUNT_METRICS, actuals, goalMap),
    amountItems: buildProgressItems(
      KPI_WIDGET_AMOUNT_METRICS,
      actuals,
      goalMap
    ),
  };
}

export async function getKpiGoalsForMonth(yearMonth: string): Promise<{
  yearMonth: string;
  personalCountGoals: KpiGoalRow[];
  personalAmountGoals: KpiGoalRow[];
  teamCountGoals: KpiGoalRow[];
  teamAmountGoals: KpiGoalRow[];
  canManageTeamGoals: boolean;
}> {
  const { user, tenantId } = await requireTenantContext();
  const canManageTeam = canManageTenantTeamGoals(user.role);
  const { periodStart } = monthPeriodFromYearMonth(yearMonth);

  const countTypes = [...KPI_COUNT_METRICS];
  const amountTypes = [...KPI_AMOUNT_METRICS];

  const [personalGoals, teamGoals] = await Promise.all([
    prisma.kpiGoal.findMany({
      where: {
        tenantId,
        userId: user.id,
        periodType: GoalPeriodType.MONTHLY,
        periodStart,
      },
      orderBy: { metricType: "asc" },
    }),
    canManageTeam
      ? prisma.kpiGoal.findMany({
          where: {
            tenantId,
            userId: null,
            periodType: GoalPeriodType.MONTHLY,
            periodStart,
          },
          orderBy: { metricType: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const isCount = (g: KpiGoal) =>
    (countTypes as KpiMetricType[]).includes(g.metricType);

  return {
    yearMonth,
    personalCountGoals: serializeKpiGoals(personalGoals.filter(isCount)),
    personalAmountGoals: serializeKpiGoals(
      personalGoals.filter((g) => !isCount(g))
    ),
    teamCountGoals: serializeKpiGoals(teamGoals.filter(isCount)),
    teamAmountGoals: serializeKpiGoals(teamGoals.filter((g) => !isCount(g))),
    canManageTeamGoals: canManageTeam,
  };
}

export async function upsertKpiGoalsBulkAction(
  _prev: KpiGoalActionState,
  formData: FormData
): Promise<KpiGoalActionState> {
  const { user, tenantId } = await requireTenantContext();

  const parsed = kpiGoalsBulkSchema.safeParse({
    yearMonth: formData.get("yearMonth"),
    scope: formData.get("scope") || "personal",
    userId: formData.get("userId") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { yearMonth, scope } = parsed.data;
  const targets = parseBulkGoalTargets(formData);

  if (Object.keys(targets).length === 0) {
    return { error: "1件以上の目標値を入力してください" };
  }

  const { year, month } = parseYearMonth(yearMonth);
  const periodStart = startOfMonth(year, month);
  const periodType = GoalPeriodType.MONTHLY;

  let goalUserId: string | null = user.id;
  if (scope === "team") {
    if (!canManageTenantTeamGoals(user.role)) {
      return { error: "チーム目標を設定する権限がありません" };
    }
    goalUserId = null;
  } else if (parsed.data.userId) {
    const visibleUserIds = await getVisibleUserIds(user, tenantId);
    if (!visibleUserIds.includes(parsed.data.userId)) {
      return { error: "他ユーザーの目標を設定する権限がありません" };
    }
    goalUserId = parsed.data.userId;
  }

  if (goalUserId) {
    const targetUser = await prisma.user.findFirst({
      where: { id: goalUserId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!targetUser) {
      return { error: "指定されたユーザーが見つかりません" };
    }
  }

  for (const [metricType, targetValue] of Object.entries(targets) as [
    KpiMetricType,
    number,
  ][]) {
    if (!(KPI_GOAL_METRICS as readonly KpiMetricType[]).includes(metricType)) {
      continue;
    }

    const existing = await prisma.kpiGoal.findFirst({
      where: {
        tenantId,
        userId: goalUserId,
        metricType,
        periodType,
        periodStart,
      },
    });

    if (existing) {
      await prisma.kpiGoal.update({
        where: { id: existing.id },
        data: { targetValue },
      });
    } else {
      await prisma.kpiGoal.create({
        data: {
          tenantId,
          userId: goalUserId,
          metricType,
          periodType,
          periodStart,
          targetValue,
        },
      });
    }
  }

  revalidatePath("/kpi");
  revalidatePath("/kpi/goals");
  revalidatePath("/dashboard");

  return { success: true };
}

/** @deprecated upsertKpiGoalsBulkAction を使用 */
export async function upsertKpiGoalAction(
  _prev: KpiGoalActionState,
  formData: FormData
): Promise<KpiGoalActionState> {
  return upsertKpiGoalsBulkAction(_prev, formData);
}

export async function deleteKpiGoalAction(goalId: string): Promise<KpiGoalActionState> {
  const { user, tenantId } = await requireTenantContext();

  const goal = await prisma.kpiGoal.findFirst({
    where: { id: goalId, tenantId },
  });

  if (!goal) {
    return { error: "目標が見つかりません" };
  }

  if (goal.userId === null && !canManageTenantTeamGoals(user.role)) {
    return { error: "チーム目標を削除する権限がありません" };
  }

  if (goal.userId && goal.userId !== user.id) {
    const visibleUserIds = await getVisibleUserIds(user, tenantId);
    if (!visibleUserIds.includes(goal.userId)) {
      return { error: "この目標を削除する権限がありません" };
    }
  }

  await prisma.kpiGoal.delete({ where: { id: goalId } });

  revalidatePath("/kpi");
  revalidatePath("/kpi/goals");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function listKpiGoalsForAdmin(yearMonth: string) {
  const { user, tenantId } = await requireTenantContext();

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.MANAGER &&
    user.role !== UserRole.DEVELOP
  ) {
    return [];
  }

  const { periodStart } = monthPeriodFromYearMonth(yearMonth);
  const visibleUserIds =
    user.role === UserRole.MANAGER
      ? await getVisibleUserIds(user, tenantId)
      : null;

  return prisma.kpiGoal.findMany({
    where: {
      tenantId,
      periodType: GoalPeriodType.MONTHLY,
      periodStart,
      ...(visibleUserIds
        ? {
            OR: [{ userId: null }, { userId: { in: visibleUserIds } }],
          }
        : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, lastName: true, firstName: true },
      },
    },
    orderBy: [{ userId: "asc" }, { metricType: "asc" }],
  });
}
