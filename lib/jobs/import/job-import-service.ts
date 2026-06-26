import {
  ImportSourceType,
  JobImportLogStatus,
  type RawJob,
} from "@prisma/client";
import { GoogleSheetAdapter } from "@/lib/jobs/import/adapters/google-sheet-adapter";
import type {
  JobImportContext,
  JobImportResult,
  JobParseError,
} from "@/lib/jobs/import/types";
import { getImporterForConfig } from "@/lib/jobs/importers/registry";
import type { NormalizedJobInput } from "@/lib/jobs/importers/types";
import { normalizeService } from "@/lib/jobs/normalize/normalize-service";
import type { CompanySheetConfig } from "@/lib/jobs/sheets/company-sheet-config";
import {
  getCompanySheetConfig,
  getCompanySheetConfigs,
} from "@/lib/jobs/sheets/company-sheet-config";
import { prisma } from "@/lib/prisma";

function finalizeLogStatus(
  importedCount: number,
  successCount: number,
  failedCount: number
): JobImportLogStatus {
  if (importedCount === 0) return JobImportLogStatus.FAILED;
  if (failedCount > 0 && successCount > 0) return JobImportLogStatus.PARTIAL;
  if (failedCount > 0 && successCount === 0) return JobImportLogStatus.FAILED;
  return JobImportLogStatus.COMPLETED;
}

function formatErrors(errors: JobParseError[]): string | null {
  if (errors.length === 0) return null;
  return errors
    .slice(0, 20)
    .map((e) => (e.rowNumber != null ? `${e.rowNumber}行目: ${e.message}` : e.message))
    .join("; ");
}

function isNormalizationError(
  result: NormalizedJobInput | { rowNumber: number; message: string; skip?: boolean }
): result is { rowNumber: number; message: string; skip?: boolean } {
  return "message" in result && !("jobTitle" in result);
}

async function expireStalePendingLogs(
  tenantId: string,
  companyDisplayName: string
): Promise<void> {
  await prisma.jobImportLog.updateMany({
    where: {
      tenantId,
      companyName: companyDisplayName,
      status: JobImportLogStatus.PENDING,
    },
    data: {
      status: JobImportLogStatus.FAILED,
      errorMessage: "前回の同期が中断されました",
    },
  });
}

function buildJobUpsert(
  context: JobImportContext,
  rawJob: RawJob,
  input: NormalizedJobInput
): Promise<{ id: string }> {
  const locationKey = input.location?.trim() ?? "";

  return prisma.job.upsert({
    where: {
      tenantId_sourceCompany_sourceSheet_jobTitle_location: {
        tenantId: context.tenantId,
        sourceCompany: input.sourceCompany,
        sourceSheet: input.sourceSheet,
        jobTitle: input.jobTitle,
        location: locationKey,
      },
    },
    create: {
      tenantId: context.tenantId,
      companyName: input.companyName,
      jobTitle: input.jobTitle,
      location: locationKey || null,
      salary: input.salary,
      employmentType: input.employmentType,
      shiftType: input.shiftType,
      shiftTypeDetail: input.shiftTypeDetail,
      gender: input.gender,
      maxAge: input.maxAge,
      referralFee: input.referralFee,
      otherNotes: input.otherNotes,
      sourceUrl: input.sourceUrl,
      sourceCompany: input.sourceCompany,
      sourceSheet: input.sourceSheet,
      rawJobId: rawJob.id,
    },
    update: {
      companyName: input.companyName,
      location: locationKey || null,
      salary: input.salary,
      employmentType: input.employmentType,
      shiftType: input.shiftType,
      shiftTypeDetail: input.shiftTypeDetail,
      gender: input.gender,
      maxAge: input.maxAge,
      referralFee: input.referralFee,
      otherNotes: input.otherNotes,
      sourceUrl: input.sourceUrl,
      rawJobId: rawJob.id,
    },
    select: { id: true },
  });
}

async function removeStaleTabJobs(
  tenantId: string,
  config: CompanySheetConfig,
  activeJobIds: string[]
): Promise<number> {
  if (activeJobIds.length === 0) return 0;

  const result = await prisma.job.deleteMany({
    where: {
      tenantId,
      sourceCompany: config.companyKey,
      sourceSheet: config.sheetName,
      id: { notIn: activeJobIds },
    },
  });

  return result.count;
}

export class JobImportService {
  async syncCompany(
    config: CompanySheetConfig,
    context: JobImportContext
  ): Promise<JobImportResult> {
    getImporterForConfig(config);
    await expireStalePendingLogs(context.tenantId, config.displayName);

    const importLog = await prisma.jobImportLog.create({
      data: {
        tenantId: context.tenantId,
        companyName: config.displayName,
        status: JobImportLogStatus.PENDING,
        sourceType: ImportSourceType.GOOGLE_SHEET,
      },
    });

    const adapter = new GoogleSheetAdapter(config);
    const allErrors: JobParseError[] = [];

    try {
      const parsed = await adapter.parse();
      allErrors.push(...parsed.errors);

      if (parsed.rows.length === 0) {
        const errorMessage =
          formatErrors(allErrors) ?? "取込対象の行がありません";
        await prisma.jobImportLog.update({
          where: { id: importLog.id },
          data: {
            status: JobImportLogStatus.FAILED,
            errorMessage,
          },
        });
        return {
          importLogId: importLog.id,
          companyKey: config.companyKey,
          displayName: config.displayName,
          importedCount: 0,
          successCount: 0,
          failedCount: 0,
          errors: allErrors,
        };
      }

      const importedAt = new Date();
      const rawJobs = await prisma.rawJob.createManyAndReturn({
        data: parsed.rows.map((row) => ({
          tenantId: context.tenantId,
          companyName: config.companyKey,
          sheetName: config.sheetName,
          rowNumber: row.rowNumber,
          rawData: row.rawData,
          importedAt,
        })),
      });

      let successCount = 0;
      let failedCount = 0;
      const activeJobIds: string[] = [];

      for (const rawJob of rawJobs) {
        const normalized = normalizeService.normalizeRawJob(rawJob);

        if (isNormalizationError(normalized)) {
          if (normalized.skip) continue;
          failedCount++;
          allErrors.push({
            rowNumber: normalized.rowNumber,
            message: normalized.message,
          });
          continue;
        }

        const job = await buildJobUpsert(
          context,
          rawJob,
          normalized as NormalizedJobInput
        );
        activeJobIds.push(job.id);
        successCount++;
      }

      let removedCount = 0;
      if (successCount > 0 && activeJobIds.length > 0) {
        removedCount = await removeStaleTabJobs(
          context.tenantId,
          config,
          activeJobIds
        );
      }

      const importedCount = rawJobs.length;
      const skippedClosedCount = parsed.skippedClosedCount ?? 0;
      const status = finalizeLogStatus(importedCount, successCount, failedCount);

      await prisma.jobImportLog.update({
        where: { id: importLog.id },
        data: {
          importedCount,
          successCount,
          failedCount,
          status,
          errorMessage: formatErrors(allErrors),
        },
      });

      return {
        importLogId: importLog.id,
        companyKey: config.companyKey,
        displayName: config.displayName,
        importedCount,
        successCount,
        failedCount,
        removedCount,
        skippedClosedCount,
        errors: allErrors,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "同期中にエラーが発生しました";
      allErrors.push({ message });

      await prisma.jobImportLog.update({
        where: { id: importLog.id },
        data: {
          status: JobImportLogStatus.FAILED,
          errorMessage: message,
        },
      });

      return {
        importLogId: importLog.id,
        companyKey: config.companyKey,
        displayName: config.displayName,
        importedCount: 0,
        successCount: 0,
        failedCount: 0,
        errors: allErrors,
      };
    }
  }

  async syncAll(context: JobImportContext): Promise<JobImportResult[]> {
    const configs = getCompanySheetConfigs();
    const results: JobImportResult[] = [];

    for (const config of configs) {
      results.push(await this.syncCompany(config, context));
    }

    return results;
  }

  async syncByCompanyKey(
    companyKey: string,
    context: JobImportContext
  ): Promise<JobImportResult | null> {
    const config = getCompanySheetConfig(companyKey);
    if (!config) return null;
    return this.syncCompany(config, context);
  }
}

export const jobImportService = new JobImportService();
