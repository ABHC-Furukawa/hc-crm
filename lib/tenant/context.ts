import type { User } from "@prisma/client";
import { assertActiveUser } from "@/lib/auth/access";
import { getSessionUser, requireSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TENANT_ID, DEFAULT_TENANT_SLUG } from "@/lib/tenant/constants";
import { resolveEffectiveTenantId } from "@/lib/tenant/develop-tenant";

export type TenantContext = {
  user: User;
  /** データ参照に使う tenant（DEVELOP 切替時は cookie 優先） */
  tenantId: string;
  /** ユーザーの所属 tenant */
  homeTenantId: string;
  /** DEVELOP が所属外 tenant を参照中 */
  isDevelopTenantOverride: boolean;
};

export async function getDefaultTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
    select: { id: true },
  });

  if (tenant) return tenant.id;

  // マイグレーション未適用時のフォールバック（開発用）
  return DEFAULT_TENANT_ID;
}

export async function resolveTenantIdForUser(user: User): Promise<string> {
  return user.tenantId;
}

/** 未設定ユーザーの tenantId を backfill（マイグレーション後は no-op） */
export async function ensureUserTenant(user: User): Promise<User> {
  return user;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const user = await getSessionUser();
  if (!user) return null;

  try {
    assertActiveUser(user);
  } catch {
    return null;
  }

  const resolvedUser = await ensureUserTenant(user);
  const homeTenantId = resolvedUser.tenantId;
  const tenantId = await resolveEffectiveTenantId(resolvedUser, homeTenantId);

  return {
    user: resolvedUser,
    tenantId,
    homeTenantId,
    isDevelopTenantOverride: tenantId !== homeTenantId,
  };
}

export async function requireTenantContext(): Promise<TenantContext> {
  const user = await requireSessionUser();
  assertActiveUser(user);

  const resolvedUser = await ensureUserTenant(user);
  const homeTenantId = resolvedUser.tenantId;
  const tenantId = await resolveEffectiveTenantId(resolvedUser, homeTenantId);

  return {
    user: resolvedUser,
    tenantId,
    homeTenantId,
    isDevelopTenantOverride: tenantId !== homeTenantId,
  };
}
