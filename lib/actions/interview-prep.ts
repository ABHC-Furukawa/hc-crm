"use server";

import { revalidatePath } from "next/cache";
import {
  ActivityAction,
  ActivityEntityType,
  InterviewResultOutcome,
  type Prisma,
} from "@prisma/client";
import { assertCandidateAccess } from "@/lib/auth/access";
import { canManageTenantSettings } from "@/lib/auth/rbac";
import {
  DEFAULT_INTERVIEW_PREP_DAY_OF_BODY,
  DEFAULT_INTERVIEW_PREP_QUESTIONS,
  DEFAULT_INTERVIEW_PREP_TEMPLATE_BODY,
  INTERVIEW_PREP_CHECKLIST_ITEMS,
  splitInterviewPrepTemplate,
  type InterviewPrepChecklistKey,
} from "@/lib/constants/interview-prep-defaults";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";

const checklistKeySet = new Set<string>(
  INTERVIEW_PREP_CHECKLIST_ITEMS.map((item) => item.key)
);

function isChecklistKey(value: string): value is InterviewPrepChecklistKey {
  return checklistKeySet.has(value);
}

const preparationInclude = {
  questions: { orderBy: { sortOrder: "asc" as const } },
  result: true,
  displayJobCase: {
    include: {
      job: {
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          location: true,
          referralFee: true,
          sourceCompany: true,
        },
      },
    },
  },
} satisfies Prisma.InterviewPreparationInclude;

export type InterviewPrepBundle = Prisma.InterviewPreparationGetPayload<{
  include: typeof preparationInclude;
}>;

async function logInterviewPrepActivity(input: {
  candidateId: string;
  userId: string;
  preparationId: string;
  action: ActivityAction;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activity.create({
    data: {
      candidateId: input.candidateId,
      userId: input.userId,
      action: input.action,
      entityType: ActivityEntityType.INTERVIEW_PREP,
      entityId: input.preparationId,
      metadata: input.metadata,
    },
  });
}

export async function getOrCreateInterviewPrep(
  candidateId: string
): Promise<InterviewPrepBundle> {
  const { user } = await assertCandidateAccess(candidateId);

  const existing = await prisma.interviewPreparation.findUnique({
    where: { candidateId },
    include: preparationInclude,
  });
  if (existing) {
    if (existing.questions.length === 0) {
      await prisma.interviewQuestion.createMany({
        data: DEFAULT_INTERVIEW_PREP_QUESTIONS.map((q) => ({
          preparationId: existing.id,
          sortOrder: q.sortOrder,
          title: q.title,
          guidance: q.guidance,
        })),
      });
      const refreshed = await prisma.interviewPreparation.findUniqueOrThrow({
        where: { id: existing.id },
        include: preparationInclude,
      });
      return refreshed;
    }
    return existing;
  }

  const jobCases = await prisma.candidateJobCase.findMany({
    where: { candidateId },
    orderBy: [{ closedAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, closedAt: true, includeInKpi: true },
  });

  const defaultJobCase =
    jobCases.find((jc) => jc.closedAt == null && jc.includeInKpi) ??
    jobCases.find((jc) => jc.closedAt == null) ??
    jobCases[0] ??
    null;

  const created = await prisma.interviewPreparation.create({
    data: {
      candidateId,
      displayJobCaseId: defaultJobCase?.id ?? null,
      questions: {
        create: DEFAULT_INTERVIEW_PREP_QUESTIONS.map((q) => ({
          sortOrder: q.sortOrder,
          title: q.title,
          guidance: q.guidance,
        })),
      },
    },
    include: preparationInclude,
  });

  await logInterviewPrepActivity({
    candidateId,
    userId: user.id,
    preparationId: created.id,
    action: ActivityAction.INTERVIEW_PREP_UPDATED,
    metadata: { field: "created" },
  });

  return created;
}

export async function getInterviewPrepTemplateBody(
  tenantId: string
): Promise<string> {
  const row = await prisma.interviewPrepTemplate.findUnique({
    where: { tenantId },
    select: { bodyMarkdown: true },
  });
  const raw = row?.bodyMarkdown ?? DEFAULT_INTERVIEW_PREP_TEMPLATE_BODY;
  return splitInterviewPrepTemplate(raw).prepBody;
}

export async function getInterviewPrepDayOfBody(
  tenantId: string
): Promise<string> {
  const row = await prisma.interviewPrepTemplate.findUnique({
    where: { tenantId },
    select: { bodyMarkdown: true },
  });
  if (!row?.bodyMarkdown) {
    return DEFAULT_INTERVIEW_PREP_DAY_OF_BODY;
  }
  return splitInterviewPrepTemplate(row.bodyMarkdown).dayOfBody;
}

export async function updateInterviewPrepChecklistAction(
  candidateId: string,
  field: string,
  checked: boolean
) {
  if (!isChecklistKey(field)) return;

  const { user } = await assertCandidateAccess(candidateId);
  const prep = await getOrCreateInterviewPrep(candidateId);

  await prisma.interviewPreparation.update({
    where: { id: prep.id },
    data: { [field]: checked },
  });

  await logInterviewPrepActivity({
    candidateId,
    userId: user.id,
    preparationId: prep.id,
    action: ActivityAction.INTERVIEW_PREP_UPDATED,
    metadata: { field, checked },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function updateInterviewPrepUrlAction(
  candidateId: string,
  interviewUrl: string
) {
  const { user } = await assertCandidateAccess(candidateId);
  const prep = await getOrCreateInterviewPrep(candidateId);
  const trimmed = interviewUrl.trim() || null;

  await prisma.interviewPreparation.update({
    where: { id: prep.id },
    data: { interviewUrl: trimmed },
  });

  await logInterviewPrepActivity({
    candidateId,
    userId: user.id,
    preparationId: prep.id,
    action: ActivityAction.INTERVIEW_PREP_UPDATED,
    metadata: { field: "interviewUrl" },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function updateInterviewPrepDisplayJobCaseAction(
  candidateId: string,
  jobCaseId: string | null
) {
  await assertCandidateAccess(candidateId);
  const prep = await getOrCreateInterviewPrep(candidateId);

  if (jobCaseId) {
    const belongs = await prisma.candidateJobCase.findFirst({
      where: { id: jobCaseId, candidateId },
      select: { id: true },
    });
    if (!belongs) return;
  }

  await prisma.interviewPreparation.update({
    where: { id: prep.id },
    data: { displayJobCaseId: jobCaseId },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function updateInterviewQuestionAnswerAction(
  candidateId: string,
  questionId: string,
  answerMemo: string
) {
  const { user } = await assertCandidateAccess(candidateId);
  const prep = await getOrCreateInterviewPrep(candidateId);
  const question = prep.questions.find((q) => q.id === questionId);
  if (!question) return;

  await prisma.interviewQuestion.update({
    where: { id: questionId },
    data: { answerMemo: answerMemo.trim() || null },
  });

  await logInterviewPrepActivity({
    candidateId,
    userId: user.id,
    preparationId: prep.id,
    action: ActivityAction.INTERVIEW_PREP_UPDATED,
    metadata: { field: "questionAnswer", questionId, title: question.title },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function updateInterviewPrepMemoAction(
  candidateId: string,
  memo: string
) {
  const { user } = await assertCandidateAccess(candidateId);
  const prep = await getOrCreateInterviewPrep(candidateId);

  await prisma.interviewPreparation.update({
    where: { id: prep.id },
    data: { memo: memo.trim() || null },
  });

  await logInterviewPrepActivity({
    candidateId,
    userId: user.id,
    preparationId: prep.id,
    action: ActivityAction.INTERVIEW_PREP_UPDATED,
    metadata: { field: "memo" },
  });

  revalidatePath(`/candidates/${candidateId}`);
}

export async function saveInterviewResultAction(
  candidateId: string,
  outcomeRaw: string,
  note?: string
) {
  const { user } = await assertCandidateAccess(candidateId);
  const prep = await getOrCreateInterviewPrep(candidateId);

  if (
    !Object.values(InterviewResultOutcome).includes(
      outcomeRaw as InterviewResultOutcome
    )
  ) {
    return { error: "結果を選択してください" };
  }
  const outcome = outcomeRaw as InterviewResultOutcome;
  const previous = prep.result?.outcome;

  await prisma.interviewResult.upsert({
    where: { preparationId: prep.id },
    create: {
      preparationId: prep.id,
      outcome,
      note: note?.trim() || null,
      recordedById: user.id,
      recordedAt: new Date(),
    },
    update: {
      outcome,
      note: note?.trim() || null,
      recordedById: user.id,
      recordedAt: new Date(),
    },
  });

  await logInterviewPrepActivity({
    candidateId,
    userId: user.id,
    preparationId: prep.id,
    action: ActivityAction.INTERVIEW_RESULT_RECORDED,
    metadata: {
      outcome,
      ...(previous && previous !== outcome ? { from: previous } : {}),
    },
  });

  revalidatePath(`/candidates/${candidateId}`);
  return { success: true };
}

export async function getInterviewPrepTemplateForSettings() {
  const { user, tenantId } = await requireTenantContext();
  if (!canManageTenantSettings(user.role)) {
    return { error: "権限がありません" as const };
  }

  const bodyMarkdown = await getInterviewPrepTemplateBody(tenantId);
  return { bodyMarkdown };
}

export async function updateInterviewPrepTemplateAction(
  _prev: { error?: string; success?: boolean },
  formData: FormData
) {
  const { user, tenantId } = await requireTenantContext();
  if (!canManageTenantSettings(user.role)) {
    return { error: "権限がありません" };
  }

  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "").trim();
  if (!bodyMarkdown) {
    return { error: "テンプレート本文を入力してください" };
  }

  await prisma.interviewPrepTemplate.upsert({
    where: { tenantId },
    create: {
      tenantId,
      bodyMarkdown,
      updatedById: user.id,
    },
    update: {
      bodyMarkdown,
      updatedById: user.id,
    },
  });

  revalidatePath("/settings/interview-prep");
  return { success: true };
}
