import type { Prisma, ResumeDocumentType } from "@prisma/client";
import type { User } from "@prisma/client";
import { candidateAccessFilter } from "@/lib/auth/access";
import { canViewTenantCandidates } from "@/lib/auth/rbac";
import type { ResumeFilters } from "@/lib/resumes/filters";
import { applyResumeFilters } from "@/lib/resumes/filters";
import { prisma } from "@/lib/prisma";

export const resumeDetailInclude = {
  candidate: {
    select: {
      id: true,
      lastName: true,
      firstName: true,
      tenantId: true,
    },
  },
  createdBy: { select: { id: true, name: true } },
  updatedBy: { select: { id: true, name: true } },
  exportLogs: {
    orderBy: { exportedAt: "desc" as const },
    take: 20,
    include: { exportedBy: { select: { id: true, name: true } } },
  },
} satisfies Prisma.ResumeInclude;

export type ResumeDetail = Prisma.ResumeGetPayload<{
  include: typeof resumeDetailInclude;
}>;

export const resumeSummarySelect = {
  id: true,
  candidateId: true,
  documentType: true,
  templateType: true,
  status: true,
  fullName: true,
  updatedAt: true,
  createdAt: true,
} satisfies Prisma.ResumeSelect;

export type ResumeSummaryItem = Prisma.ResumeGetPayload<{
  select: typeof resumeSummarySelect;
}>;

export const resumeListInclude = {
  candidate: {
    select: { id: true, lastName: true, firstName: true },
  },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ResumeInclude;

export type ResumeListItem = Prisma.ResumeGetPayload<{
  include: typeof resumeListInclude;
}>;

export function resumeAccessWhere(
  user: User,
  tenantId: string
): Prisma.ResumeWhereInput {
  const standaloneFilter: Prisma.ResumeWhereInput = canViewTenantCandidates(
    user.role
  )
    ? { candidateId: { equals: null } }
    : { candidateId: { equals: null }, createdById: user.id };

  return {
    tenantId,
    deletedAt: null,
    OR: [standaloneFilter, { candidate: candidateAccessFilter(user, tenantId) }],
  };
}

export function resumeByIdWhere(
  user: User,
  resumeId: string,
  tenantId: string
): Prisma.ResumeWhereInput {
  return {
    id: resumeId,
    ...resumeAccessWhere(user, tenantId),
  };
}

export function resumeByCandidateWhere(
  user: User,
  candidateId: string,
  tenantId: string,
  documentType: ResumeDocumentType = "RIREKISHO"
): Prisma.ResumeWhereInput {
  return {
    candidateId,
    documentType,
    ...resumeAccessWhere(user, tenantId),
  };
}

export async function getResumeById(
  user: User,
  resumeId: string,
  tenantId: string
): Promise<ResumeDetail | null> {
  return prisma.resume.findFirst({
    where: resumeByIdWhere(user, resumeId, tenantId),
    include: resumeDetailInclude,
  });
}

export async function getResumeByCandidateId(
  user: User,
  candidateId: string,
  tenantId: string,
  documentType: ResumeDocumentType = "RIREKISHO"
): Promise<ResumeSummaryItem | null> {
  return prisma.resume.findFirst({
    where: resumeByCandidateWhere(user, candidateId, tenantId, documentType),
    select: resumeSummarySelect,
  });
}

export async function getResumesForUser(
  user: User,
  tenantId: string,
  filters: ResumeFilters = {}
): Promise<ResumeListItem[]> {
  const where = applyResumeFilters(
    resumeAccessWhere(user, tenantId),
    filters
  );

  return prisma.resume.findMany({
    where,
    include: resumeListInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCandidatesForResumePicker(
  user: User,
  tenantId: string
) {
  return prisma.candidate.findMany({
    where: candidateAccessFilter(user, tenantId),
    select: {
      id: true,
      lastName: true,
      firstName: true,
      furigana: true,
      resumes: {
        where: { deletedAt: null, documentType: "RIREKISHO" },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
