"use server";

import { revalidatePath } from "next/cache";
import {
  CallLeadActivityAction,
  CallLeadEntityType,
} from "@prisma/client";
import { callLeadByIdWhere } from "@/lib/call-leads/queries";
import { prisma } from "@/lib/prisma";
import { assertCallLeadAccess } from "@/lib/tenant/access";
import { callLeadNoteSchema } from "@/lib/validators/call-lead-note";

export type CallLeadNoteActionState = { error?: string; success?: boolean };

function revalidate(callLeadId: string) {
  revalidatePath(`/call-leads/${callLeadId}`);
  revalidatePath("/call-leads");
}

export async function createCallLeadNoteAction(
  callLeadId: string,
  _prev: CallLeadNoteActionState,
  formData: FormData
): Promise<CallLeadNoteActionState> {
  let user;
  let tenantId;
  try {
    ({ user, tenantId } = await assertCallLeadAccess(callLeadId));
  } catch {
    return { error: "架電リードが見つかりません" };
  }

  const parsed = callLeadNoteSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  await prisma.$transaction(async (tx) => {
    const note = await tx.callLeadNote.create({
      data: {
        callLeadId,
        authorId: user.id,
        content: parsed.data.content,
      },
    });

    await tx.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId,
        userId: user.id,
        action: CallLeadActivityAction.NOTE_ADDED,
        entityType: CallLeadEntityType.CALL_LEAD_NOTE,
        entityId: note.id,
      },
    });
  });

  revalidate(callLeadId);
  return { success: true };
}

export async function updateCallLeadNoteAction(
  noteId: string,
  callLeadId: string,
  _prev: CallLeadNoteActionState,
  formData: FormData
): Promise<CallLeadNoteActionState> {
  let user;
  let tenantId;
  try {
    ({ user, tenantId } = await assertCallLeadAccess(callLeadId));
  } catch {
    return { error: "架電リードが見つかりません" };
  }

  const parsed = callLeadNoteSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  const note = await prisma.callLeadNote.findFirst({
    where: {
      id: noteId,
      callLeadId,
      callLead: callLeadByIdWhere(user, tenantId, callLeadId),
    },
  });

  if (!note) {
    return { error: "メモが見つかりません" };
  }

  if (note.content === parsed.data.content) {
    return { success: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.callLeadNote.update({
      where: { id: noteId },
      data: { content: parsed.data.content },
    });

    await tx.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId,
        userId: user.id,
        action: CallLeadActivityAction.UPDATED,
        entityType: CallLeadEntityType.CALL_LEAD_NOTE,
        entityId: noteId,
      },
    });
  });

  revalidate(callLeadId);
  return { success: true };
}

/** 一覧からの保存（新規 or 更新） */
export async function saveCallLeadNoteAction(
  callLeadId: string,
  _prev: CallLeadNoteActionState,
  formData: FormData
): Promise<CallLeadNoteActionState> {
  const noteId = formData.get("noteId");
  if (typeof noteId === "string" && noteId.length > 0) {
    return updateCallLeadNoteAction(noteId, callLeadId, _prev, formData);
  }
  return createCallLeadNoteAction(callLeadId, _prev, formData);
}

export async function deleteCallLeadNoteAction(noteId: string, callLeadId: string) {
  let user;
  let tenantId;
  try {
    ({ user, tenantId } = await assertCallLeadAccess(callLeadId));
  } catch {
    return;
  }

  const note = await prisma.callLeadNote.findFirst({
    where: {
      id: noteId,
      callLeadId,
      callLead: callLeadByIdWhere(user, tenantId, callLeadId),
    },
  });

  if (!note) return;

  await prisma.callLeadNote.delete({ where: { id: noteId } });
  revalidate(callLeadId);
}
