import type { RawJob } from "@prisma/client";
import { getImporter } from "@/lib/jobs/importers/registry";
import type {
  NormalizationError,
  NormalizedJobInput,
} from "@/lib/jobs/importers/types";

export type NormalizeBatchResult = {
  success: NormalizedJobInput[];
  failed: NormalizationError[];
};

function isNormalizationError(
  result: NormalizedJobInput | NormalizationError
): result is NormalizationError {
  return "message" in result && !("jobTitle" in result);
}

export class NormalizeService {
  normalizeRawJob(rawJob: RawJob): NormalizedJobInput | NormalizationError {
    const importer = getImporter(rawJob.companyName);
    const rawData = rawJob.rawData as Record<string, string>;

    if (importer.shouldSkip(rawData)) {
      return {
        rowNumber: rawJob.rowNumber,
        message: "取込対象外（紹介料40万円未満・必須項目なし等）",
        skip: true,
      };
    }

    try {
      const result = importer.normalize(rawData, {
        companyKey: rawJob.companyName,
        displayName: importer.displayName,
        sheetName: rawJob.sheetName,
        rowNumber: rawJob.rowNumber,
      });

      if (!result) {
        return {
          rowNumber: rawJob.rowNumber,
          message: "派遣先企業名が取得できませんでした",
        };
      }

      return result;
    } catch (error) {
      return {
        rowNumber: rawJob.rowNumber,
        message: error instanceof Error ? error.message : "正規化に失敗しました",
      };
    }
  }

  normalizeBatch(rawJobs: RawJob[]): NormalizeBatchResult {
    const success: NormalizedJobInput[] = [];
    const failed: NormalizationError[] = [];

    for (const rawJob of rawJobs) {
      const result = this.normalizeRawJob(rawJob);
      if (isNormalizationError(result)) {
        failed.push(result);
      } else {
        success.push(result);
      }
    }

    return { success, failed };
  }
}

export const normalizeService = new NormalizeService();
