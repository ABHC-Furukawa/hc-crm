/**
 * 求職者詳細「紹介可能派遣会社」チェックボックス用。
 * 案件タブの DISPATCH_COMPANY_KEYS とは別（表示名・対象会社が異なる）。
 */
export const REFERRABLE_DISPATCH_COMPANY_KEYS = [
  "BREXA",
  "SOGO_CAREER",
  "NIKKEN",
  "TAKAKOGYO",
  "NS_TECH",
  "SHINNIHON",
  "YOKOTA",
  "WORLD",
  "WILLTEC",
  "TOYO_WORK",
  "UT_AIM",
  "HIRAYAMA",
  "COPRO",
] as const;

export type ReferrableDispatchCompanyKey =
  (typeof REFERRABLE_DISPATCH_COMPANY_KEYS)[number];

export const REFERRABLE_DISPATCH_COMPANY_LABELS: Record<
  ReferrableDispatchCompanyKey,
  string
> = {
  BREXA: "BREXA",
  SOGO_CAREER: "綜合キャリア",
  NIKKEN: "日研",
  TAKAKOGYO: "髙木工業",
  NS_TECH: "エヌエス・テック",
  SHINNIHON: "新日本",
  YOKOTA: "ヨコタ",
  WORLD: "ワールド",
  WILLTEC: "ウィルテック",
  TOYO_WORK: "東洋ワーク",
  UT_AIM: "UTエイム",
  HIRAYAMA: "平山",
  COPRO: "コプロ",
};

export const REFERRABLE_DISPATCH_COMPANY_OPTIONS =
  REFERRABLE_DISPATCH_COMPANY_KEYS.map((key) => ({
    value: key,
    label: REFERRABLE_DISPATCH_COMPANY_LABELS[key],
  }));

export function isReferrableDispatchCompanyKey(
  value: string
): value is ReferrableDispatchCompanyKey {
  return (REFERRABLE_DISPATCH_COMPANY_KEYS as readonly string[]).includes(value);
}
