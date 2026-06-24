import { TenantLimitPolicy, type Prisma } from "@prisma/client";
import {
  TENANT_RESOURCE_LABELS,
  getTenantPlanLimits,
  type TenantLimitResource,
} from "@/lib/tenant/plan-config";
import {
  countEvictableRecords,
  evictOldestRecords,
} from "@/lib/tenant/eviction";
import {
  logEvictFallbackBlock,
  logLimitBlocked,
  logRecordEvicted,
} from "@/lib/tenant/audit";
import {
  countTenantResource,
  getTenantUsage,
  type TenantUsageCounts,
} from "@/lib/tenant/usage";
import { prisma } from "@/lib/prisma";

export type TenantLimitErrorCode = "LIMIT_BLOCKED" | "EVICT_FALLBACK_BLOCK";

export class TenantLimitError extends Error {
  constructor(
    public readonly resource: TenantLimitResource,
    public readonly code: TenantLimitErrorCode,
    message: string
  ) {
    super(message);
    this.name = "TenantLimitError";
  }
}

type LimitOptions = {
  increment?: number;
  actorUserId?: string | null;
  tx?: Prisma.TransactionClient;
};

type EnforceOptions = {
  actorUserId?: string | null;
  tx?: Prisma.TransactionClient;
};

function limitBlockedMessage(resource: TenantLimitResource): string {
  switch (resource) {
    case "users":
      return "メンバー数がプラン上限に達しているため、新規招待・作成できません。";
    case "callLeads":
      return "架電リストがプラン上限に達しているため、新規登録・取込できません。";
    case "candidates":
      return "求職者数がプラン上限に達しているため、新規登録できません。";
  }
}

function evictFallbackMessage(resource: TenantLimitResource): string {
  const label = TENANT_RESOURCE_LABELS[resource];
  return `${label}の上限を超えますが、退避可能なデータが不足しているため新規登録できません。進行中・保護対象のデータは削除されません。`;
}

export function tenantLimitErrorMessage(error: TenantLimitError): string {
  return error.message;
}

export function isTenantLimitError(error: unknown): error is TenantLimitError {
  return error instanceof TenantLimitError;
}

async function loadTenantPlan(
  tenantId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  return db.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
}

/** 作成前チェック — BLOCK / EVICT 両対応（EVICT は退避不足時フォールバック BLOCK） */
export async function assertCanCreate(
  tenantId: string,
  resource: TenantLimitResource,
  options: LimitOptions = {}
): Promise<void> {
  const increment = options.increment ?? 1;
  const tenant = await loadTenantPlan(tenantId, options.tx);

  if (!tenant) {
    throw new Error("テナントが見つかりません");
  }

  const limits = getTenantPlanLimits(tenant.plan)[resource];
  const usage = await countTenantResource(
    tenantId,
    resource,
    options.tx
  );

  if (limits.policy === TenantLimitPolicy.BLOCK) {
    if (usage + increment > limits.max) {
      await logLimitBlocked({
        tenantId,
        resource,
        usage,
        max: limits.max,
        actorUserId: options.actorUserId,
      });
      throw new TenantLimitError(
        resource,
        "LIMIT_BLOCKED",
        limitBlockedMessage(resource)
      );
    }
    return;
  }

  const neededEvictions = Math.max(0, usage + increment - limits.max);
  if (neededEvictions === 0) return;

  const evictable = await countEvictableRecords(
    tenantId,
    resource,
    options.tx
  );

  if (evictable < neededEvictions) {
    await logEvictFallbackBlock({
      tenantId,
      resource,
      usage,
      max: limits.max,
      neededEvictions,
      evictable,
      actorUserId: options.actorUserId,
    });
    throw new TenantLimitError(
      resource,
      "EVICT_FALLBACK_BLOCK",
      evictFallbackMessage(resource)
    );
  }
}

/** 作成後 enforcement — EVICT_OLDEST ポリシーのみ超過分を退避 */
export async function enforceAfterCreate(
  tenantId: string,
  resource: TenantLimitResource,
  options: EnforceOptions = {}
): Promise<{ evictedIds: string[] }> {
  if (resource === "users") {
    return { evictedIds: [] };
  }

  const tenant = await loadTenantPlan(tenantId, options.tx);
  if (!tenant) {
    throw new Error("テナントが見つかりません");
  }

  const limits = getTenantPlanLimits(tenant.plan)[resource];
  if (limits.policy !== TenantLimitPolicy.EVICT_OLDEST) {
    return { evictedIds: [] };
  }

  const usage = await countTenantResource(tenantId, resource, options.tx);
  const toEvict = usage - limits.max;
  if (toEvict <= 0) {
    return { evictedIds: [] };
  }

  const evictedIds = await evictOldestRecords(
    tenantId,
    resource,
    toEvict,
    options.tx
  );

  await logRecordEvicted({
    tenantId,
    resource,
    evictedIds,
    actorUserId: options.actorUserId,
    tx: options.tx,
  });

  return { evictedIds };
}

export async function getTenantUsageWithLimits(tenantId: string): Promise<{
  usage: TenantUsageCounts;
  limits: ReturnType<typeof getTenantPlanLimits>;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  if (!tenant) {
    throw new Error("テナントが見つかりません");
  }

  const [usage, limits] = await Promise.all([
    getTenantUsage(tenantId),
    Promise.resolve(getTenantPlanLimits(tenant.plan)),
  ]);

  return { usage, limits };
}
