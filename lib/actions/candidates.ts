"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ActivityAction, AssignmentRole } from "@prisma/client";
import {
  assertCandidateAccess,
  candidateAccessFilter,
} from "@/lib/auth/access";
import {
  candidateByIdWhere,
  candidateDetailInclude,
  candidateListInclude,
} from "@/lib/candidates/queries";
import {
  findDuplicateCandidates,
  formatDuplicateRegistrationNotice,
} from "@/lib/candidates/duplicate-detector";
import { CANDIDATE_DUPLICATE_NOTICE_COOKIE } from "@/lib/candidates/registration-notice";
import { requireSessionUser } from "@/lib/auth/session";
import { requireTenantContext } from "@/lib/tenant/context";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { prisma } from "@/lib/prisma";
import {
  assertCanCreate,
  enforceAfterCreate,
  isTenantLimitError,
  tenantLimitErrorMessage,
} from "@/lib/tenant/enforce-limits";
import {
  extractCandidateFormValues,
  parseFormDataToCandidate,
  toCandidateDbInput,
  candidateStatusSchema,
  type CandidateFormValuesSnapshot,
} from "@/lib/validators/candidate";

export type CandidateActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
  values?: CandidateFormValuesSnapshot;
  formToken?: number;
};

function errorState(
  formData: FormData,
  error: string,
  fieldErrors?: Record<string, string[]>
): CandidateActionState {
  return {
    error,
    fieldErrors,
    values: extractCandidateFormValues(formData),
    formToken: Date.now(),
  };
}

function parseCandidateForm(formData: FormData) {
  return parseFormDataToCandidate(formData);
}

export async function createCandidateAction(
  _prevState: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();
  const parsed = parseCandidateForm(formData);

  if (!parsed.success) {
    return errorState(
      formData,
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors
    );
  }

  const data = parsed.data;
  const dbInput = toCandidateDbInput(data);

  const duplicateMatches = await findDuplicateCandidates(tenantId, {
    email: data.email,
    phone: data.phone,
    lastName: data.lastName,
    firstName: data.firstName,
    age: data.age,
  });

  let candidate;
  try {
    candidate = await prisma.$transaction(async (tx) => {
      await assertCanCreate(tenantId, "candidates", {
        tx,
        actorUserId: user.id,
      });

      const created = await tx.candidate.create({
        data: {
          ...dbInput,
          tenantId,
          createdById: user.id,
          assignments: {
            create: {
              userId: user.id,
              role: AssignmentRole.PRIMARY,
            },
          },
        },
      });

      await tx.activity.create({
        data: {
          candidateId: created.id,
          userId: user.id,
          action: "CREATED",
          entityType: "CANDIDATE",
          entityId: created.id,
          metadata: { source: data.source },
        },
      });

      await enforceAfterCreate(tenantId, "candidates", {
        tx,
        actorUserId: user.id,
      });

      return created;
    });
  } catch (error) {
    if (isTenantLimitError(error)) {
      return errorState(formData, tenantLimitErrorMessage(error));
    }
    return errorState(
      formData,
      "求職者の登録に失敗しました"
    );
  }

  const duplicateNotice = formatDuplicateRegistrationNotice(duplicateMatches);
  if (duplicateNotice) {
    const cookieStore = await cookies();
    cookieStore.set(CANDIDATE_DUPLICATE_NOTICE_COOKIE, duplicateNotice, {
      maxAge: 120,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  revalidatePath("/candidates");
  revalidatePath("/dashboard");
  redirect(`/candidates/${candidate.id}`);
}

export async function updateCandidateAction(
  id: string,
  _prevState: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  let user;
  try {
    ({ user } = await assertCandidateAccess(id));
  } catch {
    return { error: CANDIDATE_DISPLAY.notFound };
  }

  const parsed = parseCandidateForm(formData);

  if (!parsed.success) {
    return errorState(
      formData,
      "入力内容を確認してください",
      parsed.error.flatten().fieldErrors
    );
  }

  const data = parsed.data;
  const dbInput = toCandidateDbInput(data);

  try {
    await prisma.candidate.update({
      where: { id, deletedAt: null },
      data: dbInput,
    });

    await prisma.activity.create({
      data: {
        candidateId: id,
        userId: user.id,
        action: "UPDATED",
        entityType: "CANDIDATE",
        entityId: id,
      },
    });

    revalidatePath("/candidates");
    revalidatePath(`/candidates/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return errorState(formData, CANDIDATE_DISPLAY.updateFailed);
  }
}

export async function updateCandidateStatusAction(
  candidateId: string,
  formData: FormData
) {
  let user;
  let candidate;
  try {
    ({ user, candidate } = await assertCandidateAccess(candidateId));
  } catch {
    return;
  }

  const parsed = candidateStatusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  const status = parsed.data;
  if (status === candidate.status) return;

  await prisma.$transaction(async (tx) => {
    await tx.candidate.update({
      where: { id: candidateId },
      data: { status },
    });

    await tx.activity.create({
      data: {
        candidateId,
        userId: user.id,
        action: ActivityAction.STATUS_CHANGED,
        entityType: "CANDIDATE",
        entityId: candidateId,
        metadata: { from: candidate.status, to: status },
      },
    });
  });

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/dashboard");
}

export async function getCandidatesForUser() {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();

  return prisma.candidate.findMany({
    where: candidateAccessFilter(user, tenantId),
    include: candidateListInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCandidateById(id: string) {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();

  return prisma.candidate.findFirst({
    where: candidateByIdWhere(user, id, tenantId),
    include: candidateDetailInclude,
  });
}

export async function getDashboardStats() {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();
  const baseWhere = candidateAccessFilter(user, tenantId);

  const [total, byStatus, recentCandidates, openTasks, openTaskItems] =
    await Promise.all([
    prisma.candidate.count({ where: baseWhere }),
    prisma.candidate.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: true,
    }),
    prisma.candidate.findMany({
      where: baseWhere,
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        lastName: true,
        firstName: true,
        phone: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        assignedToId: user.id,
        candidate: baseWhere,
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        assignedToId: user.id,
        candidate: baseWhere,
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        dueAt: true,
        status: true,
        candidate: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
          },
        },
      },
    }),
  ]);

  return { total, byStatus, recentCandidates, openTasks, openTaskItems };
}
