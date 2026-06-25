/** Client / Server 共通 — @prisma/client に依存しないプラン定義 */

export const TENANT_PLAN_VALUES = [
  "FREE",
  "STARTER",
  "PROFESSIONAL",
  "ENTERPRISE",
] as const;

export type TenantPlanValue = (typeof TENANT_PLAN_VALUES)[number];

export const TENANT_PLAN_LABELS: Record<TenantPlanValue, string> = {
  FREE: "無料",
  STARTER: "スターター",
  PROFESSIONAL: "プロフェッショナル",
  ENTERPRISE: "エンタープライズ",
};

export const TENANT_PLAN_OPTIONS = TENANT_PLAN_VALUES.map((value) => ({
  value,
  label: TENANT_PLAN_LABELS[value],
}));

export function isTenantPlanValue(value: string): value is TenantPlanValue {
  return (TENANT_PLAN_VALUES as readonly string[]).includes(value);
}

export function getTenantPlanLabelFromValue(plan: TenantPlanValue): string {
  return TENANT_PLAN_LABELS[plan];
}
