import { z } from "zod";
import {
  CallAttemptResult,
  CallAttemptStatus,
  CallDialProvider,
  CallLeadStatus,
} from "@prisma/client";

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const initiateCallSchema = z.object({
  callLeadId: z.string().uuid("架電リード ID が不正です"),
  provider: z.nativeEnum(CallDialProvider).optional(),
});

export const callAttemptResultSchema = z.object({
  result: z.nativeEnum(CallAttemptResult, {
    errorMap: () => ({ message: "架電結果を選択してください" }),
  }),
  memo: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  nextAction: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  duration: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).optional()
  ),
  callStatus: z.nativeEnum(CallAttemptStatus).optional(),
});

export type CallAttemptResultInput = z.infer<typeof callAttemptResultSchema>;

export function parseCallAttemptResultForm(formData: FormData) {
  return callAttemptResultSchema.safeParse({
    result: formData.get("result"),
    memo: formData.get("memo") || undefined,
    nextAction: formData.get("nextAction") || undefined,
    duration: formData.get("duration"),
    callStatus: formData.get("callStatus") || CallAttemptStatus.COMPLETED,
  });
}

export function mapResultToCallLeadStatus(
  result: CallAttemptResult,
  currentStatus: CallLeadStatus
): CallLeadStatus | undefined {
  if (currentStatus === CallLeadStatus.CONVERTED) return undefined;

  switch (result) {
    case CallAttemptResult.CONNECTED:
      return CallLeadStatus.HEARING;
    case CallAttemptResult.NO_ANSWER:
    case CallAttemptResult.BUSY:
    case CallAttemptResult.REJECTED:
      return CallLeadStatus.NO_ANSWER;
    case CallAttemptResult.CALL_BACK:
      return undefined;
    default:
      return undefined;
  }
}
