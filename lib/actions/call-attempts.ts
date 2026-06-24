"use server";

import { revalidatePath } from "next/cache";
import {
  CallLeadActivityAction,
  CallLeadEntityType,
} from "@prisma/client";
import { syncCallLeadCallCount } from "@/lib/call-leads/sync-call-count";
import { callLeadByIdWhere } from "@/lib/call-leads/queries";
import { callService } from "@/lib/calls/call-service";
import { CallServiceError } from "@/lib/calls/types";
import { prisma } from "@/lib/prisma";
import { assertCallLeadAccess } from "@/lib/tenant/access";
import { requireTenantContext } from "@/lib/tenant/context";
import {
  mapResultToCallLeadStatus,
  parseCallAttemptResultForm,
} from "@/lib/validators/call-attempt";

export type CallAttemptActionState = {
  error?: string;
  success?: boolean;
  callAttemptId?: string;
  dialUri?: string;
  phoneNumber?: string;
};

export type InitiateCallActionResult =
  | { success: true; callAttemptId: string; dialUri?: string; phoneNumber: string }
  | { success: false; error: string };

function revalidateCallLeadPaths(callLeadId: string) {
  revalidatePath("/call-leads");
  revalidatePath(`/call-leads/${callLeadId}`);
}

export async function initiateCallAction(
  callLeadId: string
): Promise<InitiateCallActionResult> {
  try {
    const { user, tenantId } = await requireTenantContext();
    await assertCallLeadAccess(callLeadId);

    const result = await callService.initiate({
      callLeadId,
      userId: user.id,
      tenantId,
      user,
    });

    revalidateCallLeadPaths(callLeadId);

    return {
      success: true,
      callAttemptId: result.callAttemptId,
      dialUri: result.dialUri,
      phoneNumber: result.phoneNumber,
    };
  } catch (error) {
    if (error instanceof CallServiceError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "発信の開始に失敗しました" };
  }
}

export async function recordCallAttemptResultAction(
  callAttemptId: string,
  callLeadId: string,
  _prevState: CallAttemptActionState,
  formData: FormData
): Promise<CallAttemptActionState> {
  let user;
  let tenantId;
  try {
    ({ user, tenantId } = await assertCallLeadAccess(callLeadId));
  } catch {
    return { error: "架電リードが見つかりません" };
  }

  const parsed = parseCallAttemptResultForm(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "入力内容を確認してください",
    };
  }

  const attempt = await prisma.callAttempt.findFirst({
    where: {
      id: callAttemptId,
      callLeadId,
      callLead: callLeadByIdWhere(user, tenantId, callLeadId),
    },
    select: { id: true, result: true },
  });

  if (!attempt) {
    return { error: "架電記録が見つかりません" };
  }

  const data = parsed.data;
  const endedAt = new Date();

  const callLead = await prisma.callLead.findFirst({
    where: callLeadByIdWhere(user, tenantId, callLeadId),
    select: { status: true },
  });

  if (!callLead) {
    return { error: "架電リードが見つかりません" };
  }

  const nextLeadStatus = mapResultToCallLeadStatus(data.result, callLead.status);

  await prisma.$transaction(async (tx) => {
    await tx.callAttempt.update({
      where: { id: callAttemptId },
      data: {
        result: data.result,
        memo: data.memo ?? null,
        nextAction: data.nextAction ?? null,
        duration: data.duration ?? null,
        callStatus: data.callStatus ?? "COMPLETED",
        endedAt,
      },
    });

    if (nextLeadStatus && nextLeadStatus !== callLead.status) {
      await tx.callLead.update({
        where: { id: callLeadId },
        data: { status: nextLeadStatus },
      });

      await tx.callLeadActivity.create({
        data: {
          tenantId,
          callLeadId,
          userId: user.id,
          action: CallLeadActivityAction.STATUS_CHANGED,
          entityType: CallLeadEntityType.CALL_LEAD,
          entityId: callLeadId,
          metadata: { from: callLead.status, to: nextLeadStatus, via: "call_result" },
        },
      });
    }

    await tx.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId,
        userId: user.id,
        action: CallLeadActivityAction.CALL_RESULT_RECORDED,
        entityType: CallLeadEntityType.CALL_ATTEMPT,
        entityId: callAttemptId,
        metadata: {
          result: data.result,
          duration: data.duration ?? null,
        },
      },
    });

    await syncCallLeadCallCount(callLeadId, tx);
  });

  revalidateCallLeadPaths(callLeadId);
  return { success: true, callAttemptId };
}

export async function getCallAttemptsForLead(callLeadId: string) {
  const { user, tenantId } = await requireTenantContext();

  return prisma.callAttempt.findMany({
    where: {
      callLeadId,
      callLead: callLeadByIdWhere(user, tenantId, callLeadId),
    },
    orderBy: { calledAt: "desc" },
    include: {
      calledBy: { select: { id: true, name: true } },
    },
  });
}

export async function copyCallLeadPhoneAction(
  callLeadId: string
): Promise<{ phone: string | null; error?: string }> {
  try {
    const { user, tenantId } = await assertCallLeadAccess(callLeadId);
    const callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(user, tenantId, callLeadId),
      select: { phone: true },
    });
    return { phone: callLead?.phone ?? null };
  } catch {
    return { phone: null, error: "架電リードが見つかりません" };
  }
}
