import { UserRole } from "@prisma/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export type UserDeleteBlockers = {
  notes: number;
  files: number;
  callAttempts: number;
  callLeadNotes: number;
  total: number;
};

export async function getUserDeleteBlockers(
  userId: string
): Promise<UserDeleteBlockers> {
  const [notes, files, callAttempts, callLeadNotes] = await Promise.all([
    prisma.note.count({ where: { authorId: userId } }),
    prisma.file.count({ where: { uploadedById: userId } }),
    prisma.callAttempt.count({ where: { calledById: userId } }),
    prisma.callLeadNote.count({ where: { authorId: userId } }),
  ]);

  return {
    notes,
    files,
    callAttempts,
    callLeadNotes,
    total: notes + files + callAttempts + callLeadNotes,
  };
}

export function formatDeleteBlockerMessage(blockers: UserDeleteBlockers): string {
  const parts: string[] = [];
  if (blockers.notes > 0) parts.push(`メモ ${blockers.notes} 件`);
  if (blockers.files > 0) parts.push(`ファイル ${blockers.files} 件`);
  if (blockers.callAttempts > 0) parts.push(`架電 ${blockers.callAttempts} 件`);
  if (blockers.callLeadNotes > 0) {
    parts.push(`CallLead メモ ${blockers.callLeadNotes} 件`);
  }
  return `履歴データ（${parts.join("、")}）があるため削除できません。停止をご利用ください。`;
}

export async function assertNotLastDevelopUser(
  userId: string,
  role: UserRole,
  mode: "suspend" | "delete"
): Promise<string | null> {
  if (role !== UserRole.DEVELOP) return null;

  const developCount = await prisma.user.count({
    where:
      mode === "suspend"
        ? { role: UserRole.DEVELOP, isActive: true }
        : { role: UserRole.DEVELOP },
  });

  if (developCount <= 1) {
    return mode === "suspend"
      ? "最後の有効な DEVELOP ユーザーは停止できません"
      : "最後の DEVELOP ユーザーは削除できません";
  }

  return null;
}

export function getSupabaseAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function setSupabaseUserBanned(
  authId: string,
  banned: boolean
): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return "Supabase 管理 API の設定が不足しています（SUPABASE_SERVICE_ROLE_KEY を確認してください）";
  }

  const { error } = await admin.auth.admin.updateUserById(authId, {
    ban_duration: banned ? "876000h" : "none",
  });

  if (error) {
    return error.message;
  }

  return null;
}

export async function deleteSupabaseAuthUser(authId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return "Supabase 管理 API の設定が不足しています（SUPABASE_SERVICE_ROLE_KEY を確認してください）";
  }

  const { error } = await admin.auth.admin.deleteUser(authId);
  if (error) {
    return error.message;
  }

  return null;
}
