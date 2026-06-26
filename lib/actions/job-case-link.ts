"use server";

import { requireTenantContext } from "@/lib/tenant/context";
import {
  buildJobCaseDefaultsFromJob,
  type JobPickerItem,
} from "@/lib/jobs/job-case-bridge";
import { queryJobById, queryJobsForPicker } from "@/lib/jobs/queries";

export async function searchJobsForCaseLink(
  query: string
): Promise<JobPickerItem[]> {
  const { tenantId } = await requireTenantContext();
  return queryJobsForPicker(tenantId, query, 20);
}

export async function getJobCaseDefaultsFromJob(jobId: string) {
  const { tenantId } = await requireTenantContext();
  const job = await queryJobById(tenantId, jobId);
  if (!job) return null;
  return buildJobCaseDefaultsFromJob(job);
}
