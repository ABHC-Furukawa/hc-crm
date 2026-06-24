import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(0).optional()
);

const optionalDateString = z.preprocess(emptyToUndefined, z.string().optional());

const optionalDateTimeString = z.preprocess(emptyToUndefined, z.string().optional());

export const jobCaseSchema = z.object({
  entryJobName: z.string().optional(),
  dispatchCompanyName: z.string().optional(),
  referralFee: optionalInt,
  interviewPrepAt: optionalDateTimeString,
  interviewAt: optionalDateTimeString,
  factoryTourAt: optionalDateString,
  offerAcceptedAt: optionalDateString,
  scheduledJoinAt: optionalDateString,
});

export type JobCaseFormValues = z.infer<typeof jobCaseSchema>;

export function parseJobCaseFormData(formData: FormData) {
  return jobCaseSchema.safeParse({
    entryJobName: formData.get("entryJobName") || undefined,
    dispatchCompanyName: formData.get("dispatchCompanyName") || undefined,
    referralFee: formData.get("referralFee"),
    interviewPrepAt: formData.get("interviewPrepAt"),
    interviewAt: formData.get("interviewAt"),
    factoryTourAt: formData.get("factoryTourAt"),
    offerAcceptedAt: formData.get("offerAcceptedAt"),
    scheduledJoinAt: formData.get("scheduledJoinAt"),
  });
}

function parseDateTime(value?: string) {
  if (!value) return null;
  return new Date(value);
}

function parseDate(value?: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function toJobCaseDbInput(data: JobCaseFormValues) {
  return {
    entryJobName: data.entryJobName || null,
    dispatchCompanyName: data.dispatchCompanyName || null,
    referralFee: data.referralFee ?? null,
    interviewPrepAt: parseDateTime(data.interviewPrepAt),
    interviewAt: parseDateTime(data.interviewAt),
    factoryTourAt: parseDate(data.factoryTourAt),
    offerAcceptedAt: parseDate(data.offerAcceptedAt),
    scheduledJoinAt: parseDate(data.scheduledJoinAt),
  };
}

export function toDateTimeLocalValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}
