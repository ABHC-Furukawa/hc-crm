export const DISPATCH_COMPANY_KEYS = [
  "ABHC",
  "BREXA_NEXT",
  "NS_TECH",
  "SOGO_CAREER",
  "HIRAYAMA",
  "TOYO_WORK",
  "YOKOTA",
  "UT_AIM",
  "WORLD_INTEC",
  "TAKAKOGYO",
  "NIKKEN",
  "OTHER",
] as const;

export type DispatchCompanyKey = (typeof DISPATCH_COMPANY_KEYS)[number];

export const DISPATCH_COMPANY_LABELS: Record<DispatchCompanyKey, string> = {
  ABHC: "ABHC",
  BREXA_NEXT: "BREXA Next",
  NS_TECH: "エヌエス・テック",
  SOGO_CAREER: "綜合キャリアオプション",
  HIRAYAMA: "平山",
  TOYO_WORK: "東洋ワーク",
  YOKOTA: "ヨコタエンタープライズ",
  UT_AIM: "UTエイム",
  WORLD_INTEC: "ワールドインテック",
  TAKAKOGYO: "高木工業",
  NIKKEN: "日研トータルソーシング",
  OTHER: "その他",
};

/** 表示ラベル → DB キー（既存データ移行用） */
export const DISPATCH_COMPANY_LABEL_TO_KEY: Record<string, DispatchCompanyKey> =
  Object.fromEntries(
    Object.entries(DISPATCH_COMPANY_LABELS).map(([key, label]) => [label, key as DispatchCompanyKey])
  ) as Record<string, DispatchCompanyKey>;

export const DISPATCH_COMPANY_OPTIONS = DISPATCH_COMPANY_KEYS.map((key) => ({
  value: key,
  label: DISPATCH_COMPANY_LABELS[key],
}));

export function formatDispatchCompanyLabel(
  key: string | null | undefined,
  other: string | null | undefined
): string {
  if (!key) return "—";
  if (key === "OTHER") {
    const trimmed = other?.trim();
    return trimmed || "その他";
  }
  return DISPATCH_COMPANY_LABELS[key as DispatchCompanyKey] ?? key;
}

export function isDispatchCompanyKey(value: string): value is DispatchCompanyKey {
  return (DISPATCH_COMPANY_KEYS as readonly string[]).includes(value);
}
