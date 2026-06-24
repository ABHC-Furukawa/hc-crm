import {
  TenantAuditAction,
  TenantPlan,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTenantPlanLabel } from "@/lib/tenant/plan-config";
import type { TenantLimitResource } from "@/lib/tenant/plan-config";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type WriteTenantAuditInput = {
  tenantId: string;
  action: TenantAuditAction;
  actorUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
};

export async function writeTenantAuditLog(
  input: WriteTenantAuditInput
): Promise<void> {
  const db: DbClient = input.tx ?? prisma;

  await db.tenantAuditLog.create({
    data: {
      tenantId: input.tenantId,
      action: input.action,
      actorId: input.actorUserId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export const TENANT_AUDIT_ACTION_LABELS: Record<TenantAuditAction, string> = {
  [TenantAuditAction.LIMIT_BLOCKED]: "上限ブロック",
  [TenantAuditAction.RECORD_EVICTED]: "自動退避",
  [TenantAuditAction.EVICT_FALLBACK_BLOCK]: "退避不足ブロック",
  [TenantAuditAction.PLAN_CHANGED]: "プラン変更",
  [TenantAuditAction.USER_INVITED]: "メンバー招待",
};

type LimitAuditMetadata = {
  resource?: TenantLimitResource;
  usage?: number;
  max?: number;
  evictedIds?: string[];
  evictedCount?: number;
  neededEvictions?: number;
  evictable?: number;
};

type PlanChangedMetadata = {
  fromPlan?: TenantPlan;
  toPlan?: TenantPlan;
};

type UserInvitedMetadata = {
  email?: string;
  role?: string;
  userId?: string;
};

export function formatTenantAuditSummary(
  action: TenantAuditAction,
  metadata: unknown
): string {
  const data = (metadata ?? {}) as LimitAuditMetadata &
    PlanChangedMetadata &
    UserInvitedMetadata;

  switch (action) {
    case TenantAuditAction.LIMIT_BLOCKED: {
      const resource = data.resource ?? "resource";
      return `${resourceLabel(resource)} — 利用 ${data.usage ?? "?"} / 上限 ${data.max ?? "?"}`;
    }
    case TenantAuditAction.EVICT_FALLBACK_BLOCK: {
      const resource = data.resource ?? "resource";
      return `${resourceLabel(resource)} — 退避可能 ${data.evictable ?? "?"} 件、必要 ${data.neededEvictions ?? "?"} 件`;
    }
    case TenantAuditAction.RECORD_EVICTED: {
      const resource = data.resource ?? "resource";
      const count = data.evictedCount ?? data.evictedIds?.length ?? 0;
      return `${resourceLabel(resource)} — ${count} 件を退避`;
    }
    case TenantAuditAction.PLAN_CHANGED: {
      const fromLabel = data.fromPlan
        ? getTenantPlanLabel(data.fromPlan)
        : "?";
      const toLabel = data.toPlan ? getTenantPlanLabel(data.toPlan) : "?";
      return `${fromLabel} → ${toLabel}`;
    }
    case TenantAuditAction.USER_INVITED:
      return data.email
        ? `${data.email}${data.role ? ` (${data.role})` : ""}`
        : "メンバーを招待";
    default:
      return "";
  }
}

function resourceLabel(resource: string): string {
  switch (resource) {
    case "users":
      return "メンバー";
    case "callLeads":
      return "架電リスト";
    case "candidates":
      return "求職者";
    default:
      return resource;
  }
}

export async function logLimitBlocked(input: {
  tenantId: string;
  resource: TenantLimitResource;
  usage: number;
  max: number;
  actorUserId?: string | null;
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  await writeTenantAuditLog({
    tenantId: input.tenantId,
    action: TenantAuditAction.LIMIT_BLOCKED,
    actorUserId: input.actorUserId,
    metadata: {
      resource: input.resource,
      usage: input.usage,
      max: input.max,
    },
    tx: input.tx,
  });
}

export async function logEvictFallbackBlock(input: {
  tenantId: string;
  resource: TenantLimitResource;
  usage: number;
  max: number;
  neededEvictions: number;
  evictable: number;
  actorUserId?: string | null;
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  await writeTenantAuditLog({
    tenantId: input.tenantId,
    action: TenantAuditAction.EVICT_FALLBACK_BLOCK,
    actorUserId: input.actorUserId,
    metadata: {
      resource: input.resource,
      usage: input.usage,
      max: input.max,
      neededEvictions: input.neededEvictions,
      evictable: input.evictable,
    },
    tx: input.tx,
  });
}

export async function logRecordEvicted(input: {
  tenantId: string;
  resource: Exclude<TenantLimitResource, "users">;
  evictedIds: string[];
  actorUserId?: string | null;
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  if (input.evictedIds.length === 0) return;

  await writeTenantAuditLog({
    tenantId: input.tenantId,
    action: TenantAuditAction.RECORD_EVICTED,
    actorUserId: input.actorUserId,
    metadata: {
      resource: input.resource,
      evictedIds: input.evictedIds,
      evictedCount: input.evictedIds.length,
    },
    tx: input.tx,
  });
}

export async function logPlanChanged(input: {
  tenantId: string;
  fromPlan: TenantPlan;
  toPlan: TenantPlan;
  actorUserId: string;
}): Promise<void> {
  await writeTenantAuditLog({
    tenantId: input.tenantId,
    action: TenantAuditAction.PLAN_CHANGED,
    actorUserId: input.actorUserId,
    metadata: {
      fromPlan: input.fromPlan,
      toPlan: input.toPlan,
    },
  });
}

export async function logUserInvited(input: {
  tenantId: string;
  email: string;
  role: string;
  userId: string;
  actorUserId: string;
}): Promise<void> {
  await writeTenantAuditLog({
    tenantId: input.tenantId,
    action: TenantAuditAction.USER_INVITED,
    actorUserId: input.actorUserId,
    metadata: {
      email: input.email,
      role: input.role,
      userId: input.userId,
    },
  });
}
