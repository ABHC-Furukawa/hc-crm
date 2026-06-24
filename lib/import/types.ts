import type { CallLeadStatus, ImportSourceType } from "@prisma/client";

/** Adapter が ImportService に渡す正規化済み行 */
export type CallLeadImportRow = {
  sourceIndex?: number;
  appliedAt?: Date | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  applicationArea?: string | null;
  sourceId?: string | null;
};

export type ImportSourceMeta = {
  sourceType: ImportSourceType;
  sourceName?: string | null;
};

export type ImportParseError = {
  sourceIndex?: number;
  message: string;
};

export type ImportAdapterResult = {
  rows: CallLeadImportRow[];
  errors: ImportParseError[];
};

/** 取込ソース Adapter Interface（CSV / Manual / 将来 API 等） */
export interface ImportSourceAdapter {
  readonly sourceType: ImportSourceType;
  parse(): Promise<ImportAdapterResult> | ImportAdapterResult;
}

export type ImportContext = {
  tenantId: string;
  userId: string;
  assignedUserId?: string | null;
};

export type ImportedCallLeadSummary = {
  callLeadId: string;
  status: CallLeadStatus;
  name: string;
  isDuplicate: boolean;
  isOutOfScope: boolean;
  sourceIndex?: number;
};

export type ImportServiceResult = {
  importLogId: string;
  importedCount: number;
  duplicateCount: number;
  outOfScopeCount: number;
  validCount: number;
  parseErrors: ImportParseError[];
  rows: ImportedCallLeadSummary[];
};

export type ValidatedImportRow = CallLeadImportRow & {
  email: string | null;
  phone: string | null;
  age: number | null;
  applicationArea: string | null;
};
