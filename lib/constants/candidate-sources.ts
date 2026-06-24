/**
 * 流入経路マスタ（拡張時はここに { key, label } を追加し、DB の source は String で保存）
 */
export const CANDIDATE_SOURCE_OPTIONS = [
  { key: "KYUJIN_BOX", label: "求人BOX" },
  { key: "META_AD", label: "META広告" },
  { key: "INDEED", label: "indeed" },
  { key: "OTHER", label: "その他" },
] as const;

export type CandidateSourceKey = (typeof CANDIDATE_SOURCE_OPTIONS)[number]["key"];

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSourceKey, string> =
  Object.fromEntries(CANDIDATE_SOURCE_OPTIONS.map((o) => [o.key, o.label])) as Record<
    CandidateSourceKey,
    string
  >;

export const CANDIDATE_SOURCE_KEYS = CANDIDATE_SOURCE_OPTIONS.map((o) => o.key);

export function getCandidateSourceLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return CANDIDATE_SOURCE_LABELS[key as CandidateSourceKey] ?? key;
}

export const QUALIFICATION_OPTIONS = [
  { key: "DRIVERS_LICENSE", label: "運転免許" },
  { key: "FORKLIFT", label: "リフト" },
  { key: "SLING", label: "玉掛" },
  { key: "CRANE", label: "クレーン" },
  { key: "WELDING", label: "溶接" },
  { key: "OTHER", label: "その他" },
] as const;

export type QualificationKey = (typeof QUALIFICATION_OPTIONS)[number]["key"];

export const QUALIFICATION_LABELS: Record<QualificationKey, string> =
  Object.fromEntries(QUALIFICATION_OPTIONS.map((o) => [o.key, o.label])) as Record<
    QualificationKey,
    string
  >;

export function formatQualifications(keys: string[]): string {
  if (keys.length === 0) return "—";
  return keys.map((k) => QUALIFICATION_LABELS[k as QualificationKey] ?? k).join("、");
}
