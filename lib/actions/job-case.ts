"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction } from "@prisma/client";
import { assertCandidateAccess } from "@/lib/auth/access";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { prisma } from "@/lib/prisma";
import { parseJobCaseFormData, toJobCaseDbInput } from "@/lib/validators/job-case";

export type JobCaseActionState = {
  error?: string;
  success?: boolean;
};

export async function upsertJobCaseAction(
  candidateId: string,
  _prev: JobCaseActionState,
  formData: FormData
): Promise<JobCaseActionState> {
  let user;
  try {
    ({ user } = await assertCandidateAccess(candidateId));
  } catch {
    return { error: CANDIDATE_DISPLAY.notFound };
  }

  const parsed = parseJobCaseFormData(formData);
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  const data = toJobCaseDbInput(parsed.data);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.candidateJobCase.upsert({
        where: { candidateId },
        create: { candidateId, ...data },
        update: data,
      });

      await tx.activity.create({
        data: {
          candidateId,
          userId: user.id,
          action: ActivityAction.UPDATED,
          entityType: "CANDIDATE",
          entityId: candidateId,
          metadata: { section: "jobCase" },
        },
      });
    });

    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath("/candidates");
    return { success: true };
  } catch {
    return { error: "案件情報の保存に失敗しました" };
  }
}
