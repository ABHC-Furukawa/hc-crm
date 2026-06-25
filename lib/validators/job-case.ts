import { z } from "zod";
import {
  DISPATCH_COMPANY_KEYS,
  isDispatchCompanyKey,
} from "@/lib/constants/dispatch-companies";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional()
);

const optionalDateString = z.preprocess(emptyToUndefined, z.string().optional());

export const jobCaseSchema = z
  .object({
    jobCaseId: z.string().uuid().optional(),
    entryJobName: z.string().optional(),
    dispatchCompanyKey: z.string().optional(),
    dispatchCompanyOther: z.string().optional(),
    referralFee: optionalInt,
    interviewPrepAt: optionalDateString,
    interviewAt: optionalDateString,
    factoryTourAt: optionalDateString,
    offerAcceptedAt: optionalDateString,
    scheduledJoinAt: optionalDateString,
  })
  .superRefine((data, ctx) => {
    if (data.dispatchCompanyKey && !isDispatchCompanyKey(data.dispatchCompanyKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "派遣会社を選択してください",
        path: ["dispatchCompanyKey"],
      });
    }
    if (data.dispatchCompanyKey === "OTHER" && !data.dispatchCompanyOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "派遣会社名を入力してください",
        path: ["dispatchCompanyOther"],
      });
    }
  });

export type JobCaseFormValues = z.infer<typeof jobCaseSchema>;

export function parseJobCaseFormData(formData: FormData) {
  const jobCaseIdRaw = formData.get("jobCaseId");
  return jobCaseSchema.safeParse({
    jobCaseId:
      typeof jobCaseIdRaw === "string" && jobCaseIdRaw.length > 0
        ? jobCaseIdRaw
        : undefined,
    entryJobName: formData.get("entryJobName") || undefined,
    dispatchCompanyKey: formData.get("dispatchCompanyKey") || undefined,
    dispatchCompanyOther: formData.get("dispatchCompanyOther") || undefined,
    referralFee: formData.get("referralFee"),
    interviewPrepAt: formData.get("interviewPrepAt"),
    interviewAt: formData.get("interviewAt"),
    factoryTourAt: formData.get("factoryTourAt"),
    offerAcceptedAt: formData.get("offerAcceptedAt"),
    scheduledJoinAt: formData.get("scheduledJoinAt"),
  });
}

function parseDate(value?: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function toJobCaseDbInput(data: JobCaseFormValues) {
  return {
    entryJobName: data.entryJobName || null,
    dispatchCompanyKey: data.dispatchCompanyKey || null,
    dispatchCompanyOther:
      data.dispatchCompanyKey === "OTHER" ? data.dispatchCompanyOther?.trim() || null : null,
    referralFee: data.referralFee ?? null,
    interviewPrepAt: parseDate(data.interviewPrepAt),
    interviewAt: parseDate(data.interviewAt),
    factoryTourAt: parseDate(data.factoryTourAt),
    offerAcceptedAt: parseDate(data.offerAcceptedAt),
    scheduledJoinAt: parseDate(data.scheduledJoinAt),
  };
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function toDateTimeLocalValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export const DISPATCH_COMPANY_KEY_VALUES = DISPATCH_COMPANY_KEYS;
