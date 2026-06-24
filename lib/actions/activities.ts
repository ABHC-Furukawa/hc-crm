"use server";

import type { ActivityAction, ActivityEntityType, Prisma } from "@prisma/client";
import { AccessDeniedError, assertCandidateAccess } from "@/lib/auth/access";
import { activityInclude } from "@/lib/candidates/queries";
import { prisma } from "@/lib/prisma";
import {
  ACTIVITY_PAGE_SIZE,
  parseActivityQuery,
  type ActivityQuery,
} from "@/lib/validators/activity";

export type ActivityListResult = {
  items: Prisma.ActivityGetPayload<{ include: typeof activityInclude }>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function buildActivityWhere(
  candidateId: string,
  query: ActivityQuery
): Prisma.ActivityWhereInput {
  return {
    candidateId,
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
  };
}

export async function getActivitiesForCandidate(
  candidateId: string,
  params: Record<string, string | undefined> = {}
): Promise<ActivityListResult> {
  try {
    await assertCandidateAccess(candidateId);
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: ACTIVITY_PAGE_SIZE,
        totalPages: 0,
      };
    }
    throw error;
  }

  const query = parseActivityQuery(params);
  const where = buildActivityWhere(candidateId, query);
  const skip = (query.page - 1) * ACTIVITY_PAGE_SIZE;

  const [total, items] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip,
      take: ACTIVITY_PAGE_SIZE,
      include: activityInclude,
    }),
  ]);

  return {
    items,
    total,
    page: query.page,
    pageSize: ACTIVITY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE)),
  };
}

export async function getActivitiesForCandidateParsed(
  candidateId: string,
  query: {
    page?: number;
    action?: ActivityAction;
    entityType?: ActivityEntityType;
  }
): Promise<ActivityListResult> {
  return getActivitiesForCandidate(candidateId, {
    page: String(query.page ?? 1),
    action: query.action,
    entityType: query.entityType,
  });
}
