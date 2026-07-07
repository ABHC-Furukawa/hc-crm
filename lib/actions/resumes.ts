"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ActivityAction,
  ResumeDocumentType,
  ResumeStatus,
  type Prisma,
} from "@prisma/client";
import { assertCandidateAccess } from "@/lib/auth/access";
import { requireSessionUser } from "@/lib/auth/session";
import { assertResumeAccess } from "@/lib/resumes/access";
import { logResumeActivity } from "@/lib/resumes/activity";
import {
  buildStandaloneResumeCreateInput,
  mapCandidateToResumeCreateInput,
} from "@/lib/resumes/map-candidate-to-resume";
import {
  getCandidatesForResumePicker,
  getResumeByCandidateId,
  getResumeById,
  getResumesForUser,
} from "@/lib/resumes/queries";
import { parseResumeFilters } from "@/lib/resumes/filters";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant/context";
import {
  parseResumeFormData,
  toResumeDbInput,
} from "@/lib/resumes/validators";
import {
  buildResumePhotoStoragePath,
  uploadResumePhotoToStorage,
  validateResumePhotoFile,
} from "@/lib/resumes/storage";

export type ResumeActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
};

const candidateSelectForResume = {
  id: true,
  tenantId: true,
  lastName: true,
  firstName: true,
  furigana: true,
  birthDate: true,
  postalCode: true,
  addressLine: true,
  phone: true,
  email: true,
  qualifications: true,
  workDescription: true,
} satisfies Prisma.CandidateSelect;

function revalidateResumePaths(resumeId: string, candidateId: string | null) {
  revalidatePath(`/resumes/${resumeId}/edit`);
  revalidatePath(`/resumes/${resumeId}/preview`);
  revalidatePath("/resumes");
  if (candidateId) {
    revalidatePath(`/candidates/${candidateId}`);
    revalidatePath(`/candidates/${candidateId}/resume`);
  }
}

export async function getResumeListForUser(
  params: Record<string, string | string[] | undefined> = {}
) {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();
  const filters = parseResumeFilters(params);
  return getResumesForUser(user, tenantId, filters);
}

export async function getResumePickerCandidates() {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();
  return getCandidatesForResumePicker(user, tenantId);
}

export async function getResumeByIdForUser(resumeId: string) {
  const { tenantId } = await requireTenantContext();
  const { user } = await assertResumeAccess(resumeId);
  return getResumeById(user, resumeId, tenantId);
}

export async function getResumeSummaryForCandidate(candidateId: string) {
  const { user } = await assertCandidateAccess(candidateId);
  const { tenantId } = await requireTenantContext();
  return getResumeByCandidateId(user, candidateId, tenantId);
}

export async function createResumeAction(
  _prev: ResumeActionState,
  formData: FormData
): Promise<ResumeActionState> {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();

  const fullNameInput = formData.get("fullName")?.toString().trim() ?? "";
  const candidateId = formData.get("candidateId")?.toString().trim() || null;

  if (candidateId) {
    await assertCandidateAccess(candidateId);

    const existing = await getResumeByCandidateId(
      user,
      candidateId,
      tenantId,
      ResumeDocumentType.RIREKISHO
    );
    if (existing) {
      redirect(`/resumes/${existing.id}/edit`);
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, tenantId, deletedAt: null },
      select: candidateSelectForResume,
    });
    if (!candidate) {
      return { error: "候補者が見つかりません" };
    }

    const createData = mapCandidateToResumeCreateInput(
      candidate,
      tenantId,
      candidateId,
      user.id
    );
    if (fullNameInput) {
      createData.fullName = fullNameInput;
    }

    const resume = await prisma.$transaction(async (tx) => {
      const created = await tx.resume.create({ data: createData });
      await logResumeActivity(tx, {
        candidateId,
        userId: user.id,
        action: ActivityAction.RESUME_CREATED,
        resumeId: created.id,
      });
      return created;
    });

    revalidatePath("/resumes");
    revalidatePath(`/candidates/${candidateId}`);
    redirect(`/resumes/${resume.id}/edit`);
  }

  if (!fullNameInput) {
    return { error: "氏名を入力してください" };
  }

  const createData = buildStandaloneResumeCreateInput(
    tenantId,
    user.id,
    fullNameInput
  );

  const resume = await prisma.$transaction(async (tx) => {
    return tx.resume.create({ data: createData });
  });

  revalidatePath("/resumes");
  redirect(`/resumes/${resume.id}/edit`);
}

export async function createResumeFromCandidateAction(candidateId: string) {
  const { user } = await assertCandidateAccess(candidateId);
  const { tenantId } = await requireTenantContext();

  const existing = await getResumeByCandidateId(
    user,
    candidateId,
    tenantId,
    ResumeDocumentType.RIREKISHO
  );
  if (existing) {
    redirect(`/resumes/${existing.id}/edit`);
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, tenantId, deletedAt: null },
    select: candidateSelectForResume,
  });

  if (!candidate) {
    throw new Error("候補者が見つかりません");
  }

  const createData = mapCandidateToResumeCreateInput(
    candidate,
    tenantId,
    candidateId,
    user.id
  );

  const resume = await prisma.$transaction(async (tx) => {
    const created = await tx.resume.create({ data: createData });
    await logResumeActivity(tx, {
      candidateId,
      userId: user.id,
      action: ActivityAction.RESUME_CREATED,
      resumeId: created.id,
    });
    return created;
  });

  revalidatePath("/resumes");
  revalidatePath(`/candidates/${candidateId}`);
  redirect(`/resumes/${resume.id}/edit`);
}

export async function updateResumeAction(
  resumeId: string,
  _prev: ResumeActionState,
  formData: FormData
): Promise<ResumeActionState> {
  const { user, resume } = await assertResumeAccess(resumeId);
  const parsed = parseResumeFormData(formData);

  if (!parsed.success) {
    return {
      error: parsed.error,
      fieldErrors: parsed.fieldErrors,
    };
  }

  const dbInput = toResumeDbInput(parsed.data);

  await prisma.$transaction(async (tx) => {
    await tx.resume.update({
      where: { id: resumeId },
      data: {
        ...dbInput,
        educationJson: dbInput.educationJson,
        workHistoryJson: dbInput.workHistoryJson,
        licensesJson: dbInput.licensesJson,
        status: dbInput.status ?? resume.status,
        updatedById: user.id,
      },
    });

    await logResumeActivity(tx, {
      candidateId: resume.candidateId,
      userId: user.id,
      action: ActivityAction.RESUME_UPDATED,
      resumeId,
    });
  });

  revalidateResumePaths(resumeId, resume.candidateId);
  return { success: true };
}

export async function syncResumeFromCandidateAction(
  resumeId: string
): Promise<ResumeActionState> {
  const { user, resume } = await assertResumeAccess(resumeId);

  if (!resume.candidateId) {
    return { error: "候補者が紐づいていないため、再反映できません" };
  }

  const { tenantId } = await requireTenantContext();

  const candidate = await prisma.candidate.findFirst({
    where: { id: resume.candidateId, tenantId, deletedAt: null },
    select: candidateSelectForResume,
  });

  if (!candidate) {
    return { error: "候補者が見つかりません" };
  }

  const mapped = mapCandidateToResumeCreateInput(
    candidate,
    tenantId,
    resume.candidateId,
    user.id
  );

  await prisma.$transaction(async (tx) => {
    await tx.resume.update({
      where: { id: resumeId },
      data: {
        fullName: mapped.fullName,
        furigana: mapped.furigana,
        birthDate: mapped.birthDate,
        postalCode: mapped.postalCode,
        address: mapped.address,
        phone: mapped.phone,
        email: mapped.email,
        licensesJson: mapped.licensesJson,
        updatedById: user.id,
      },
    });

    await logResumeActivity(tx, {
      candidateId: resume.candidateId,
      userId: user.id,
      action: ActivityAction.RESUME_UPDATED,
      resumeId,
      metadata: { source: "candidate_sync" },
    });
  });

  revalidateResumePaths(resumeId, resume.candidateId);
  return { success: true };
}

export async function uploadResumePhotoAction(
  resumeId: string,
  _prev: ResumeActionState,
  formData: FormData
): Promise<ResumeActionState> {
  const { user, resume } = await assertResumeAccess(resumeId);
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "画像ファイルを選択してください" };
  }

  const validationError = validateResumePhotoFile(file);
  if (validationError) {
    return { error: validationError };
  }

  const storagePath = buildResumePhotoStoragePath(
    resume.tenantId,
    resumeId,
    file.type,
    resume.candidateId
  );

  try {
    await uploadResumePhotoToStorage(storagePath, file);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "写真のアップロードに失敗しました",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.resume.update({
      where: { id: resumeId },
      data: {
        photoUrl: storagePath,
        updatedById: user.id,
      },
    });

    await logResumeActivity(tx, {
      candidateId: resume.candidateId,
      userId: user.id,
      action: ActivityAction.RESUME_UPDATED,
      resumeId,
      metadata: { field: "photoUrl" },
    });
  });

  revalidateResumePaths(resumeId, resume.candidateId);
  return { success: true };
}

export async function markResumeReadyAction(
  resumeId: string
): Promise<ResumeActionState> {
  const { user, resume } = await assertResumeAccess(resumeId);

  await prisma.$transaction(async (tx) => {
    await tx.resume.update({
      where: { id: resumeId },
      data: {
        status: ResumeStatus.READY,
        updatedById: user.id,
      },
    });

    await logResumeActivity(tx, {
      candidateId: resume.candidateId,
      userId: user.id,
      action: ActivityAction.RESUME_UPDATED,
      resumeId,
      metadata: { status: ResumeStatus.READY },
    });
  });

  revalidateResumePaths(resumeId, resume.candidateId);
  return { success: true };
}

export async function markResumeDraftAction(
  resumeId: string
): Promise<ResumeActionState> {
  const { user, resume } = await assertResumeAccess(resumeId);

  await prisma.$transaction(async (tx) => {
    await tx.resume.update({
      where: { id: resumeId },
      data: {
        status: ResumeStatus.DRAFT,
        updatedById: user.id,
      },
    });

    await logResumeActivity(tx, {
      candidateId: resume.candidateId,
      userId: user.id,
      action: ActivityAction.RESUME_UPDATED,
      resumeId,
      metadata: { status: ResumeStatus.DRAFT },
    });
  });

  revalidateResumePaths(resumeId, resume.candidateId);
  return { success: true };
}
