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
