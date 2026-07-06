import { ResumeGender, ResumeStatus } from "@prisma/client";
import { z } from "zod";

const yearMonthEntry = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const resumeEducationEntrySchema = yearMonthEntry.extend({
  school: z.string().min(1, "学校名を入力してください"),
  event: z.enum(["入学", "卒業", "中退"]),
});

export const resumeWorkHistoryEntrySchema = yearMonthEntry.extend({
  company: z.string().min(1, "会社名を入力してください"),
  event: z.enum(["入社", "退社"]),
  description: z.string().optional().nullable(),
});

export const resumeLicenseEntrySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  name: z.string().min(1, "資格名を入力してください"),
});

export const resumeSchema = z.object({
  fullName: z.string().min(1, "氏名を入力してください"),
  furigana: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.nativeEnum(ResumeGender).optional().nullable(),
  postalCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z
    .preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      z.string().email("メールアドレスの形式が正しくありません").nullable().optional()
    ),
  educationJson: z.array(resumeEducationEntrySchema).default([]),
  workHistoryJson: z.array(resumeWorkHistoryEntrySchema).default([]),
  licensesJson: z.array(resumeLicenseEntrySchema).default([]),
  selfPr: z.string().optional().nullable(),
  motivation: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  status: z.nativeEnum(ResumeStatus).optional(),
});

export type ResumeSchemaInput = z.infer<typeof resumeSchema>;

function parseJsonArray<T>(
  value: FormDataEntryValue | null,
  fallback: T[]
): T[] | undefined {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return undefined;
  }
}

export function parseResumeFormData(formData: FormData) {
  const educationRaw = parseJsonArray(
    formData.get("educationJson"),
    [] as ResumeSchemaInput["educationJson"]
  );
  const workHistoryRaw = parseJsonArray(
    formData.get("workHistoryJson"),
    [] as ResumeSchemaInput["workHistoryJson"]
  );
  const licensesRaw = parseJsonArray(
    formData.get("licensesJson"),
    [] as ResumeSchemaInput["licensesJson"]
  );

  if (
    educationRaw === undefined ||
    workHistoryRaw === undefined ||
    licensesRaw === undefined
  ) {
    return {
      success: false as const,
      error: "学歴・職歴・資格の形式が正しくありません",
    };
  }

  const genderRaw = formData.get("gender");
  const statusRaw = formData.get("status");

  const parsed = resumeSchema.safeParse({
    fullName: formData.get("fullName"),
    furigana: formData.get("furigana") || null,
    birthDate: formData.get("birthDate") || null,
    gender:
      typeof genderRaw === "string" && genderRaw !== "" ? genderRaw : null,
    postalCode: formData.get("postalCode") || null,
    address: formData.get("address") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    educationJson: educationRaw,
    workHistoryJson: workHistoryRaw,
    licensesJson: licensesRaw,
    selfPr: formData.get("selfPr") || null,
    motivation: formData.get("motivation") || null,
    photoUrl: formData.get("photoUrl") || null,
    status:
      typeof statusRaw === "string" && statusRaw !== "" ? statusRaw : undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  return { success: true as const, data: parsed.data };
}

export function toResumeDbInput(data: ResumeSchemaInput) {
  const birthDate =
    data.birthDate && data.birthDate.trim() !== ""
      ? new Date(data.birthDate)
      : null;

  return {
    fullName: data.fullName.trim(),
    furigana: data.furigana?.trim() || null,
    birthDate,
    gender: data.gender ?? null,
    postalCode: data.postalCode?.trim() || null,
    address: data.address?.trim() || null,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    educationJson: data.educationJson,
    workHistoryJson: data.workHistoryJson,
    licensesJson: data.licensesJson,
    selfPr: data.selfPr?.trim() || null,
    motivation: data.motivation?.trim() || null,
    photoUrl: data.photoUrl?.trim() || null,
    status: data.status,
  };
}
