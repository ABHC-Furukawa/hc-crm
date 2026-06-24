"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, NoteType } from "@prisma/client";
import { assertCandidateAccess } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validators/note";

export type NoteActionState = { error?: string };

export async function createNoteAction(
  candidateId: string,
  _prev: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const { user } = await assertCandidateAccess(candidateId);
  const parsed = noteSchema.safeParse({
    content: formData.get("content"),
    type: formData.get("type") ?? NoteType.GENERAL,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  await prisma.$transaction(async (tx) => {
    const created = await tx.note.create({
      data: {
        candidateId,
        authorId: user.id,
        content: parsed.data.content,
        type: parsed.data.type,
      },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.NOTE_ADDED,
        entityType: "NOTE",
        entityId: created.id,
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
  return {};
}

export async function updateNoteAction(
  noteId: string,
  candidateId: string,
  _prev: NoteActionState,
  formData: FormData
): Promise<NoteActionState> {
  const { user } = await assertCandidateAccess(candidateId);
  const parsed = noteSchema.safeParse({
    content: formData.get("content"),
    type: formData.get("type") ?? NoteType.GENERAL,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  const existing = await prisma.note.findFirst({
    where: { id: noteId, candidateId, deletedAt: null },
  });
  if (!existing) {
    return { error: "メモが見つかりません" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.note.update({
      where: { id: noteId },
      data: {
        content: parsed.data.content,
        type: parsed.data.type,
      },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.UPDATED,
        entityType: "NOTE",
        entityId: noteId,
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
  return {};
}

export async function deleteNoteAction(noteId: string, candidateId: string) {
  const { user } = await assertCandidateAccess(candidateId);

  const existing = await prisma.note.findFirst({
    where: { id: noteId, candidateId, deletedAt: null },
  });
  if (!existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date(), isPinned: false },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.DELETED,
        entityType: "NOTE",
        entityId: noteId,
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function toggleNotePinAction(noteId: string, candidateId: string) {
  await assertCandidateAccess(candidateId);

  const note = await prisma.note.findFirst({
    where: { id: noteId, candidateId, deletedAt: null },
  });
  if (!note) return;

  await prisma.note.update({
    where: { id: noteId },
    data: { isPinned: !note.isPinned },
  });

  revalidatePath(`/candidates/${candidateId}`);
}
