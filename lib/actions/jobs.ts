"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/tenant/context";
import { canManageTenantSettings } from "@/lib/auth/rbac";
import { parseJobFilters } from "@/lib/jobs/filters";
import {
  geocodePendingJobsForTenant,
  isGeocodingConfigured,
  isGoogleMapsDisplayConfigured,
} from "@/lib/jobs/geocode";
import {
  queryJobById,
  queryJobsForMap,
  queryJobsForTenant,
  type JobListResult,
  type JobMapResult,
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

export async function getJobsForMap(
  params: Record<string, string | string[] | undefined> = {}
): Promise<
  JobMapResult & {
    mapsConfigured: boolean;
    geocodingConfigured: boolean;
  }
> {
  const { tenantId } = await requireTenantContext();
  const filters = parseJobFilters(params);

  // マップ表示前に未座標分を少し消化
  if (isGeocodingConfigured()) {
    try {
      await geocodePendingJobsForTenant(tenantId, 30);
    } catch (error) {
      console.error("[jobs/map] geocode backfill failed:", error);
    }
  }

  const result = await queryJobsForMap(tenantId, filters);
  return {
    ...result,
    mapsConfigured: isGoogleMapsDisplayConfigured(),
    geocodingConfigured: isGeocodingConfigured(),
  };
}

export async function refreshJobGeocodesAction(): Promise<{
  error?: string;
  message?: string;
}> {
  const { user, tenantId } = await requireTenantContext();
  if (!canManageTenantSettings(user.role)) {
    return { error: "権限がありません" };
  }
  if (!isGeocodingConfigured()) {
    return { error: "Geocoding API キーが未設定です" };
  }

  const result = await geocodePendingJobsForTenant(tenantId, 80);
  revalidatePath("/jobs/map");
  return {
    message: `座標更新: 処理 ${result.processed} 件（成功 ${result.ok} / 失敗 ${result.failed}）`,
  };
}

export type { JobListResult, JobMapResult };
