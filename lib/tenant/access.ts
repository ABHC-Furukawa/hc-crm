import type { Prisma, User } from "@prisma/client";
import { AccessDeniedError, assertActiveUser } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import { activeCallLeadFilter } from "@/lib/tenant/eviction";
import { requireTenantContext } from "@/lib/tenant/context";

/** 同一 tenant 内の架電リードは組織共通（担当者による絞り込みはしない） */
export function callLeadAccessFilter(
  _user: User,
  tenantId: string
): Prisma.CallLeadWhereInput {
  return activeCallLeadFilter(tenantId);
}

export function companyAccessFilter(tenantId: string): Prisma.CompanyWhereInput {
  return { tenantId, deletedAt: null };
}

export function tagAccessFilter(tenantId: string): Prisma.TagWhereInput {
  return { tenantId };
}

export async function assertCallLeadAccess(
  callLeadId: string
): Promise<{ user: User; tenantId: string; callLeadId: string }> {
  const { user, tenantId } = await requireTenantContext();
  assertActiveUser(user);

  const callLead = await prisma.callLead.findFirst({
    where: {
      id: callLeadId,
      ...callLeadAccessFilter(user, tenantId),
    },
    select: { id: true },
  });

  if (!callLead) {
    throw new AccessDeniedError("架電リードが見つかりません");
  }

  return { user, tenantId, callLeadId: callLead.id };
}
