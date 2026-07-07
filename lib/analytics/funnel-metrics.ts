import {
  FUNNEL_STAGE_IDS,
  FUNNEL_STAGE_LABELS,
  type FunnelStageCount,
  type FunnelStageId,
} from "@/lib/analytics/constants";
import { INTERVIEW_SET_PIPELINE_STATUSES } from "@/lib/kpi/constants";
import type { MetricScope } from "@/lib/kpi/metrics";
import {
  ActivityAction,
  CallLeadActivityAction,
  CallLeadStatus,
  CandidateStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dayRange, eachDayInRange, toDateOnly } from "@/lib/kpi/dates";

type DateRange = {
  from: Date;
  to: Date;
};

const EXCLUDED_CALL_LEAD_STATUSES: CallLeadStatus[] = [
  CallLeadStatus.DUPLICATE,
  CallLeadStatus.OUT_OF_SCOPE,
  CallLeadStatus.REFERRAL_NOT_AVAILABLE,
];

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

function callLeadScopeFilter(scope: MetricScope): Prisma.CallLeadWhereInput {
  const base: Prisma.CallLeadWhereInput = {
    tenantId: scope.tenantId,
    deletedAt: null,
    status: { notIn: EXCLUDED_CALL_LEAD_STATUSES },
  };

  if (scope.userId) {
    return { ...base, assignedUserId: scope.userId };
  }

  if (scope.userIds?.length) {
    return { ...base, assignedUserId: { in: scope.userIds } };
  }

  return base;
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
  scope: MetricScope
): Prisma.CandidateWhereInput {
  return {
    tenantId: scope.tenantId,
    deletedAt: null,
    assignments: candidateAssignmentFilter(scope),
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

function callLeadActivityScopeWhere(
  scope: MetricScope,
  range: DateRange
): Prisma.CallLeadActivityWhereInput {
  return {
    tenantId: scope.tenantId,
    occurredAt: { gte: range.from, lt: range.to },
    callLead: callLeadScopeFilter(scope),
  };
}

async function countApplications(
  scope: MetricScope,
  range: DateRange
): Promise<number> {
  return prisma.callLead.count({
    where: {
      ...callLeadScopeFilter(scope),
      OR: [
        { importedAt: { gte: range.from, lt: range.to } },
        {
          importedAt: null,
          createdAt: { gte: range.from, lt: range.to },
        },
      ],
    },
  });
}

async function countCalls(scope: MetricScope, range: DateRange): Promise<number> {
  return prisma.callAttempt.count({
    where: {
      calledAt: { gte: range.from, lt: range.to },
      callLead: callLeadScopeFilter(scope),
      calledBy: scopedUserFilter(scope),
    },
  });
}

async function countCallLeadHearings(
  scope: MetricScope,
  range: DateRange
): Promise<number> {
  return prisma.callLeadActivity.count({
    where: {
      ...callLeadActivityScopeWhere(scope, range),
      OR: [
        { action: CallLeadActivityAction.HEARING_COMPLETED },
        {
          action: CallLeadActivityAction.STATUS_CHANGED,
          metadata: { path: ["to"], equals: CallLeadStatus.HEARING },
        },
      ],
    },
  });
}

async function countCandidateConversions(
  scope: MetricScope,
  range: DateRange
): Promise<number> {
  return prisma.callLeadActivity.count({
    where: {
      ...callLeadActivityScopeWhere(scope, range),
      action: CallLeadActivityAction.CONVERTED_TO_CANDIDATE,
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

async function countOffers(scope: MetricScope, range: DateRange): Promise<number> {
  const [applications, statusActivities] = await Promise.all([
    prisma.application.findMany({
      where: {
        offerAt: { gte: range.from, lt: range.to },
        candidate: scopedCandidateWhere(scope),
      },
      select: { candidateId: true },
    }),
    prisma.activity.findMany({
      where: statusTransitionWhere(scope, range, CandidateStatus.OFFER_ACCEPTED),
      select: { candidateId: true },
    }),
  ]);

  const candidateIds = new Set<string>();
  for (const row of applications) candidateIds.add(row.candidateId);
  for (const row of statusActivities) candidateIds.add(row.candidateId);
  return candidateIds.size;
}

const STAGE_COMPUTERS: Record<
  FunnelStageId,
  (scope: MetricScope, range: DateRange) => Promise<number>
> = {
  APPLICATION: countApplications,
  CALL: countCalls,
  HEARING: countCallLeadHearings,
  CANDIDATE_CONVERTED: countCandidateConversions,
  PROPOSAL: (scope, range) =>
    countStatusTransitions(scope, range, CandidateStatus.JOB_PROPOSAL),
  INTERVIEW_SET: (scope, range) =>
    countStatusTransitionsToAny(scope, range, INTERVIEW_SET_PIPELINE_STATUSES),
  OFFER: countOffers,
  JOINED: (scope, range) =>
    countStatusTransitions(scope, range, CandidateStatus.JOINED),
};

export async function computeFunnelStageCounts(
  scope: MetricScope,
  range: DateRange
): Promise<FunnelStageCount[]> {
  const counts: FunnelStageCount[] = [];

  for (const stageId of FUNNEL_STAGE_IDS) {
    const count = await STAGE_COMPUTERS[stageId](scope, range);
    counts.push({
      stageId,
      label: FUNNEL_STAGE_LABELS[stageId],
      count,
    });
  }

  return counts;
}

export type FunnelDailyRow = {
  date: Date;
  stages: FunnelStageCount[];
};

export async function computeDailyFunnelMetrics(
  scope: MetricScope,
  from: Date,
  toInclusive: Date
): Promise<FunnelDailyRow[]> {
  const days = eachDayInRange(from, toInclusive);
  const rows: FunnelDailyRow[] = [];

  for (const date of days) {
    const { gte, lt } = dayRange(date);
    const stages = await computeFunnelStageCounts(scope, { from: gte, to: lt });
    rows.push({ date: toDateOnly(date), stages });
  }

  return rows;
}
