import type { Prisma, User } from "@prisma/client";
import { callLeadAccessFilter } from "@/lib/tenant/access";
import type { CallLeadFilters } from "@/lib/call-leads/filters";
import { CALL_LEAD_DEFAULT_PAGE_SIZE } from "@/lib/call-leads/import/constants";
import { getPrefecturesForRegion } from "@/lib/constants/japan-areas";
import { prisma } from "@/lib/prisma";

export const callLeadActivityInclude = {
  user: { select: { id: true, name: true } },
} satisfies Prisma.CallLeadActivityInclude;

export type CallLeadActivityItem = Prisma.CallLeadActivityGetPayload<{
  include: typeof callLeadActivityInclude;
}>;

export const callLeadListInclude = {
  assignedUser: { select: { id: true, name: true, lastName: true } },
  notes: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  },
  _count: { select: { notes: true } },
} satisfies Prisma.CallLeadInclude;

export type CallLeadListItem = Prisma.CallLeadGetPayload<{
  include: typeof callLeadListInclude;
}>;

export const callLeadDetailInclude = {
  assignedUser: { select: { id: true, name: true, email: true, lastName: true } },
  convertedCandidate: {
    select: { id: true, lastName: true, firstName: true, status: true },
  },
  callAttempts: {
    orderBy: { calledAt: "desc" as const },
    take: 100,
    include: {
      calledBy: { select: { id: true, name: true } },
    },
  },
  notes: {
    orderBy: { createdAt: "desc" as const },
    include: { author: { select: { id: true, name: true } } },
  },
  _count: {
    select: {
      callAttempts: true,
      notes: true,
      activities: true,
    },
  },
} satisfies Prisma.CallLeadInclude;

export type CallLeadDetail = Prisma.CallLeadGetPayload<{
  include: typeof callLeadDetailInclude;
}>;

export function callLeadByIdWhere(
  user: User,
  tenantId: string,
  id: string
): Prisma.CallLeadWhereInput {
  return {
    id,
    ...callLeadAccessFilter(user, tenantId),
  };
}

export function buildCallLeadListWhere(
  user: User,
  tenantId: string,
  filters: CallLeadFilters = {}
): Prisma.CallLeadWhereInput {
  const base = callLeadAccessFilter(user, tenantId);

  const q = filters.q?.trim();
  const search: Prisma.CallLeadWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { applicationArea: { contains: q, mode: "insensitive" } },
          { notes: { some: { content: { contains: q, mode: "insensitive" } } } },
        ],
      }
    : undefined;

  const ageFilter: Prisma.CallLeadWhereInput = {};
  if (filters.ageMin != null || filters.ageMax != null) {
    ageFilter.age = {
      ...(filters.ageMin != null ? { gte: filters.ageMin } : {}),
      ...(filters.ageMax != null ? { lte: filters.ageMax } : {}),
    };
  }

  let areaFilter: Prisma.CallLeadWhereInput | undefined;
  if (filters.prefecture) {
    areaFilter = {
      applicationArea: { contains: filters.prefecture, mode: "insensitive" },
    };
  } else if (filters.region) {
    const prefectures = getPrefecturesForRegion(filters.region);
    if (prefectures.length > 0) {
      areaFilter = {
        OR: prefectures.map((pref) => ({
          applicationArea: { contains: pref, mode: "insensitive" as const },
        })),
      };
    }
  } else if (filters.applicationArea?.trim()) {
    areaFilter = {
      applicationArea: {
        contains: filters.applicationArea.trim(),
        mode: "insensitive",
      },
    };
  }

  const nextCallFilter: Prisma.CallLeadWhereInput = {};
  if (filters.nextCallFrom || filters.nextCallTo) {
    nextCallFilter.nextCallDate = {
      ...(filters.nextCallFrom ? { gte: new Date(filters.nextCallFrom) } : {}),
      ...(filters.nextCallTo ? { lte: new Date(filters.nextCallTo) } : {}),
    };
  }

  const noteFilter: Prisma.CallLeadWhereInput | undefined =
    filters.hasNote === true
      ? { notes: { some: {} } }
      : filters.hasNote === false
        ? { notes: { none: {} } }
        : undefined;

  return {
    ...base,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
    ...(filters.assignedUserId ? { assignedUserId: filters.assignedUserId } : {}),
    ...(search ?? {}),
    ...ageFilter,
    ...(areaFilter ?? {}),
    ...nextCallFilter,
    ...(noteFilter ?? {}),
  };
}

export const callLeadListOrderBy: Prisma.CallLeadOrderByWithRelationInput[] = [
  { sourceRowNumber: { sort: "desc", nulls: "last" } },
  { appliedAt: "desc" },
  { createdAt: "desc" },
];

export type CallLeadListResult = {
  items: CallLeadListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function queryCallLeadsForUser(
  user: User,
  tenantId: string,
  filters: CallLeadFilters = {}
): Promise<CallLeadListResult> {
  const where = buildCallLeadListWhere(user, tenantId, filters);
  const pageSize = filters.pageSize ?? CALL_LEAD_DEFAULT_PAGE_SIZE;
  const page = filters.page ?? 1;
  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.callLead.count({ where }),
    prisma.callLead.findMany({
      where,
      include: callLeadListInclude,
      orderBy: callLeadListOrderBy,
      skip,
      take: pageSize,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
