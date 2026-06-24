import { z } from "zod";
import { CallLeadStatus } from "@prisma/client";
import { normalizeEmail } from "@/lib/call-leads/normalize";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalAge = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).max(150).optional()
);

const optionalDateString = z.preprocess(emptyToUndefined, z.string().optional());

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === "" || value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export const callLeadUpdateSchema = z.object({
  name: z.string().trim().min(1, "氏名は必須です"),
  email: z
    .string()
    .trim()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  age: optionalAge,
  applicationArea: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  appliedAt: z.preprocess(parseOptionalDate, z.date().nullable().optional()),
  assignedUserId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
});

export type CallLeadUpdateValues = z.infer<typeof callLeadUpdateSchema>;

export const callLeadStatusSchema = z.nativeEnum(CallLeadStatus);

export const callLeadFollowUpSchema = z.object({
  nextCallDate: optionalDateString,
  nextCallMemo: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CallLeadFollowUpValues = z.infer<typeof callLeadFollowUpSchema>;

export type CallLeadFormValuesSnapshot = Record<string, string>;

export const CALL_LEAD_FORM_FIELDS = [
  "name",
  "email",
  "phone",
  "age",
  "applicationArea",
  "appliedAt",
  "assignedUserId",
] as const;

export function extractCallLeadFormValues(formData: FormData): CallLeadFormValuesSnapshot {
  const values: CallLeadFormValuesSnapshot = {};
  for (const name of CALL_LEAD_FORM_FIELDS) {
    const raw = formData.get(name);
    values[name] = typeof raw === "string" ? raw : "";
  }
  return values;
}

export function parseFormDataToCallLeadUpdate(formData: FormData) {
  return callLeadUpdateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    age: formData.get("age"),
    applicationArea: formData.get("applicationArea") || undefined,
    appliedAt: formData.get("appliedAt"),
    assignedUserId: formData.get("assignedUserId") || undefined,
  });
}

export function toCallLeadUpdateInput(data: CallLeadUpdateValues) {
  return {
    name: data.name.trim(),
    email: normalizeEmail(data.email ?? null),
    phone: data.phone?.trim() || null,
    age: data.age ?? null,
    applicationArea: data.applicationArea?.trim() || null,
    appliedAt: data.appliedAt ?? null,
    assignedUserId: data.assignedUserId ?? null,
  };
}

export function parseFormDataToCallLeadFollowUp(formData: FormData) {
  return callLeadFollowUpSchema.safeParse({
    nextCallDate: formData.get("nextCallDate"),
    nextCallMemo: formData.get("nextCallMemo") || undefined,
  });
}

export function toCallLeadFollowUpInput(data: CallLeadFollowUpValues) {
  const nextCallDate = data.nextCallDate ? new Date(data.nextCallDate) : null;
  return {
    nextCallDate,
    nextCallMemo: data.nextCallMemo?.trim() || null,
  };
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function toDateTimeInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
