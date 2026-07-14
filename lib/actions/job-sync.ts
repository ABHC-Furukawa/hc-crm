"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireTenantContext } from "@/lib/tenant/context";
import { jobImportService } from "@/lib/jobs/import/job-import-service";
import {
  getCompanySheetConfig,
  getCompanySheetConfigs,
  isJobSyncConfigured,
} from "@/lib/jobs/sheets/company-sheet-config";
import { queryRecentJobImportLogs } from "@/lib/jobs/queries";
import { getSyncStatusForTenant } from "@/lib/jobs/sync-jobs";
import { geocodePendingJobsForTenant } from "@/lib/jobs/geocode";
import { notifyJobSyncToSlack } from "@/lib/notifications/slack";

export type JobSyncActionState = {
  error?: string;
  success?: boolean;
  message?: string;
  results?: {
    displayName: string;
    importedCount: number;
    successCount: number;
    failedCount: number;
    removedCount?: number;
    skippedClosedCount?: number;
  }[];
};

function assertCanSync(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.DEVELOP || role === UserRole.MANAGER;
}

export async function getJobSyncStatus() {
  const { tenantId } = await requireTenantContext();
  const [status, logs] = await Promise.all([
    getSyncStatusForTenant(tenantId),
    queryRecentJobImportLogs(tenantId),
  ]);
  return { status, logs, configs: getCompanySheetConfigs() };
}

export async function getRecentJobImportLogs(limit = 20) {
  const { tenantId } = await requireTenantContext();
  return queryRecentJobImportLogs(tenantId, limit);
}

export async function syncCompanyByKeyAction(
  companyKey: string
): Promise<JobSyncActionState> {
  const { user, tenantId } = await requireTenantContext();

  if (!assertCanSync(user.role)) {
    return { error: "同期を実行する権限がありません" };
  }

  if (!isJobSyncConfigured()) {
    return {
      error:
        "Google Sheets 同期が未設定です。JOB_SPREADSHEET_ID と GOOGLE_SERVICE_ACCOUNT_JSON を設定してください",
    };
  }

  const config = getCompanySheetConfig(companyKey);
  if (!config) {
    return { error: "指定された取引先が見つかりません" };
  }

  try {
    const result = await jobImportService.syncCompany(config, {
      tenantId,
      userId: user.id,
    });

    try {
      await notifyJobSyncToSlack({
        displayName: result.displayName,
        companyKey: result.companyKey,
        importedCount: result.importedCount,
        successCount: result.successCount,
        failedCount: result.failedCount,
        skippedClosedCount: result.skippedClosedCount,
      });
    } catch (slackError) {
      console.error("[job-sync] Slack notification failed:", slackError);
    }

    try {
      await geocodePendingJobsForTenant(tenantId, 40);
    } catch (geocodeError) {
      console.error("[job-sync] geocode after sync failed:", geocodeError);
    }

    revalidatePath("/jobs");
    revalidatePath("/jobs/sync");
    revalidatePath("/jobs/map");

    const removed = result.removedCount ?? 0;
    const skippedClosed = result.skippedClosedCount ?? 0;
    const closedNote =
      removed > 0 || skippedClosed > 0
        ? `（クローズ除外 ${skippedClosed} 行 / CRM削除 ${removed} 件）`
        : "";

    return {
      success: result.successCount > 0 || result.importedCount > 0,
      message:
        result.failedCount > 0
          ? `${config.displayName}: 成功 ${result.successCount} 件 / 失敗 ${result.failedCount} 件${closedNote}`
          : `${config.displayName}: ${result.successCount} 件を同期しました${closedNote}`,
      results: [
        {
          displayName: result.displayName,
          importedCount: result.importedCount,
          successCount: result.successCount,
          failedCount: result.failedCount,
          removedCount: result.removedCount,
          skippedClosedCount: result.skippedClosedCount,
        },
      ],
      error:
        result.successCount === 0 && result.importedCount === 0
          ? result.errors[0]?.message ?? "同期に失敗しました"
          : undefined,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "同期中にエラーが発生しました",
    };
  }
}

export async function syncJobsAction(
  _prev: JobSyncActionState,
  formData: FormData
): Promise<JobSyncActionState> {
  const companyKey = String(formData.get("companyKey") ?? "").trim();
  if (!companyKey) {
    return { error: "派遣会社を選択してください" };
  }

  return syncCompanyByKeyAction(companyKey);
}
