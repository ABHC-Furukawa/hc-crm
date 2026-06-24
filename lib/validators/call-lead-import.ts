import { z } from "zod";
import { normalizeEmail } from "@/lib/call-leads/normalize";
import type { CallLeadImportRow } from "@/lib/import/types";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalAge = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).max(150).optional()
);

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional()
);

function parseAppliedAt(value: unknown): Date | null | undefined {
  if (value === "" || value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const str = String(value).trim();
  if (!str) return null;
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export const callLeadImportRowSchema = z.object({
  sourceIndex: z.number().int().positive().optional(),
  appliedAt: z.preprocess(parseAppliedAt, z.date().nullable().optional()),
  name: z.string().trim().min(1, "氏名は必須です"),
  email: z
    .string()
    .trim()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  phone: optionalString,
  age: optionalAge,
  applicationArea: optionalString,
  sourceId: optionalString,
});

export type CallLeadImportRowInput = z.infer<typeof callLeadImportRowSchema>;

export function validateImportRow(
  row: CallLeadImportRow
): { success: true; data: CallLeadImportRowInput } | { success: false; message: string } {
  const parsed = callLeadImportRowSchema.safeParse(row);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, message: first?.message ?? "入力内容が不正です" };
  }
  return { success: true, data: parsed.data };
}

export function toValidatedImportRow(data: CallLeadImportRowInput): CallLeadImportRow {
  return {
    sourceIndex: data.sourceIndex,
    appliedAt: data.appliedAt ?? null,
    name: data.name.trim(),
    email: normalizeEmail(data.email ?? null),
    phone: data.phone?.trim() || null,
    age: data.age ?? null,
    applicationArea: data.applicationArea?.trim() || null,
    sourceId: data.sourceId?.trim() || null,
  };
}

/** CSV ヘッダー → 内部フィールド名 */
export const CSV_HEADER_MAP: Record<string, keyof CallLeadImportRowInput> = {
  応募日時: "appliedAt",
  氏名: "name",
  メールアドレス: "email",
  電話番号: "phone",
  年齢: "age",
  応募地: "applicationArea",
  applied_at: "appliedAt",
  appliedAt: "appliedAt",
  name: "name",
  email: "email",
  phone: "phone",
  age: "age",
  application_area: "applicationArea",
  applicationArea: "applicationArea",
};

export const CSV_REQUIRED_HEADERS = ["氏名"] as const;

export const CSV_TEMPLATE_HEADERS = [
  "応募日時",
  "氏名",
  "メールアドレス",
  "電話番号",
  "年齢",
  "応募地",
] as const;
