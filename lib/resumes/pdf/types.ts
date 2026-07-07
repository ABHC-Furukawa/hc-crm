import type { ResumeGender } from "@prisma/client";
import type { ResumeJsonFields } from "@/lib/resumes/types";

export type ResumePdfData = {
  fullName: string;
  furigana: string | null;
  birthDateLabel: string | null;
  genderLabel: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  selfPr: string | null;
  motivation: string | null;
  createdDateLabel: string;
  photoDataUri: string | null;
} & ResumeJsonFields;

export function formatPdfYearMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function formatPdfOptionalYearMonth(
  year?: number | null,
  month?: number | null
): string {
  if (year == null) return "—";
  if (month == null) return `${year}年`;
  return formatPdfYearMonth(year, month);
}

export function genderToPdfLabel(gender: ResumeGender | null): string | null {
  if (!gender) return null;
  const map: Record<ResumeGender, string> = {
    MALE: "男",
    FEMALE: "女",
    UNSPECIFIED: "未記入",
  };
  return map[gender];
}

export function buildPdfFileName(fullName: string, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const safe = fullName.replace(/[\\/:*?"<>|]/g, "_").trim() || "名前未設定";
  return `【履歴書】${safe}_${y}${m}${d}.pdf`;
}
