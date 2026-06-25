import {
  ActivityAction,
  CandidateStatus,
  KpiMetricType,
  type Prisma,
} from "@prisma/client";
import {
  ENTRY_OR_BEYOND_STATUSES,
  INTERVIEW_SET_PIPELINE_STATUSES,
  isAmountMetric,
  isSnapshotMetric,
  usesTransitionPeriodAggregation,
} from "@/lib/kpi/constants";
import {
  hasFullDailyCache,
  readDailyMetricsCache,
} from "@/lib/kpi/daily-cache";
import { snapshotAsOfDate, dayRange, eachDayInRange, toDateOnly } from "@/lib/kpi/dates";
import { prisma } from "@/lib/prisma";

export type MetricScope = {
  tenantId: string;
  /** 個人指定。null かつ userIds 未指定 = tenant 全体 */
  userId: string | null;
  /** チーム集計（MANAGER 管下など） */
  userIds?: string[];
};

type DateRange = {
  from: Date;
  to: Date; // exclusive
};

type ComputeOptions = {
  /** 日次テーブル用 — スナップショットではなく当日の遷移を集計 */
  daily?: boolean;
  /** 同一リクエスト内のスナップショット再利用 */
  snapshotStatusMap?: Map<string, CandidateStatus>;
};

type StatusActivityMetadata = {
  from?: CandidateStatus;
  to?: CandidateStatus;
};

function scopedUserFilter(scope: MetricScope): Prisma.UserWhereInput {
  if (scope.userId) {
    return { id: scope.userId, tenantId: scope.tenantId };
  }
  if (scope.userIds?.length) {
    return {
      id: { in: scope.userIds },
      tenantId: scope.tenantId,
      isActive: true,
    };
  }
  return { tenantId: scope.tenantId, isActive: true };
}

function candidateAssignmentFilter(
  scope: MetricScope
): Prisma.CandidateAssignmentListRelationFilter {
  if (scope.userId) {
    return {
      some: {
        userId: scope.userId,
        unassignedAt: null,
      },
    };
  }

  if (scope.userIds?.length) {
    return {
      some: {
        userId: { in: scope.userIds },
        unassignedAt: null,
      },
    };
  }

  return {
    some: {
      unassignedAt: null,
      user: { tenantId: scope.tenantId, isActive: true },
    },
  };
}

function scopedCandidateWhere(
  scope: MetricScope,
  statusFilter?: Prisma.EnumCandidateStatusFilter
): Prisma.CandidateWhereInput {
  return {
    tenantId: scope.tenantId,
    deletedAt: null,
    assignments: candidateAssignmentFilter(scope),
    ...(statusFilter ? { status: statusFilter } : {}),
  };
}

function statusTransitionWhere(
  scope: MetricScope,
  range: DateRange,
  toStatuses: CandidateStatus | CandidateStatus[]
): Prisma.ActivityWhereInput {
  const statuses = Array.isArray(toStatuses) ? toStatuses : [toStatuses];

  return {
    action: ActivityAction.STATUS_CHANGED,
    entityType: "CANDIDATE",
    occurredAt: { gte: range.from, lt: range.to },
    user: scopedUserFilter(scope),
    OR: statuses.map((status) => ({
      metadata: { path: ["to"], equals: status },
    })),
  };
}

/** 選択月の基準日時点で各候補者のステータスを解決 */
export async function resolveCandidateStatusesAtDate(
  scope: MetricScope,
  asOf: Date
): Promise<Map<string, CandidateStatus>> {
  const candidates = await prisma.candidate.findMany({
    where: {
      ...scopedCandidateWhere(scope),
      createdAt: { lt: asOf },
    },
    select: { id: true, status: true },
  });

  if (candidates.length === 0) {
    return new Map();
  }

  const candidateIds = candidates.map((c) => c.id);
  const statusMap = new Map<string, CandidateStatus>();

  const activitiesBefore = await prisma.activity.findMany({
    where: {
      candidateId: { in: candidateIds },
      action: ActivityAction.STATUS_CHANGED,
      entityType: "CANDIDATE",
      occurredAt: { lt: asOf },
    },
    select: { candidateId: true, metadata: true, occurredAt: true },
    orderBy: [{ candidateId: "asc" }, { occurredAt: "desc" }],
  });

  const latestBefore = new Map<string, CandidateStatus>();
  for (const activity of activitiesBefore) {
    if (latestBefore.has(activity.candidateId)) continue;
    const to = (activity.metadata as StatusActivityMetadata | null)?.to;
    if (to) latestBefore.set(activity.candidateId, to);
  }

  const missingIds = candidateIds.filter((id) => !latestBefore.has(id));
  const firstAfter = new Map<string, CandidateStatus>();

  if (missingIds.length > 0) {
    const activitiesAfter = await prisma.activity.findMany({
      where: {
        candidateId: { in: missingIds },
        action: ActivityAction.STATUS_CHANGED,
        entityType: "CANDIDATE",
        occurredAt: { gte: asOf },
      },
      select: { candidateId: true, metadata: true, occurredAt: true },
      orderBy: [{ candidateId: "asc" }, { occurredAt: "asc" }],
    });

    for (const activity of activitiesAfter) {
      if (firstAfter.has(activity.candidateId)) continue;
      const from = (activity.metadata as StatusActivityMetadata | null)?.from;
      if (from) firstAfter.set(activity.candidateId, from);
    }
  }

  for (const candidate of candidates) {
    statusMap.set(
      candidate.id,
      latestBefore.get(candidate.id) ??
        firstAfter.get(candidate.id) ??
        candidate.status
    );
  }

  return statusMap;
}

function countByStatuses(
  statusMap: Map<string, CandidateStatus>,
  statuses: readonly CandidateStatus[]
): number {
  const statusSet = new Set<CandidateStatus>(statuses);
  let count = 0;
  for (const status of statusMap.values()) {
    if (statusSet.has(status)) count += 1;
  }
  return count;
}

async function countCallAttempts(
  scope: MetricScope,
  range: DateRange
): Promise<number> {
  return prisma.callAttempt.count({
    where: {
      calledAt: { gte: range.from, lt: range.to },
      callLead: { tenantId: scope.tenantId },
      calledBy: scopedUserFilter(scope),
    },
  });
}

async function countStatusTransitions(
  scope: MetricScope,
  range: DateRange,
  toStatus: CandidateStatus
): Promise<number> {
  return prisma.activity.count({
    where: statusTransitionWhere(scope, range, toStatus),
  });
}

async function countStatusTransitionsToAny(
  scope: MetricScope,
  range: DateRange,
  toStatuses: readonly CandidateStatus[]
): Promise<number> {
  return prisma.activity.count({
    where: statusTransitionWhere(scope, range, [...toStatuses]),
  });
}

async function sumReferralFeeForStatusTransitions(
  scope: MetricScope,
  range: DateRange,
  toStatuses: CandidateStatus | readonly CandidateStatus[]
): Promise<number> {
  const statuses = Array.isArray(toStatuses) ? toStatuses : [toStatuses];

  const activities = await prisma.activity.findMany({
    where: statusTransitionWhere(scope, range, statuses),
    select: { candidateId: true },
  });

  const candidateIds = [...new Set(activities.map((a) => a.candidateId))];
  if (candidateIds.length === 0) return 0;

  return sumReferralFeeForCandidateIds(scope, candidateIds);
}

async function sumReferralFeeByStatusesAtDate(
  scope: MetricScope,
  statusMap: Map<string, CandidateStatus>,
  statuses: readonly CandidateStatus[]
): Promise<number> {
  const statusSet = new Set<CandidateStatus>(statuses);
  const candidateIds = [...statusMap.entries()]
    .filter(([, status]) => statusSet.has(status))
    .map(([id]) => id);

  if (candidateIds.length === 0) return 0;
  return sumReferralFeeForCandidateIds(scope, candidateIds);
}

async function sumReferralFeeForCandidateIds(
  scope: MetricScope,
  candidateIds: string[]
): Promise<number> {
  if (candidateIds.length === 0) return 0;

  const jobCases = await prisma.candidateJobCase.findMany({
    where: {
      candidateId: { in: candidateIds },
      referralFee: { not: null },
      includeInKpi: true,
      candidate: scopedCandidateWhere(scope),
    },
    select: { referralFee: true },
  });

  return jobCases.reduce((sum, row) => sum + (row.referralFee ?? 0), 0);
}

async function countOffers(scope: MetricScope, range: DateRange): Promise<number> {
  return prisma.application.count({
    where: {
      offerAt: { gte: range.from, lt: range.to },
      candidate: scopedCandidateWhere(scope),
    },
  });
}

async function computeSnapshotMetricValue(
  scope: MetricScope,
  metricType: KpiMetricType,
  statusMap: Map<string, CandidateStatus>
): Promise<number> {
  switch (metricType) {
    case KpiMetricType.ENTRY_COUNT:
      return countByStatuses(statusMap, ENTRY_OR_BEYOND_STATUSES);
    case KpiMetricType.INTERVIEW_SET_COUNT:
      return countByStatuses(statusMap, ENTRY_OR_BEYOND_STATUSES);
    case KpiMetricType.JOINED_COUNT:
      return countByStatuses(statusMap, [CandidateStatus.JOINED]);
    case KpiMetricType.ENTRY_AMOUNT:
      return sumReferralFeeByStatusesAtDate(
        scope,
        statusMap,
        ENTRY_OR_BEYOND_STATUSES
      );
    case KpiMetricType.INTERVIEW_SET_AMOUNT:
      return sumReferralFeeByStatusesAtDate(
        scope,
        statusMap,
        ENTRY_OR_BEYOND_STATUSES
      );
    case KpiMetricType.JOINED_AMOUNT:
      return sumReferralFeeByStatusesAtDate(scope, statusMap, [
        CandidateStatus.JOINED,
      ]);
    default:
      return 0;
  }
}

async function computeTransitionMetricValue(
  scope: MetricScope,
  metricType: KpiMetricType,
  range: DateRange
): Promise<number> {
  switch (metricType) {
    case KpiMetricType.CALL_COUNT:
      return countCallAttempts(scope, range);
    case KpiMetricType.HEARING_COUNT:
      return countStatusTransitions(scope, range, CandidateStatus.HEARING);
    case KpiMetricType.PROPOSAL_COUNT:
      return countStatusTransitions(scope, range, CandidateStatus.JOB_PROPOSAL);
    case KpiMetricType.ENTRY_COUNT:
      return countStatusTransitions(scope, range, CandidateStatus.ENTRY);
    case KpiMetricType.INTERVIEW_PREP_COUNT:
      return countStatusTransitions(
        scope,
        range,
        CandidateStatus.INTERVIEW_PREP
      );
    case KpiMetricType.INTERVIEW_SET_COUNT:
      return countStatusTransitionsToAny(
        scope,
        range,
        INTERVIEW_SET_PIPELINE_STATUSES
      );
    case KpiMetricType.OFFER_COUNT:
      return countOffers(scope, range);
    case KpiMetricType.OFFER_ACCEPTED_COUNT:
      return countStatusTransitions(
        scope,
        range,
        CandidateStatus.OFFER_ACCEPTED
      );
    case KpiMetricType.JOINED_COUNT:
      return countStatusTransitions(scope, range, CandidateStatus.JOINED);
    case KpiMetricType.ENTRY_AMOUNT:
      return sumReferralFeeForStatusTransitions(
        scope,
        range,
        CandidateStatus.ENTRY
      );
    case KpiMetricType.INTERVIEW_SET_AMOUNT:
      return sumReferralFeeForStatusTransitions(
        scope,
        range,
        INTERVIEW_SET_PIPELINE_STATUSES
      );
    case KpiMetricType.JOINED_AMOUNT:
      return sumReferralFeeForStatusTransitions(
        scope,
        range,
        CandidateStatus.JOINED
      );
    default:
      return 0;
  }
}

export async function computeMetricValue(
  scope: MetricScope,
  metricType: KpiMetricType,
  range: DateRange,
  options?: ComputeOptions
): Promise<number> {
  const useSnapshot =
    isSnapshotMetric(metricType) &&
    !options?.daily &&
    !usesTransitionPeriodAggregation(metricType);

  if (useSnapshot) {
    const statusMap =
      options?.snapshotStatusMap ??
      (await resolveCandidateStatusesAtDate(
        scope,
        snapshotAsOfDate(range.to)
      ));
    return computeSnapshotMetricValue(scope, metricType, statusMap);
  }
  return computeTransitionMetricValue(scope, metricType, range);
}

export async function computePeriodMetrics(
  scope: MetricScope,
  metricTypes: readonly KpiMetricType[],
  range: DateRange
): Promise<Partial<Record<KpiMetricType, number>>> {
  const result: Partial<Record<KpiMetricType, number>> = {};
  const needsSnapshot = metricTypes.some(
    (metricType) =>
      isSnapshotMetric(metricType) &&
      !usesTransitionPeriodAggregation(metricType)
  );
  const snapshotStatusMap = needsSnapshot
    ? await resolveCandidateStatusesAtDate(scope, snapshotAsOfDate(range.to))
    : undefined;

  for (const metricType of metricTypes) {
    result[metricType] = await computeMetricValue(scope, metricType, range, {
      snapshotStatusMap,
    });
  }
  return result;
}

export type DailyMetricRow = {
  date: Date;
  values: Partial<Record<KpiMetricType, number>>;
};

async function computeDailyMetricsLive(
  scope: MetricScope,
  metricTypes: readonly KpiMetricType[],
  days: Date[]
): Promise<DailyMetricRow[]> {
  const rows: DailyMetricRow[] = [];

  for (const date of days) {
    const { gte, lt } = dayRange(date);
    const range: DateRange = { from: gte, to: lt };
    const values: Partial<Record<KpiMetricType, number>> = {};

    for (const metricType of metricTypes) {
      if (isAmountMetric(metricType)) continue;
      values[metricType] = await computeMetricValue(scope, metricType, range, {
        daily: true,
      });
    }

    rows.push({ date: toDateOnly(date), values });
  }

  return rows;
}

export async function computeDailyMetrics(
  scope: MetricScope,
  metricTypes: readonly KpiMetricType[],
  from: Date,
  toInclusive: Date
): Promise<DailyMetricRow[]> {
  const days = eachDayInRange(from, toInclusive);
  const today = toDateOnly(new Date());
  const cacheableDays = days.filter((date) => toDateOnly(date) < today);
  const liveDays = days.filter((date) => toDateOnly(date) >= today);

  const cached =
    cacheableDays.length > 0
      ? await readDailyMetricsCache(scope, metricTypes, from, toInclusive)
      : new Map<string, Partial<Record<KpiMetricType, number>>>();

  const rows: DailyMetricRow[] = [];
  const missingCacheDays: Date[] = [];

  for (const date of cacheableDays) {
    const dateOnly = toDateOnly(date);
    if (hasFullDailyCache(cached, dateOnly, metricTypes)) {
      rows.push({
        date: dateOnly,
        values: { ...cached.get(dateOnly.toISOString().slice(0, 10))! },
      });
    } else {
      missingCacheDays.push(dateOnly);
    }
  }

  const liveComputeDays = [...missingCacheDays, ...liveDays.map(toDateOnly)];
  if (liveComputeDays.length > 0) {
    const liveRows = await computeDailyMetricsLive(
      scope,
      metricTypes,
      liveComputeDays
    );
    rows.push(...liveRows);
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  return rows;
}
