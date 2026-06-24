import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { canCrossTenantAccess } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

export const DEVELOP_TENANT_COOKIE = "ca-crm-develop-tenant-id";

export async function getDevelopTenantCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DEVELOP_TENANT_COOKIE)?.value ?? null;
}

export async function resolveEffectiveTenantId(
  user: User,
  homeTenantId: string
): Promise<string> {
  if (!canCrossTenantAccess(user.role)) {
    return homeTenantId;
  }

  const selectedId = await getDevelopTenantCookie();
  if (!selectedId || selectedId === homeTenantId) {
    return homeTenantId;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: selectedId },
    select: { id: true },
  });

  return tenant?.id ?? homeTenantId;
}
