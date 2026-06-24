"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
} from "@prisma/client";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { parseCallLeadFilters } from "@/lib/call-leads/filters";
import {
  buildCallLeadListWhere,
  callLeadByIdWhere,
  callLeadDetailInclude,
  callLeadListInclude,
  callLeadListOrderBy,
} from "@/lib/call-leads/queries";
import { prisma } from "@/lib/prisma";
import { assertCallLeadAccess } from "@/lib/tenant/access";
import { requireTenantContext } from "@/lib/tenant/context";
import {
  callLeadStatusSchema,
  extractCallLeadFormValues,
  parseFormDataToCallLeadFollowUp,
  parseFormDataToCallLeadUpdate,
  toCallLeadFollowUpInput,
  toCallLeadUpdateInput,
  type CallLeadFormValuesSnapshot,
} from "@/lib/validators/call-lead";
import { callLeadAssigneeSchema } from "@/lib/validators/user";
import {
  ConvertCallLeadError,
  convertCallLeadErrorMessage,
  convertCallLeadToCandidate,
} from "@/lib/call-leads/convert-to-candidate";

export type CallLeadActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
  values?: CallLeadFormValuesSnapshot;
  formToken?: number;
};

function errorState(
  formData: FormData,
  error: string,
  fieldErrors?: Record<string, string[]>
): CallLeadActionState {
  return {
    error,
    fieldErrors,
    values: extractCallLeadFormValues(formData),
    formToken: Date.now(),
  };
}

function revalidateCallLeadPaths(id?: string) {
  revalidatePath("/call-leads");
  if (id) revalidatePath(`/call-leads/${id}`);
}

function assertEditableStatus(status: CallLeadStatus): boolean {
  return status !== CallLeadStatus.CONVERTED;
}

export async function getCallLeadsForUser(
  params: Record<string, string | string[] | undefined> = {}
) {
  const { user, tenantId } = await requireTenantContext();
  const filters = parseCallLeadFilters(params);

  return prisma.callLead.findMany({
    where: buildCallLeadListWhere(user, tenantId, filters),
    include: callLeadListInclude,
    orderBy: callLeadListOrderBy,
  });
}

export async function getCallLeadById(id: string) {
  const { user, tenantId } = await requireTenantContext();

  return prisma.callLead.findFirst({
    where: callLeadByIdWhere(user, tenantId, id),
    include: callLeadDetailInclude,
  });
}

export async function updateCallLeadAction(
  id: string,
  _prevState: CallLeadActionState,
  formData: FormData
): Promise<CallLeadActionState> {
  let user;
  let tenantId;
  let callLead;
  try {
    ({ user, tenantId, callLeadId: id } = await assertCallLeadAccess(id));
    callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(user, tenantId, id),
      select: { id: true, status: true },
    });
    if (!callLead) {
      return { error: "架電リードが見つかりません" };
    }
  } catch {
    return { error: "架電リードが見つかりません" };
  }

  if (!assertEditableStatus(callLead.status)) {
    return errorState(formData, CANDIDATE_DISPLAY.convertLeadLocked);
  }

  const parsed = parseFormDataToCallLeadUpdate(formData);
  if (!parsed.success) {
    return errorState(
      formData,
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors
    );
  }

  const data = toCallLeadUpdateInput(parsed.data);

  if (data.assignedUserId) {
    const assignee = await prisma.user.findFirst({
      where: { id: data.assignedUserId, isActive: true, tenantId },
      select: { id: true },
    });
    if (!assignee) {
      return errorState(formData, "担当者が見つかりません");
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.callLead.update({
        where: { id },
        data,
      });

      await tx.callLeadActivity.create({
        data: {
          tenantId,
          callLeadId: id,
          userId: user.id,
          action: CallLeadActivityAction.UPDATED,
          entityType: CallLeadEntityType.CALL_LEAD,
          entityId: id,
        },
      });
    });

    revalidateCallLeadPaths(id);
    return { success: true };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return errorState(formData, "架電リードの更新に失敗しました");
  }
}

export async function updateCallLeadStatusAction(
  callLeadId: string,
  formData: FormData
) {
  let user;
  let tenantId;
  let callLead;
  try {
    ({ user, tenantId, callLeadId } = await assertCallLeadAccess(callLeadId));
    callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(user, tenantId, callLeadId),
      select: { id: true, status: true },
    });
    if (!callLead) return;
  } catch {
    return;
  }

  if (!assertEditableStatus(callLead.status)) return;

  const parsed = callLeadStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  const status = parsed.data;
  if (status === callLead.status) return;

  await prisma.$transaction(async (tx) => {
    await tx.callLead.update({
      where: { id: callLeadId },
      data: { status },
    });

    await tx.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId,
        userId: user.id,
        action: CallLeadActivityAction.STATUS_CHANGED,
        entityType: CallLeadEntityType.CALL_LEAD,
        entityId: callLeadId,
        metadata: { from: callLead.status, to: status },
      },
    });
  });

  revalidateCallLeadPaths(callLeadId);
}

export async function updateCallLeadAssigneeAction(
  callLeadId: string,
  formData: FormData
) {
  let user;
  let tenantId;
  let callLead;
  try {
    ({ user, tenantId, callLeadId } = await assertCallLeadAccess(callLeadId));
    callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(user, tenantId, callLeadId),
      select: { id: true, status: true, assignedUserId: true },
    });
    if (!callLead) return;
  } catch {
    return;
  }

  if (!assertEditableStatus(callLead.status)) return;

  const parsed = callLeadAssigneeSchema.safeParse({
    assignedUserId: formData.get("assignedUserId") ?? "",
  });
  if (!parsed.success) return;

  const assignedUserId = parsed.data.assignedUserId || null;
  if (assignedUserId === callLead.assignedUserId) return;

  if (assignedUserId) {
    const assignee = await prisma.user.findFirst({
      where: { id: assignedUserId, isActive: true, tenantId },
      select: { id: true, name: true, lastName: true },
    });
    if (!assignee) return;

    await prisma.$transaction(async (tx) => {
      await tx.callLead.update({
        where: { id: callLeadId },
        data: { assignedUserId: assignee.id },
      });

      await tx.callLeadActivity.create({
        data: {
          tenantId,
          callLeadId,
          userId: user.id,
          action: CallLeadActivityAction.UPDATED,
          entityType: CallLeadEntityType.CALL_LEAD,
          entityId: callLeadId,
          metadata: {
            field: "assignedUserId",
            assignedUserId: assignee.id,
            assignedUserName: assignee.lastName,
          },
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.callLead.update({
        where: { id: callLeadId },
        data: { assignedUserId: null },
      });

      await tx.callLeadActivity.create({
        data: {
          tenantId,
          callLeadId,
          userId: user.id,
          action: CallLeadActivityAction.UPDATED,
          entityType: CallLeadEntityType.CALL_LEAD,
          entityId: callLeadId,
          metadata: { field: "assignedUserId", assignedUserId: null },
        },
      });
    });
  }

  revalidateCallLeadPaths(callLeadId);
}

export async function updateCallLeadFollowUpAction(
  callLeadId: string,
  _prevState: CallLeadActionState,
  formData: FormData
): Promise<CallLeadActionState> {
  let user;
  let tenantId;
  let callLead;
  try {
    ({ user, tenantId, callLeadId } = await assertCallLeadAccess(callLeadId));
    callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(user, tenantId, callLeadId),
      select: { id: true, status: true },
    });
    if (!callLead) {
      return { error: "架電リードが見つかりません" };
    }
  } catch {
    return { error: "架電リードが見つかりません" };
  }

  if (!assertEditableStatus(callLead.status)) {
    return { error: CANDIDATE_DISPLAY.convertLeadLocked };
  }

  const parsed = parseFormDataToCallLeadFollowUp(formData);
  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "入力内容を確認してください",
    };
  }

  const data = toCallLeadFollowUpInput(parsed.data);

  await prisma.$transaction(async (tx) => {
    await tx.callLead.update({
      where: { id: callLeadId },
      data,
    });

    await tx.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId,
        userId: user.id,
        action: CallLeadActivityAction.FOLLOW_UP_SET,
        entityType: CallLeadEntityType.CALL_LEAD,
        entityId: callLeadId,
        metadata: {
          nextCallDate: data.nextCallDate?.toISOString() ?? null,
          hasMemo: Boolean(data.nextCallMemo),
        },
      },
    });
  });

  revalidateCallLeadPaths(callLeadId);
  return { success: true };
}

export async function recordCallLeadHearingCompletedAction(callLeadId: string) {
  let user;
  let tenantId;
  let callLead;
  try {
    ({ user, tenantId, callLeadId } = await assertCallLeadAccess(callLeadId));
    callLead = await prisma.callLead.findFirst({
      where: callLeadByIdWhere(user, tenantId, callLeadId),
      select: { id: true, status: true },
    });
    if (!callLead) return;
  } catch {
    return;
  }

  if (!assertEditableStatus(callLead.status)) return;

  await prisma.$transaction(async (tx) => {
    await tx.callLead.update({
      where: { id: callLeadId },
      data: { status: CallLeadStatus.HEARING },
    });

    await tx.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId,
        userId: user.id,
        action: CallLeadActivityAction.HEARING_COMPLETED,
        entityType: CallLeadEntityType.CALL_LEAD,
        entityId: callLeadId,
        metadata: { from: callLead.status, to: CallLeadStatus.HEARING },
      },
    });
  });

  revalidateCallLeadPaths(callLeadId);
}

export type ConvertCallLeadActionState = {
  error?: string;
};

export async function convertCallLeadToCandidateAction(
  _prev: ConvertCallLeadActionState,
  formData: FormData
): Promise<ConvertCallLeadActionState> {
  const callLeadId = String(formData.get("callLeadId") ?? "").trim();
  if (!callLeadId) {
    return { error: convertCallLeadErrorMessage("NOT_FOUND") };
  }

  let user;
  let tenantId;
  let resolvedCallLeadId = callLeadId;
  try {
    ({ user, tenantId, callLeadId: resolvedCallLeadId } =
      await assertCallLeadAccess(resolvedCallLeadId));
  } catch {
    return { error: convertCallLeadErrorMessage("NOT_FOUND") };
  }

  try {
    const result = await convertCallLeadToCandidate({
      callLeadId: resolvedCallLeadId,
      tenantId,
      userId: user.id,
    });

    revalidateCallLeadPaths(resolvedCallLeadId);
    revalidatePath("/candidates");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    revalidatePath(`/candidates/${result.candidateId}`);
    redirect(`/candidates/${result.candidateId}`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ConvertCallLeadError) {
      return { error: error.message };
    }
    return { error: CANDIDATE_DISPLAY.convertFailed };
  }
}
