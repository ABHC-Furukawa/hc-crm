import type { ImportSourceType } from "@prisma/client";

export type RawJobRow = {
  rowNumber: number;
  rawData: Record<string, string>;
};

export type JobParseError = {
  rowNumber?: number;
  message: string;
};

export type JobAdapterResult = {
  rows: RawJobRow[];
  errors: JobParseError[];
  skippedClosedCount?: number;
};

/** 取込ソース Adapter（Google Sheets / 将来 CSV） */
export interface JobSourceAdapter {
  readonly sourceType: ImportSourceType;
  parse(): Promise<JobAdapterResult>;
}

export type JobImportContext = {
  tenantId: string;
  userId?: string | null;
};

export type JobImportResult = {
  importLogId: string;
  companyKey: string;
  displayName: string;
  importedCount: number;
  successCount: number;
  failedCount: number;
  removedCount?: number;
  skippedClosedCount?: number;
  errors: JobParseError[];
};
