import { UserRole } from "@prisma/client";
import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  lastName: z.string().min(1, "姓を入力してください").max(50),
  firstName: z.string().max(50).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.ADVISOR),
  managerId: z.string().uuid().optional().or(z.literal("")),
});

export const createUserSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  lastName: z.string().min(1, "姓を入力してください").max(50),
  firstName: z.string().max(50).optional(),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(72, "パスワードは72文字以内で入力してください"),
  role: z.nativeEnum(UserRole).default(UserRole.ADVISOR),
  managerId: z.string().uuid().optional().or(z.literal("")),
});

export const updateUserHierarchySchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(UserRole),
  managerId: z.string().uuid().optional().or(z.literal("")),
});

export const userIdActionSchema = z.object({
  userId: z.string().uuid("ユーザーを指定してください"),
});

export const callLeadAssigneeSchema = z.object({
  assignedUserId: z
    .string()
    .uuid("担当者を選択してください")
    .optional()
    .or(z.literal("")),
});
