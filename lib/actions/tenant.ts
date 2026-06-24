"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { UserRole } from "@prisma/client";
import {
  canCrossTenantAccess,
  canManageAllTenants,
  canManageTenantSettings,
} from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import { DEVELOP_TENANT_COOKIE } from "@/lib/tenant/develop-tenant";
import { listAllTenants } from "@/lib/tenant/queries";
import {
  InviteUserError,
  inviteUserToTenant,
} from "@/lib/users/invite";
import {
  isTenantLimitError,
  tenantLimitErrorMessage,
} from "@/lib/tenant/enforce-limits";
import { logPlanChanged } from "@/lib/tenant/audit";
import {
  createTenantSchema,
  updateTenantPlanSchema,
  updateTenantSchema,
} from "@/lib/validators/tenant";

export type TenantActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function getDevelopTenantOptions() {
  const { user, tenantId, homeTenantId } = await requireTenantContext();

  if (!canCrossTenantAccess(user.role)) {
    return { tenants: [], currentTenantId: null, homeTenantId: null };
  }

  const tenants = await listAllTenants();

  return { tenants, currentTenantId: tenantId, homeTenantId };
}

export async function setDevelopTenantAction(
  tenantId: string | null
): Promise<TenantActionState> {
  const { user, homeTenantId } = await requireTenantContext();

  if (!canCrossTenantAccess(user.role)) {
    return { error: "テナント切替の権限がありません" };
  }

  const jar = await cookies();

  if (!tenantId || tenantId === homeTenantId) {
    jar.delete(DEVELOP_TENANT_COOKIE);
  } else {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return { error: "テナントが見つかりません" };
    }

    jar.set(DEVELOP_TENANT_COOKIE, tenantId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateTenantAction(
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const { user, tenantId, homeTenantId } = await requireTenantContext();

  if (!canManageTenantSettings(user.role)) {
    return { error: "この操作を行う権限がありません" };
  }

  if (user.role !== UserRole.DEVELOP && tenantId !== homeTenantId) {
    return { error: "自組織のみ編集できます" };
  }

  const parsed = updateTenantSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { error: "組織が見つかりません" };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { name: parsed.data.name.trim() },
  });

  revalidatePath("/settings/tenant");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function createTenantWithAdminAction(
  _prev: TenantActionState,
  formData: FormData
): Promise<TenantActionState> {
  const { user } = await requireTenantContext();

  if (!canManageAllTenants(user.role)) {
    return { error: "テナント作成の権限がありません" };
  }

  const parsed = createTenantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    adminEmail: formData.get("adminEmail"),
    adminLastName: formData.get("adminLastName"),
    adminFirstName: formData.get("adminFirstName") || undefined,
  });

  if (!parsed.success) {
    return {
      error: "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, slug, adminEmail, adminLastName, adminFirstName } = parsed.data;

  const existingSlug = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existingSlug) {
    return { error: "この slug は既に使用されています" };
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: adminEmail.trim().toLowerCase() },
    select: { id: true },
  });
  if (existingEmail) {
    return { error: "管理者メールアドレスは既に登録されています" };
  }

  let createdTenantId: string | null = null;

  try {
    const tenant = await prisma.tenant.create({
      data: { name: name.trim(), slug },
    });
    createdTenantId = tenant.id;

    await inviteUserToTenant({
      email: adminEmail,
      lastName: adminLastName,
      firstName: adminFirstName,
      tenantId: tenant.id,
      role: UserRole.ADMIN,
      actorUserId: user.id,
    });
  } catch (error) {
    if (createdTenantId) {
      await prisma.user.deleteMany({ where: { tenantId: createdTenantId } });
      await prisma.tenant.delete({ where: { id: createdTenantId } });
    }
    if (error instanceof InviteUserError) {
      return { error: error.message };
    }
    if (isTenantLimitError(error)) {
      return { error: tenantLimitErrorMessage(error) };
    }
    return { error: "テナントの作成に失敗しました" };
  }

  revalidatePath("/settings/tenants");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateTenantPlanAction(
  tenantId: string,
  plan: string
): Promise<TenantActionState> {
  const { user } = await requireTenantContext();

  if (!canManageAllTenants(user.role)) {
    return { error: "プラン変更の権限がありません" };
  }

  const parsed = updateTenantPlanSchema.safeParse({ tenantId, plan });

  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, plan: true },
  });

  if (!tenant) {
    return { error: "テナントが見つかりません" };
  }

  if (tenant.plan === parsed.data.plan) {
    return { success: true };
  }

  await prisma.tenant.update({
    where: { id: parsed.data.tenantId },
    data: { plan: parsed.data.plan },
  });

  await logPlanChanged({
    tenantId: parsed.data.tenantId,
    fromPlan: tenant.plan,
    toPlan: parsed.data.plan,
    actorUserId: user.id,
  });

  revalidatePath("/settings/tenants");
  revalidatePath(`/settings/tenants/${parsed.data.tenantId}`);
  revalidatePath("/settings/tenant");
  return { success: true };
}
