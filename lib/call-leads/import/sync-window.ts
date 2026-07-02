import { ImportSourceType } from "@prisma/client";
import type { CallLeadImportRow } from "@/lib/import/types";
import { prisma } from "@/lib/prisma";

export type CallLeadSyncWindowMode = "initial" | "incremental" | "full";

export type SyncWindowSelection = {
  mode: CallLeadSyncWindowMode;
  rows: CallLeadImportRow[];
  /** 同期対象外（ウィンドウ外）の行数 */
  skippedByWindow: number;
  maxSyncedRowBefore: number | null;
  totalSheetRows: number;
};

const DEFAULT_INITIAL_LIMIT = 5000;

export function getCallLeadSyncInitialLimit(): number {
  const parsed = Number.parseInt(
    process.env.CALL_LEAD_SYNC_INITIAL_LIMIT ?? String(DEFAULT_INITIAL_LIMIT),
    10
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_INITIAL_LIMIT;
}

/** `full` = 全件同期（初回 limit なし）。通常は未設定で増分モード */
export function isCallLeadFullSyncMode(): boolean {
  return process.env.CALL_LEAD_SYNC_MODE?.trim().toLowerCase() === "full";
}

export function resolveImportRowNumber(row: CallLeadImportRow): number {
  return row.sourceRowNumber ?? row.sourceIndex ?? 0;
}

export async function getMaxSyncedRowNumber(
  tenantId: string,
  sourceName: string,
  sheetName: string
): Promise<number | null> {
  const result = await prisma.callLead.aggregate({
    where: {
      tenantId,
      deletedAt: null,
      sourceName,
      sourceSheet: sheetName,
      sourceRowNumber: { not: null },
    },
    _max: { sourceRowNumber: true },
  });
  return result._max.sourceRowNumber;
}

export async function countSyncedFromSheet(
  tenantId: string,
  sourceName: string,
  sheetName: string
): Promise<number> {
  return prisma.callLead.count({
    where: {
      tenantId,
      deletedAt: null,
      sourceName,
      sourceSheet: sheetName,
      sourceRowNumber: { not: null },
    },
  });
}

/** 初回: シート末尾（行番号が大きい方）から initialLimit 件。以降: maxRow より大きい行のみ */
export function selectRowsForSyncWindow(
  rows: CallLeadImportRow[],
  maxSyncedRow: number | null,
  initialLimit: number,
  fullSync: boolean
): SyncWindowSelection {
  const sorted = [...rows].sort(
    (a, b) => resolveImportRowNumber(a) - resolveImportRowNumber(b)
  );
  const totalSheetRows = sorted.length;

  if (fullSync) {
    return {
      mode: "full",
      rows: sorted,
      skippedByWindow: 0,
      maxSyncedRowBefore: maxSyncedRow,
      totalSheetRows,
    };
  }

  if (maxSyncedRow == null) {
    const selected = sorted.slice(-initialLimit);
    return {
      mode: "initial",
      rows: selected,
      skippedByWindow: totalSheetRows - selected.length,
      maxSyncedRowBefore: null,
      totalSheetRows,
    };
  }

  const selected = sorted.filter((r) => resolveImportRowNumber(r) > maxSyncedRow);
  return {
    mode: "incremental",
    rows: selected,
    skippedByWindow: totalSheetRows - selected.length,
    maxSyncedRowBefore: maxSyncedRow,
    totalSheetRows,
  };
}

export async function applyGoogleSheetSyncWindow(
  tenantId: string,
  sourceName: string,
  sheetName: string,
  rows: CallLeadImportRow[]
): Promise<SyncWindowSelection> {
  const maxSyncedRow = await getMaxSyncedRowNumber(tenantId, sourceName, sheetName);
  return selectRowsForSyncWindow(
    rows,
    maxSyncedRow,
    getCallLeadSyncInitialLimit(),
    isCallLeadFullSyncMode()
  );
}

export function formatSyncWindowSummary(selection: SyncWindowSelection): string {
  switch (selection.mode) {
    case "full":
      return `全件同期: ${selection.rows.length} 行`;
    case "initial":
      return `初回同期: 最新 ${selection.rows.length} 件（シート ${selection.totalSheetRows} 行中、${selection.skippedByWindow} 行は対象外）`;
    case "incremental":
      if (selection.rows.length === 0) {
        return `増分同期: 新規行なし（最終同期行 ${selection.maxSyncedRowBefore} まで取込済み）`;
      }
      return `増分同期: 新規 ${selection.rows.length} 行（最終同期行 ${selection.maxSyncedRowBefore} 以降）`;
  }
}

export function isGoogleSheetIncrementalSource(sourceType: ImportSourceType): boolean {
  return sourceType === ImportSourceType.GOOGLE_SHEET && !isCallLeadFullSyncMode();
}
