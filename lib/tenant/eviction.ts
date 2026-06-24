import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PROTECTED_APPLICATION_STATUSES,
  PROTECTED_CALL_LEAD_STATUSES,
  PROTECTED_CANDIDATE_STATUSES,
} from "@/lib/constants/tenant-eviction";
import type { TenantLimitResource } from "@/lib/tenant/plan-config";

type DbClient = Prisma.TransactionClient | typeof prisma;

function dbClient(tx?: Prisma.TransactionClient): DbClient {
  return tx ?? prisma;
}

export function activeCallLeadFilter(
  tenantId: string
): Prisma.CallLeadWhereInput {
  return {
    tenantId,
    deletedAt: null,
  };
}

export function evictableCallLeadWhere(
  tenantId: string
): Prisma.CallLeadWhereInput {
  return {
    ...activeCallLeadFilter(tenantId),
    status: { notIn: PROTECTED_CALL_LEAD_STATUSES },
  };
}

export function evictableCandidateWhere(
  tenantId: string
): Prisma.CandidateWhereInput {
  return {
    tenantId,
    deletedAt: null,
    status: { notIn: PROTECTED_CANDIDATE_STATUSES },
    applications: {
      none: {
        status: { in: PROTECTED_APPLICATION_STATUSES },
      },
    },
  };
}

export async function countEvictableRecords(
  tenantId: string,
  resource: TenantLimitResource,
  tx?: Prisma.TransactionClient
): Promise<number> {
  const db = dbClient(tx);

  switch (resource) {
    case "users":
      return 0;
    case "callLeads":
      return db.callLead.count({ where: evictableCallLeadWhere(tenantId) });
    case "candidates":
      return db.candidate.count({ where: evictableCandidateWhere(tenantId) });
  }
}

export async function evictOldestRecords(
  tenantId: string,
  resource: Exclude<TenantLimitResource, "users">,
  count: number,
  tx?: Prisma.TransactionClient
): Promise<string[]> {
  if (count <= 0) return [];

  const db = dbClient(tx);
  const now = new Date();

  if (resource === "callLeads") {
    const targets = await db.callLead.findMany({
      where: evictableCallLeadWhere(tenantId),
      orderBy: [{ appliedAt: "asc" }, { createdAt: "asc" }],
      take: count,
      select: { id: true },
    });

    if (targets.length === 0) return [];

    const ids = targets.map((row) => row.id);
    await db.callLead.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: now },
    });
    return ids;
  }

  const targets = await db.candidate.findMany({
    where: evictableCandidateWhere(tenantId),
    orderBy: { createdAt: "asc" },
    take: count,
    select: { id: true },
  });

  if (targets.length === 0) return [];

  const ids = targets.map((row) => row.id);
  await db.candidate.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: now },
  });
  return ids;
}
