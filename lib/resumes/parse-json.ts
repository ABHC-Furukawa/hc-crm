import type { Resume } from "@prisma/client";
import type {
  ResumeEducationEntry,
  ResumeJsonFields,
  ResumeLicenseEntry,
  ResumeWorkHistoryEntry,
} from "@/lib/resumes/types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function parseResumeJsonFields(
  resume: Pick<
    Resume,
    "educationJson" | "workHistoryJson" | "licensesJson"
  >
): ResumeJsonFields {
  return {
    educationJson: asArray<ResumeEducationEntry>(resume.educationJson),
    workHistoryJson: asArray<ResumeWorkHistoryEntry>(resume.workHistoryJson),
    licensesJson: asArray<ResumeLicenseEntry>(resume.licensesJson),
  };
}
