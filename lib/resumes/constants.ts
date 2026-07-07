import { ResumeGender, ResumeStatus, ResumeTemplateType } from "@prisma/client";

export const RESUME_GENDER_LABELS: Record<ResumeGender, string> = {
  MALE: "男",
  FEMALE: "女",
  UNSPECIFIED: "未記入",
};

export const RESUME_STATUS_LABELS: Record<ResumeStatus, string> = {
  DRAFT: "下書き",
  READY: "完成",
};

export const RESUME_STATUS_STYLES: Record<ResumeStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-800 border-amber-200",
  READY: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const RESUME_TEMPLATE_LABELS: Record<ResumeTemplateType, string> = {
  JIS_STANDARD_A4: "JIS風 標準履歴書（A4）",
};

export const RESUME_EDUCATION_EVENTS = ["入学", "卒業", "中退"] as const;
export const RESUME_WORK_EVENTS = ["入社", "退社"] as const;

export const RESUME_PHOTOS_BUCKET =
  process.env.RESUME_PHOTOS_BUCKET ?? "resume-photos";

export const RESUME_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const RESUME_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
