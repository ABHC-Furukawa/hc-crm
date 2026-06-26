import { EmploymentType, JobGender } from "@prisma/client";
import {
  normalizeSalaryDisplay,
  normalizeShiftType,
} from "@/lib/jobs/normalize/utils";

/** Job 画面・Importer 共通の項目ラベル */
export const JOB_FIELD_LABELS = {
  companyName: "派遣会社名",
  jobTitle: "派遣先企業名",
  location: "勤務地",
  salary: "給与",
  employmentType: "雇用形態",
  shiftType: "勤務形態",
  gender: "性別",
  maxAge: "上限年齢",
  referralFee: "紹介料",
  otherNotes: "その他",
  sourceUrl: "URL",
} as const;

export const JOB_GENDER_LABELS: Record<JobGender, string> = {
  MALE: "男性",
  FEMALE: "女性",
  ANY: "不問",
  UNKNOWN: "—",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "正社員",
  PART_TIME: "パート・アルバイト",
  DISPATCH: "派遣",
  CONTRACT: "契約",
  TEMPORARY: "臨時",
  OTHER: "その他",
  UNKNOWN: "不明",
};

export const JOB_IMPORT_LOG_STATUS_LABELS = {
  PENDING: "処理中",
  COMPLETED: "完了",
  PARTIAL: "一部成功",
  FAILED: "失敗",
} as const;

export function formatJobGender(value: JobGender): string {
  return JOB_GENDER_LABELS[value];
}

export function formatMaxAge(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value}歳`;
}

export function formatShiftTypeDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  return normalizeShiftType(value) ?? "—";
}

export function formatShiftTypeDetailDisplay(
  detail: string | null | undefined,
  normalized: string | null | undefined
): string {
  if (detail?.trim()) return detail.trim();
  return formatShiftTypeDisplay(normalized);
}
export function formatShiftTypeSummary(value: string | null | undefined): string {
  const detail = formatShiftTypeDisplay(value);
  if (detail === "—") return "—";
  if (detail === "2交替" || detail === "3交替" || detail === "4交替") {
    return "交替";
  }
  return detail;
}

export function formatSalaryForDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  return normalizeSalaryDisplay(value) ?? value;
}

export function formatDormitory(value: boolean | null | undefined): string {
  if (value === true) return "あり";
  if (value === false) return "なし";
  return "—";
}

export function formatNightShift(value: boolean | null | undefined): string {
  if (value === true) return "あり";
  if (value === false) return "なし";
  return "—";
}
