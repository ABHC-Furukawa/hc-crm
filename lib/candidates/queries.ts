import type { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { candidateAccessFilter } from "@/lib/auth/access";

/** 候補者詳細ページ用 include（Activity は別クエリ） */
export const candidateDetailInclude = {
  createdBy: { select: { id: true, name: true } },
  assignments: {
    where: { unassignedAt: null },
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  tags: { include: { tag: true } },
  jobCases: {
    orderBy: [{ closedAt: "asc" as const }, { createdAt: "asc" as const }],
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
  notes: {
    where: { deletedAt: null },
    orderBy: [{ isPinned: "desc" as const }, { createdAt: "desc" as const }],
    include: { author: { select: { name: true } } },
  },
  tasks: {
    orderBy: [
      { status: "asc" as const },
      { dueAt: "asc" as const },
      { createdAt: "desc" as const },
    ],
    include: { assignedTo: { select: { name: true } } },
  },
  communications: {
    orderBy: { occurredAt: "desc" as const },
    take: 100,
    include: {
      user: { select: { name: true } },
      call: { include: { answeredBy: { select: { name: true } } } },
      lineMessage: true,
      emailMessage: true,
    },
  },
  _count: {
    select: {
      communications: true,
      tasks: true,
      applications: true,
      files: true,
      notes: true,
      activities: true,
    },
  },
} satisfies Prisma.CandidateInclude;

export type CandidateDetail = Prisma.CandidateGetPayload<{
  include: typeof candidateDetailInclude;
}>;

export const candidateListInclude = {
  assignments: {
    where: { unassignedAt: null },
    include: { user: { select: { id: true, name: true } } },
  },
  _count: {
    select: {
      communications: true,
      tasks: true,
      applications: true,
    },
  },
} satisfies Prisma.CandidateInclude;

export function candidateByIdWhere(
  user: User,
  id: string,
  tenantId?: string
): Prisma.CandidateWhereInput {
  return {
    id,
    ...candidateAccessFilter(user, tenantId),
  };
}

export const activityInclude = {
  user: { select: { name: true } },
} satisfies Prisma.ActivityInclude;

export type ActivityItem = Prisma.ActivityGetPayload<{
  include: typeof activityInclude;
}>;
