import { TenantLimitPolicy, TenantPlan } from "@prisma/client";

/** 上限 enforcement 対象リソース（users は BLOCK のみ） */
export type TenantLimitResource = "users" | "callLeads" | "candidates";

export type ResourceLimitConfig = {
  max: number;
  policy: TenantLimitPolicy;
};

export type TenantPlanConfig = {
  label: string;
  limits: Record<TenantLimitResource, ResourceLimitConfig>;
};

/**
 * プラン別上限・ポリシー（社内調整はこのファイルのみ変更）
 * max / policy は TBD 可 — 4d-2 enforcement が参照する
 */
export const TENANT_PLAN_CONFIG: Record<TenantPlan, TenantPlanConfig> = {
  [TenantPlan.FREE]: {
    label: "無料",
    limits: {
      users: { max: 2, policy: TenantLimitPolicy.BLOCK },
      callLeads: { max: 100, policy: TenantLimitPolicy.BLOCK },
      candidates: { max: 50, policy: TenantLimitPolicy.BLOCK },
    },
  },
  [TenantPlan.STARTER]: {
    label: "スターター",
    limits: {
      users: { max: 5, policy: TenantLimitPolicy.BLOCK },
      callLeads: { max: 500, policy: TenantLimitPolicy.EVICT_OLDEST },
      candidates: { max: 200, policy: TenantLimitPolicy.BLOCK },
    },
  },
  [TenantPlan.PROFESSIONAL]: {
    label: "プロフェッショナル",
    limits: {
      users: { max: 20, policy: TenantLimitPolicy.BLOCK },
      callLeads: { max: 2000, policy: TenantLimitPolicy.EVICT_OLDEST },
      candidates: { max: 1000, policy: TenantLimitPolicy.EVICT_OLDEST },
    },
  },
  [TenantPlan.ENTERPRISE]: {
    label: "エンタープライズ",
    limits: {
      users: { max: 9999, policy: TenantLimitPolicy.BLOCK },
      callLeads: { max: 99999, policy: TenantLimitPolicy.BLOCK },
      candidates: { max: 99999, policy: TenantLimitPolicy.BLOCK },
    },
  },
};

export const TENANT_RESOURCE_LABELS: Record<TenantLimitResource, string> = {
  users: "メンバー",
  callLeads: "架電リスト",
  candidates: "求職者",
};

export const TENANT_LIMIT_POLICY_LABELS: Record<TenantLimitPolicy, string> = {
  [TenantLimitPolicy.BLOCK]: "上限到達で新規停止",
  [TenantLimitPolicy.EVICT_OLDEST]: "古い順に自動整理",
};

export const TENANT_LIMIT_POLICY_DESCRIPTIONS: Record<TenantLimitPolicy, string> =
  {
    [TenantLimitPolicy.BLOCK]:
      "上限に達すると新規登録・取込ができません。",
    [TenantLimitPolicy.EVICT_OLDEST]:
      "上限を超えると、架電リストは応募日の古い順、求職者は登録の古い順に自動整理されます。ヒアリング中・求職者化済みの架電、進行中・内定/入社の求職者は対象外です。",
  };

export function getTenantPlanConfig(plan: TenantPlan): TenantPlanConfig {
  return TENANT_PLAN_CONFIG[plan];
}

export function getTenantPlanLabel(plan: TenantPlan): string {
  return TENANT_PLAN_CONFIG[plan].label;
}

export function getTenantPlanLimits(
  plan: TenantPlan
): Record<TenantLimitResource, ResourceLimitConfig> {
  return TENANT_PLAN_CONFIG[plan].limits;
}

export const TENANT_PLAN_OPTIONS = (
  Object.entries(TENANT_PLAN_CONFIG) as [TenantPlan, TenantPlanConfig][]
).map(([value, config]) => ({
  value,
  label: config.label,
}));
