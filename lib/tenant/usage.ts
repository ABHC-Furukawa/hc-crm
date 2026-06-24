import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activeCallLeadFilter } from "@/lib/tenant/eviction";
import type { TenantLimitResource } from "@/lib/tenant/plan-config";

export type TenantUsageCounts = Record<TenantLimitResource, number>;

type DbClient = Prisma.TransactionClient | typeof prisma;

function dbClient(tx?: Prisma.TransactionClient): DbClient {
  return tx ?? prisma;
}

export async function countTenantResource(
  tenantId: string,
  resource: TenantLimitResource,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const db = dbClient(tx);

  switch (resource) {
    case "users":
      return db.user.count({
        where: { tenantId, isActive: true },
      });
    case "callLeads":
      return db.callLead.count({
        where: activeCallLeadFilter(tenantId),
      });
    case "candidates":
      return db.candidate.count({
        where: { tenantId, deletedAt: null },
      });
  }
}

/** テナントの active 件数 */
export async function getTenantUsage(
  tenantId: string
): Promise<TenantUsageCounts> {
  const [users, callLeads, candidates] = await Promise.all([
    countTenantResource(tenantId, "users"),
    countTenantResource(tenantId, "callLeads"),
    countTenantResource(tenantId, "candidates"),
  ]);

  return { users, callLeads, candidates };
}
