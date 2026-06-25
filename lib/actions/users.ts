"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import {
  canAssignDevelopRole,
  canManageUsers,
} from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { formatUserFullName } from "@/lib/users/display";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertNotLastDevelopUser,
  deleteSupabaseAuthUser,
  formatDeleteBlockerMessage,
  getUserDeleteBlockers,
  setSupabaseUserBanned,
} from "@/lib/users/lifecycle";
import {
  createUserSchema,
  inviteUserSchema,
  updateUserHierarchySchema,
  userIdActionSchema,
} from "@/lib/validators/user";
import {
  InviteUserError,
  inviteUserToTenant,
  resendUserInvite,
} from "@/lib/users/invite";
import {
  assertCanCreate,
  isTenantLimitError,
  tenantLimitErrorMessage,
} from "@/lib/tenant/enforce-limits";

export type CreateUserActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export type UpdateUserHierarchyActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export type InviteUserActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export type UserLifecycleActionState = {
  error?: string;
  success?: boolean;
};

function normalizeManagerId(managerId?: string): string | null {
  return managerId && managerId.length > 0 ? managerId : null;
}

function validateRoleAssignment(
  actorRole: UserRole,
  targetRole: UserRole
): string | null {
  if (targetRole === UserRole.DEVELOP && !canAssignDevelopRole(actorRole)) {
    return "DEVELOP ロールを設定する権限がありません";
  }
  return null;
}

export async function inviteUserAction(
  _prev: InviteUserActionState,
  formData: FormData
): Promise<InviteUserActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = inviteUserSchema.safeParse({
    email: formData.get("email"),
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName") || undefined,
    role: formData.get("role") || UserRole.ADVISOR,
    managerId: formData.get("managerId") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, lastName, firstName, role } = parsed.data;
  const managerId = normalizeManagerId(parsed.data.managerId);
  const roleError = validateRoleAssignment(user.role, role);
  if (roleError) return { error: roleError };

  if (role === UserRole.ADVISOR && !managerId) {
    return { error: "CA には所属マネージャーを指定してください" };
  }

  if (managerId) {
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        tenantId,
        isActive: true,
        role: { in: [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOP] },
      },
    });
    if (!manager) {
      return { error: "指定されたマネージャーが見つかりません" };
    }
  }

  try {
    await inviteUserToTenant({
      email,
      lastName,
      firstName,
      tenantId,
      role,
      managerId: role === UserRole.ADVISOR ? managerId : null,
      actorUserId: user.id,
    });
  } catch (error) {
    if (isTenantLimitError(error)) {
      return { error: tenantLimitErrorMessage(error) };
    }
    if (error instanceof InviteUserError) {
      return { error: error.message };
    }
    return { error: "招待メールの送信に失敗しました" };
  }

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}

export async function resendInviteAction(
  userId: string
): Promise<UserLifecycleActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = userIdActionSchema.safeParse({ userId });
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const { target, error: loadError } = await loadManagedUser(
    parsed.data.userId,
    tenantId,
    user.id
  );
  if (loadError || !target) {
    return { error: loadError ?? "ユーザーが見つかりません" };
  }

  if (!target.pendingInvite) {
    return { error: "このユーザーは招待待ちではありません" };
  }

  try {
    await resendUserInvite(target.id, tenantId);
  } catch (error) {
    if (error instanceof InviteUserError) {
      return { error: error.message };
    }
    return { error: "招待メールの再送に失敗しました" };
  }

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}

export async function createUserAction(
  _prev: CreateUserActionState,
  formData: FormData
): Promise<CreateUserActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (user.role !== UserRole.DEVELOP) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    lastName: formData.get("lastName"),
    firstName: formData.get("firstName") || undefined,
    password: formData.get("password"),
    role: formData.get("role") || UserRole.ADVISOR,
    managerId: formData.get("managerId") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, lastName, firstName, password, role } = parsed.data;
  const managerId = normalizeManagerId(parsed.data.managerId);
  const roleError = validateRoleAssignment(user.role, role);
  if (roleError) return { error: roleError };

  if (role === UserRole.ADVISOR && !managerId) {
    return { error: "CA には所属マネージャーを指定してください" };
  }

  if (managerId) {
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        tenantId,
        isActive: true,
        role: { in: [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOP] },
      },
    });
    if (!manager) {
      return { error: "指定されたマネージャーが見つかりません" };
    }
  }

  const name = formatUserFullName(lastName, firstName);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "このメールアドレスは既に登録されています" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "アカウント作成の設定が不足しています（SUPABASE_SERVICE_ROLE_KEY を確認してください）",
    };
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, lastName, firstName },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "アカウントの作成に失敗しました" };
  }

  try {
    await assertCanCreate(tenantId, "users", { actorUserId: user.id });
    await prisma.user.create({
      data: {
        authId: authData.user.id,
        email,
        name,
        lastName,
        firstName: firstName ?? null,
        tenantId,
        role,
        managerId: role === UserRole.ADVISOR ? managerId : null,
      },
    });
  } catch (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    if (isTenantLimitError(error)) {
      return { error: tenantLimitErrorMessage(error) };
    }
    return { error: "ユーザーの登録に失敗しました" };
  }

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}

export async function updateUserHierarchyAction(
  _prev: UpdateUserHierarchyActionState,
  formData: FormData
): Promise<UpdateUserHierarchyActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = updateUserHierarchySchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    managerId: formData.get("managerId") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { userId, role } = parsed.data;
  const managerId = normalizeManagerId(parsed.data.managerId);
  const roleError = validateRoleAssignment(user.role, role);
  if (roleError) return { error: roleError };

  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });
  if (!target) {
    return { error: "ユーザーが見つかりません" };
  }

  if (userId === user.id && role !== user.role) {
    return { error: "自分自身のロールは変更できません" };
  }

  if (role === UserRole.ADVISOR && !managerId) {
    return { error: "CA には所属マネージャーを指定してください" };
  }

  if (managerId) {
    if (managerId === userId) {
      return { error: "自分自身をマネージャーに指定できません" };
    }
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        tenantId,
        isActive: true,
        role: { in: [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOP] },
      },
    });
    if (!manager) {
      return { error: "指定されたマネージャーが見つかりません" };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role,
      managerId: role === UserRole.ADVISOR ? managerId : null,
    },
  });

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}

async function loadManagedUser(userId: string, tenantId: string, actorId: string) {
  const target = await prisma.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!target) {
    return { error: "ユーザーが見つかりません" as const, target: null };
  }

  if (target.id === actorId) {
    return { error: "自分自身のアカウントは操作できません" as const, target: null };
  }

  return { error: null, target };
}

export async function suspendUserAction(
  userId: string
): Promise<UserLifecycleActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = userIdActionSchema.safeParse({ userId });
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const { target, error: loadError } = await loadManagedUser(
    parsed.data.userId,
    tenantId,
    user.id
  );
  if (loadError || !target) {
    return { error: loadError ?? "ユーザーが見つかりません" };
  }

  if (!target.isActive) {
    return { error: "このユーザーは既に停止されています" };
  }

  const lastDevelopError = await assertNotLastDevelopUser(
    target.id,
    target.role,
    "suspend"
  );
  if (lastDevelopError) {
    return { error: lastDevelopError };
  }

  const banError = await setSupabaseUserBanned(target.authId, true);
  if (banError) {
    return { error: banError };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { isActive: false },
  });

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}

export async function reactivateUserAction(
  userId: string
): Promise<UserLifecycleActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = userIdActionSchema.safeParse({ userId });
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const { target, error: loadError } = await loadManagedUser(
    parsed.data.userId,
    tenantId,
    user.id
  );
  if (loadError || !target) {
    return { error: loadError ?? "ユーザーが見つかりません" };
  }

  if (target.isActive) {
    return { error: "このユーザーは既に有効です" };
  }

  const unbanError = await setSupabaseUserBanned(target.authId, false);
  if (unbanError) {
    return { error: unbanError };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { isActive: true },
  });

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}

export async function deleteUserAction(
  userId: string
): Promise<UserLifecycleActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  const parsed = userIdActionSchema.safeParse({ userId });
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const { target, error: loadError } = await loadManagedUser(
    parsed.data.userId,
    tenantId,
    user.id
  );
  if (loadError || !target) {
    return { error: loadError ?? "ユーザーが見つかりません" };
  }

  const lastDevelopError = await assertNotLastDevelopUser(
    target.id,
    target.role,
    "delete"
  );
  if (lastDevelopError) {
    return { error: lastDevelopError };
  }

  const blockers = await getUserDeleteBlockers(target.id);
  if (blockers.total > 0) {
    return { error: formatDeleteBlockerMessage(blockers) };
  }

  const authDeleteError = await deleteSupabaseAuthUser(target.authId);
  if (authDeleteError) {
    return { error: authDeleteError };
  }

  try {
    await prisma.user.delete({ where: { id: target.id } });
  } catch {
    return {
      error:
        "CRM からの削除に失敗しました。Supabase 側は削除済みの可能性があります。",
    };
  }

  revalidatePath("/settings/members");
  revalidatePath("/users");
  return { success: true };
}
