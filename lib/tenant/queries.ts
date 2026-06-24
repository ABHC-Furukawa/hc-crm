import { TenantPlan } from "@prisma/client";
import { canViewTenantAuditLogs } from "@/lib/auth/rbac";
import { AccessDeniedError } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import {
  getTenantPlanConfig,
  getTenantPlanLabel,
  type ResourceLimitConfig,
  type TenantLimitResource,
} from "@/lib/tenant/plan-config";
import { getTenantUsage, type TenantUsageCounts } from "@/lib/tenant/usage";

export async function listAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, plan: true },
  });
}

export async function getTenantSummary(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, plan: true },
  });
}

export type TenantUsageSnapshot = {
  usage: TenantUsageCounts;
  limits: Record<TenantLimitResource, ResourceLimitConfig>;
  planLabel: string;
};

export async function getTenantUsageSnapshot(
  tenantId: string,
  plan: TenantPlan
): Promise<TenantUsageSnapshot> {
  const [usage, planConfig] = await Promise.all([
    getTenantUsage(tenantId),
    Promise.resolve(getTenantPlanConfig(plan)),
  ]);

  return {
    usage,
    limits: planConfig.limits,
    planLabel: getTenantPlanLabel(plan),
  };
}

export async function listTenantsWithStats() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          users: { where: { isActive: true } },
          candidates: { where: { deletedAt: null } },
          callLeads: { where: { deletedAt: null } },
        },
      },
    },
  });

  return tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    planLabel: getTenantPlanLabel(tenant.plan),
    createdAt: tenant.createdAt,
    activeUserCount: tenant._count.users,
    candidateCount: tenant._count.candidates,
    callLeadCount: tenant._count.callLeads,
  }));
}

export async function getTenantDetail(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      createdAt: true,
    },
  });
}

export async function listTenantAuditLogs(tenantId: string, limit = 100) {
  const { user } = await requireTenantContext();

  if (!canViewTenantAuditLogs(user.role)) {
    throw new AccessDeniedError("監査ログを閲覧する権限がありません");
  }

  return prisma.tenantAuditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}
