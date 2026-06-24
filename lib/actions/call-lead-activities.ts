"use server";

import type {
  CallLeadActivityAction,
  CallLeadEntityType,
  Prisma,
} from "@prisma/client";
import { AccessDeniedError } from "@/lib/auth/access";
import {
  CALL_LEAD_ACTIVITY_PAGE_SIZE,
  type CallLeadActivityListResult,
} from "@/lib/call-leads/activity-constants";
import {
  callLeadActivityInclude,
  callLeadByIdWhere,
} from "@/lib/call-leads/queries";
import { prisma } from "@/lib/prisma";
import { assertCallLeadAccess } from "@/lib/tenant/access";

type RecordCallLeadActivityInput = {
  tenantId: string;
  callLeadId: string;
  userId?: string | null;
  action: CallLeadActivityAction;
  entityType: CallLeadEntityType;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

/** CallLeadActivity 記録ヘルパー */
export async function recordCallLeadActivity(
  input: RecordCallLeadActivityInput
): Promise<void> {
  await prisma.callLeadActivity.create({
    data: {
      tenantId: input.tenantId,
      callLeadId: input.callLeadId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function getCallLeadActivities(
  callLeadId: string,
  page = 1
): Promise<CallLeadActivityListResult> {
  try {
    await assertCallLeadAccess(callLeadId);
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: CALL_LEAD_ACTIVITY_PAGE_SIZE,
        totalPages: 0,
      };
    }
    throw error;
  }

  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * CALL_LEAD_ACTIVITY_PAGE_SIZE;

  const [total, items] = await Promise.all([
    prisma.callLeadActivity.count({ where: { callLeadId } }),
    prisma.callLeadActivity.findMany({
      where: { callLeadId },
      orderBy: { occurredAt: "desc" },
      skip,
      take: CALL_LEAD_ACTIVITY_PAGE_SIZE,
      include: callLeadActivityInclude,
    }),
  ]);

  return {
    items,
    total,
    page: safePage,
    pageSize: CALL_LEAD_ACTIVITY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / CALL_LEAD_ACTIVITY_PAGE_SIZE)),
  };
}

export async function getCallLeadActivitiesForDetail(callLeadId: string) {
  const { tenantId, user } = await assertCallLeadAccess(callLeadId);

  return prisma.callLeadActivity.findMany({
    where: {
      callLeadId,
      callLead: callLeadByIdWhere(user, tenantId, callLeadId),
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
    include: callLeadActivityInclude,
  });
}
