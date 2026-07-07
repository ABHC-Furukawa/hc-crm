import type { ResumeEducationEntry } from "@/lib/resumes/types";

export type InferEducationOptions = {
  includeUniversity?: boolean;
};

/** 4月1日基準で小学校入学年度を算出 */
export function getElementaryEnrollmentYear(birthDate: Date): number {
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();

  if (month > 4 || (month === 4 && day >= 2)) {
    return year + 7;
  }
  return year + 6;
}

export function inferEducationFromBirthDate(
  birthDate: Date,
  options: InferEducationOptions = {}
): ResumeEducationEntry[] {
  const base = getElementaryEnrollmentYear(birthDate);
  const entries: ResumeEducationEntry[] = [
    { year: base, month: 4, school: "○○小学校", event: "入学" },
    { year: base + 6, month: 3, school: "○○小学校", event: "卒業" },
    { year: base + 6, month: 4, school: "○○中学校", event: "入学" },
    { year: base + 9, month: 3, school: "○○中学校", event: "卒業" },
    { year: base + 9, month: 4, school: "○○高等学校", event: "入学" },
    { year: base + 12, month: 3, school: "○○高等学校", event: "卒業" },
  ];

  if (options.includeUniversity) {
    entries.push(
      { year: base + 12, month: 4, school: "○○大学", event: "入学" },
      { year: base + 16, month: 3, school: "○○大学", event: "卒業" }
    );
  }

  return entries;
}

export function parseBirthDateInput(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1]!, 10);
  const month = Number.parseInt(match[2]!, 10);
  const day = Number.parseInt(match[3]!, 10);
  const parsed = new Date(year, month - 1, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
