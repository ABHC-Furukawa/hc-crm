"use server";

import { revalidatePath } from "next/cache";
import { ActivityAction } from "@prisma/client";
import { assertCandidateAccess } from "@/lib/auth/access";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { buildJobCaseDefaultsFromJob } from "@/lib/jobs/job-case-bridge";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import {
  parseJobCaseFormData,
  toJobCaseDbInput,
  type JobCaseFormValues,
} from "@/lib/validators/job-case";

export type JobCaseActionState = {
  error?: string;
  success?: boolean;
};

async function logJobCaseActivity(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  candidateId: string,
  userId: string,
  metadata: object
) {
  await tx.activity.create({
    data: {
      candidateId,
      userId,
      action: ActivityAction.UPDATED,
      entityType: "CANDIDATE",
      entityId: candidateId,
      metadata,
    },
  });
}

function revalidateCandidatePaths(candidateId: string) {
  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/candidates");
  revalidatePath("/kpi");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

async function mergeJobLinkFields(
  tenantId: string,
  form: JobCaseFormValues,
  data: ReturnType<typeof toJobCaseDbInput>
) {
  if (!data.jobId) {
    return { ...data, jobId: null };
  }

  const job = await prisma.job.findFirst({
    where: { id: data.jobId, tenantId },
  });
  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  const defaults = buildJobCaseDefaultsFromJob(job);
  const dispatchKey = data.dispatchCompanyKey || defaults.dispatchCompanyKey;

  return {
    ...data,
    jobId: job.id,
    entryJobName: data.entryJobName || defaults.entryJobName,
    referralFee: data.referralFee ?? defaults.referralFee,
    dispatchCompanyKey: dispatchKey,
    dispatchCompanyOther:
      dispatchKey === "OTHER"
        ? data.dispatchCompanyOther || defaults.dispatchCompanyOther
        : null,
  };
}

export async function upsertJobCaseAction(
  candidateId: string,
  _prev: JobCaseActionState,
  formData: FormData
): Promise<JobCaseActionState> {
  let user;
  let tenantId: string;
  try {
    ({ user } = await assertCandidateAccess(candidateId));
    ({ tenantId } = await requireTenantContext());
  } catch {
    return { error: CANDIDATE_DISPLAY.notFound };
  }

  const parsed = parseJobCaseFormData(formData);
  if (!parsed.success) {
    return { error: "入力内容を確認してください" };
  }

  let data;
  try {
    data = await mergeJobLinkFields(
      tenantId,
      parsed.data,
      toJobCaseDbInput(parsed.data)
    );
  } catch (error) {
    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return { error: "選択した ATS 案件が見つかりません" };
    }
    return { error: "案件情報の保存に失敗しました" };
  }

  const jobCaseId = parsed.data.jobCaseId;

  try {
    await prisma.$transaction(async (tx) => {
      if (jobCaseId) {
        const existing = await tx.candidateJobCase.findFirst({
          where: { id: jobCaseId, candidateId, closedAt: null },
        });
        if (!existing) {
          throw new Error("NOT_FOUND");
        }
        await tx.candidateJobCase.update({
          where: { id: jobCaseId },
          data,
        });
      } else {
        const existingCount = await tx.candidateJobCase.count({
          where: { candidateId, closedAt: null },
        });
        await tx.candidateJobCase.create({
          data: {
            candidateId,
            ...data,
            includeInKpi: existingCount === 0,
          },
        });
      }

      await logJobCaseActivity(tx, candidateId, user.id, { section: "jobCase" });
    });

    revalidateCandidatePaths(candidateId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { error: "案件が見つからないか、すでにクローズされています" };
    }
    return { error: "案件情報の保存に失敗しました" };
  }
}

export async function closeJobCaseAction(
  candidateId: string,
  jobCaseId: string,
  _prev: JobCaseActionState,
  formData: FormData
): Promise<JobCaseActionState> {
  let user;
  try {
    ({ user } = await assertCandidateAccess(candidateId));
  } catch {
    return { error: CANDIDATE_DISPLAY.notFound };
  }

  const closedReasonRaw = formData.get("closedReason");
  const closedReason =
    typeof closedReasonRaw === "string" && closedReasonRaw.trim().length > 0
      ? closedReasonRaw.trim()
      : null;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.candidateJobCase.findFirst({
        where: { id: jobCaseId, candidateId, closedAt: null },
      });
      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const row = await tx.candidateJobCase.update({
        where: { id: jobCaseId },
        data: {
          closedAt: new Date(),
          closedReason,
        },
      });

      await logJobCaseActivity(tx, candidateId, user.id, {
        section: "jobCase",
        action: "closed",
        jobCaseId,
      });

      return row;
    });

    if (!updated) {
      return { error: "案件のクローズに失敗しました" };
    }

    revalidateCandidatePaths(candidateId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { error: "案件が見つからないか、すでにクローズされています" };
    }
    return { error: "案件のクローズに失敗しました" };
  }
}

export async function syncJobCaseKpiInclusionAction(
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

  const checkedIds = new Set(
    formData
      .getAll("includeInKpi")
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  );

  try {
    await prisma.$transaction(async (tx) => {
      const cases = await tx.candidateJobCase.findMany({
        where: { candidateId },
        select: { id: true },
      });

      if (cases.length < 2) {
        throw new Error("NOT_ENOUGH_CASES");
      }

      await Promise.all(
        cases.map((jobCase) =>
          tx.candidateJobCase.update({
            where: { id: jobCase.id },
            data: { includeInKpi: checkedIds.has(jobCase.id) },
          })
        )
      );

      await logJobCaseActivity(tx, candidateId, user.id, {
        section: "jobCase",
        action: "kpiInclusion",
        includeInKpiIds: [...checkedIds],
      });
    });

    revalidateCandidatePaths(candidateId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_ENOUGH_CASES") {
      return { error: "KPI 反映は案件が2件以上のときに利用できます" };
    }
    return { error: "KPI 反映の更新に失敗しました" };
  }
}
