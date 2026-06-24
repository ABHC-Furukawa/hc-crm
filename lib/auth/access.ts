import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { requireSessionUser } from "@/lib/auth/session";
import {
  canViewTeamCandidates,
  canViewTenantCandidates,
} from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";

export class AccessDeniedError extends Error {
  constructor(message = "アクセス権限がありません") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export function assertActiveUser(user: User): void {
  if (!user.isActive) {
    throw new AccessDeniedError("アカウントが無効です");
  }
}

/** 候補者一覧・詳細クエリ用の where 条件 */
export function candidateAccessFilter(
  user: User,
  tenantId?: string
): Prisma.CandidateWhereInput {
  const tenantFilter: Prisma.CandidateWhereInput = tenantId
    ? { tenantId }
    : {};

  let roleFilter: Prisma.CandidateWhereInput;

  if (canViewTenantCandidates(user.role)) {
    roleFilter = { deletedAt: null };
  } else if (canViewTeamCandidates(user.role)) {
    roleFilter = {
      deletedAt: null,
      OR: [
        {
          assignments: {
            some: { userId: user.id, unassignedAt: null },
          },
        },
        {
          assignments: {
            some: {
              unassignedAt: null,
              user: { managerId: user.id, isActive: true },
            },
          },
        },
      ],
    };
  } else {
    roleFilter = {
      deletedAt: null,
      assignments: {
        some: { userId: user.id, unassignedAt: null },
      },
    };
  }

  return {
    AND: [tenantFilter, roleFilter],
  };
}

const defaultCandidateSelect = {
  id: true,
  status: true,
  phone: true,
} satisfies Prisma.CandidateSelect;

export type AssertedCandidate = Prisma.CandidateGetPayload<{
  select: typeof defaultCandidateSelect;
}>;

export async function assertCandidateAccess(
  candidateId: string
): Promise<{ user: User; candidate: AssertedCandidate }> {
  const user = await requireSessionUser();
  const { tenantId } = await requireTenantContext();
  assertActiveUser(user);

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId,
      ...candidateAccessFilter(user, tenantId),
    },
    select: defaultCandidateSelect,
  });

  if (!candidate) {
    throw new AccessDeniedError(CANDIDATE_DISPLAY.notFound);
  }

  return { user, candidate };
}
