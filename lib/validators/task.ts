import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

export const taskSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueAt: z.string().optional(),
});

export const taskStatusSchema = z.nativeEnum(TaskStatus);

export const taskAssigneeSchema = z.object({
  assignedToId: z.string().uuid("担当者を選択してください"),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
