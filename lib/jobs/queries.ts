import type { Job } from "@prisma/client";
import type { JobFilters } from "@/lib/jobs/filters";
import {
  buildJobListOrderBy,
  buildJobListWhere,
  JOB_PAGE_SIZE,
} from "@/lib/jobs/filters";
import { prisma } from "@/lib/prisma";

export type JobListResult = {
  items: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const jobDetailInclude = {
  rawJob: {
    select: {
      id: true,
      sheetName: true,
      rowNumber: true,
      importedAt: true,
      rawData: true,
    },
  },
} as const;

export async function queryJobsForTenant(
  tenantId: string,
  filters: JobFilters
): Promise<JobListResult> {
  const where = buildJobListWhere(tenantId, filters);
  const page = filters.page ?? 1;
  const skip = (page - 1) * JOB_PAGE_SIZE;

  const [total, items] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: buildJobListOrderBy(filters),
      skip,
      take: JOB_PAGE_SIZE,
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize: JOB_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / JOB_PAGE_SIZE)),
  };
}

export async function queryJobById(tenantId: string, jobId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, tenantId },
    include: jobDetailInclude,
  });
}

export async function queryJobsForPicker(
  tenantId: string,
  query: string,
  limit = 20
) {
  const term = query.trim();

  return prisma.job.findMany({
    where: {
      tenantId,
      ...(term
        ? {
            OR: [
              { jobTitle: { contains: term, mode: "insensitive" } },
              { companyName: { contains: term, mode: "insensitive" } },
              { location: { contains: term, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      jobTitle: true,
      companyName: true,
      location: true,
      referralFee: true,
      sourceCompany: true,
    },
  });
}

export async function queryAllJobsForExport(tenantId: string) {
  return prisma.job.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function queryRecentJobImportLogs(tenantId: string, limit = 20) {
  return prisma.jobImportLog.findMany({
    where: { tenantId },
    orderBy: { importedAt: "desc" },
    take: limit,
  });
}

export async function queryLatestImportLogByCompany(
  tenantId: string,
  companyName: string
) {
  return prisma.jobImportLog.findFirst({
    where: { tenantId, companyName },
    orderBy: { importedAt: "desc" },
  });
}

export const JOB_MAP_LIMIT = 800;

export type JobMapItem = {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string | null;
  latitude: number;
  longitude: number;
  referralFee: string | null;
  sourceCompany: string;
  recruitmentStatus: string;
};

export type JobMapResult = {
  markers: JobMapItem[];
  totalMatched: number;
  truncated: boolean;
  pendingGeocodeCount: number;
  failedGeocodeCount: number;
  noLocationCount: number;
};

export async function queryJobsForMap(
  tenantId: string,
  filters: JobFilters
): Promise<JobMapResult> {
  const where = buildJobListWhere(tenantId, filters);

  const [totalMatched, withCoords, pendingGeocodeCount, failedGeocodeCount, noLocationCount] =
    await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where: {
          AND: [
            where,
            { latitude: { not: null } },
            { longitude: { not: null } },
            { geocodeStatus: "OK" },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: JOB_MAP_LIMIT,
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          location: true,
          latitude: true,
          longitude: true,
          referralFee: true,
          sourceCompany: true,
          recruitmentStatus: true,
        },
      }),
      prisma.job.count({
        where: {
          AND: [
            where,
            { location: { not: null } },
            { NOT: { location: "" } },
            {
              OR: [
                { latitude: null },
                { longitude: null },
                { geocodeStatus: null },
              ],
            },
          ],
        },
      }),
      prisma.job.count({
        where: {
          AND: [
            where,
            { geocodeStatus: { in: ["ZERO_RESULTS", "ERROR"] } },
          ],
        },
      }),
      prisma.job.count({
        where: {
          AND: [
            where,
            {
              OR: [{ location: null }, { location: "" }],
            },
          ],
        },
      }),
    ]);

  const markers: JobMapItem[] = withCoords
    .filter((j) => j.latitude != null && j.longitude != null)
    .map((j) => ({
      id: j.id,
      jobTitle: j.jobTitle,
      companyName: j.companyName,
      location: j.location,
      latitude: j.latitude!,
      longitude: j.longitude!,
      referralFee: j.referralFee,
      sourceCompany: j.sourceCompany,
      recruitmentStatus: j.recruitmentStatus,
    }));

  return {
    markers,
    totalMatched,
    truncated: totalMatched > JOB_MAP_LIMIT,
    pendingGeocodeCount,
    failedGeocodeCount,
    noLocationCount,
  };
}
