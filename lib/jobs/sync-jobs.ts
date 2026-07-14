import { getDefaultTenantId } from "@/lib/tenant/context";
import type { CompanySheetConfig } from "@/lib/jobs/sheets/company-sheet-config";
import {
  getCompanySheetConfig,
  getCompanySheetConfigs,
  isJobSyncConfigured,
} from "@/lib/jobs/sheets/company-sheet-config";
import { jobImportService } from "@/lib/jobs/import/job-import-service";
import type { JobImportContext, JobImportResult } from "@/lib/jobs/import/types";
import { geocodePendingJobsForTenant } from "@/lib/jobs/geocode";
import { prisma } from "@/lib/prisma";

export type SyncJobsOptions = {
  tenantId?: string;
  companyKey?: string;
};

export type SyncJobsCronResult = {
  tenantId: string;
  configured: boolean;
  companies: number;
  results: JobImportResult[];
};

async function resolveSyncTenantId(tenantId?: string): Promise<string> {
  if (tenantId) return tenantId;
  if (process.env.JOB_SYNC_TENANT_ID) return process.env.JOB_SYNC_TENANT_ID;
  return getDefaultTenantId();
}

export async function syncJobs(options: SyncJobsOptions = {}): Promise<SyncJobsCronResult> {
  const tenantId = await resolveSyncTenantId(options.tenantId);
  const configured = isJobSyncConfigured();

  if (!configured) {
    return { tenantId, configured: false, companies: 0, results: [] };
  }

  const context: JobImportContext = { tenantId, userId: null };

  if (options.companyKey) {
    const result = await jobImportService.syncByCompanyKey(options.companyKey, context);
    try {
      await geocodePendingJobsForTenant(tenantId, 40);
    } catch (error) {
      console.error("[sync-jobs] geocode after sync failed:", error);
    }
    return {
      tenantId,
      configured: true,
      companies: result ? 1 : 0,
      results: result ? [result] : [],
    };
  }

  const results = await jobImportService.syncAll(context);
  try {
    await geocodePendingJobsForTenant(tenantId, 80);
  } catch (error) {
    console.error("[sync-jobs] geocode after sync failed:", error);
  }
  return {
    tenantId,
    configured: true,
    companies: results.length,
    results,
  };
}

export async function getSyncStatusForTenant(tenantId: string) {
  const configs = getCompanySheetConfigs();

  const statuses = await Promise.all(
    configs.map(async (config: CompanySheetConfig) => {
      const latest = await prisma.jobImportLog.findFirst({
        where: { tenantId, companyName: config.displayName },
        orderBy: { importedAt: "desc" },
      });

      const jobCount = await prisma.job.count({
        where: { tenantId, sourceCompany: config.companyKey },
      });

      return {
        companyKey: config.companyKey,
        displayName: config.displayName,
        sheetName: config.sheetName,
        jobCount,
        lastSyncedAt: latest?.importedAt ?? null,
        lastStatus: latest?.status ?? null,
        lastSuccessCount: latest?.successCount ?? null,
        lastFailedCount: latest?.failedCount ?? null,
      };
    })
  );

  return {
    configured: isJobSyncConfigured(),
    spreadsheetId: process.env.JOB_SPREADSHEET_ID ?? null,
    companies: statuses,
  };
}

export { getCompanySheetConfig, getCompanySheetConfigs };
