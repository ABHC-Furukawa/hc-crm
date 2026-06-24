"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction, TaskStatus } from "@prisma/client";
import { assertCandidateAccess } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import {
  taskAssigneeSchema,
  taskSchema,
  taskStatusSchema,
} from "@/lib/validators/task";

export type TaskActionState = { error?: string };

export async function createTaskAction(
  candidateId: string,
  _prev: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const { user } = await assertCandidateAccess(candidateId);
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined;

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        candidateId,
        assignedToId: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        dueAt,
      },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.CREATED,
        entityType: "TASK",
        entityId: task.id,
        metadata: { title: task.title },
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
  return {};
}

export async function updateTaskAction(
  taskId: string,
  candidateId: string,
  _prev: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const { user } = await assertCandidateAccess(candidateId);
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;

  const existing = await prisma.task.findFirst({
    where: { id: taskId, candidateId },
  });
  if (!existing) {
    return { error: "タスクが見つかりません" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority: parsed.data.priority,
        dueAt,
      },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.UPDATED,
        entityType: "TASK",
        entityId: taskId,
        metadata: { title: parsed.data.title },
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
  return {};
}

export async function updateTaskStatusAction(
  taskId: string,
  candidateId: string,
  formData: FormData
) {
  const { user } = await assertCandidateAccess(candidateId);
  const parsed = taskStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  const status = parsed.data;
  const completedAt = status === TaskStatus.DONE ? new Date() : null;

  const existing = await prisma.task.findFirst({
    where: { id: taskId, candidateId },
  });
  if (!existing) return;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { status, completedAt },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.STATUS_CHANGED,
        entityType: "TASK",
        entityId: taskId,
        metadata: { status, previousStatus: existing.status },
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function updateTaskAssigneeAction(
  taskId: string,
  candidateId: string,
  formData: FormData
) {
  const { user } = await assertCandidateAccess(candidateId);
  const parsed = taskAssigneeSchema.safeParse({
    assignedToId: formData.get("assignedToId"),
  });
  if (!parsed.success) return;

  const existing = await prisma.task.findFirst({
    where: { id: taskId, candidateId },
  });
  if (!existing) return;

  const assignee = await prisma.user.findFirst({
    where: { id: parsed.data.assignedToId, isActive: true },
  });
  if (!assignee) return;

  if (existing.assignedToId === assignee.id) return;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: taskId },
      data: { assignedToId: assignee.id },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.ASSIGNED,
        entityType: "TASK",
        entityId: taskId,
        metadata: {
          assignedToId: assignee.id,
          assignedToName: assignee.name,
          previousAssignedToId: existing.assignedToId,
        },
      },
    });
  });

  revalidatePath(`/candidates/${candidateId}`);
}
