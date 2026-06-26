"use server";

import { requireTenantContext } from "@/lib/tenant/context";
import { parseJobFilters } from "@/lib/jobs/filters";
import {
  queryJobById,
  queryJobsForTenant,
  type JobListResult,
} from "@/lib/jobs/queries";

export async function getJobsForUser(
  params: Record<string, string | string[] | undefined> = {}
): Promise<JobListResult> {
  const { tenantId } = await requireTenantContext();
  const filters = parseJobFilters(params);
  return queryJobsForTenant(tenantId, filters);
}

export async function getJobById(jobId: string) {
  const { tenantId } = await requireTenantContext();
  return queryJobById(tenantId, jobId);
}

export type { JobListResult };
