import type { ImportSourceType } from "@prisma/client";

export type CallLeadSheetConfig = {
  spreadsheetId: string;
  sheetName: string;
  /** 1始まり。0 = 先頭20行から自動検出 */
  headerRow: number;
  /** 1始まり。0 = headerRow の次の行 */
  dataStartRow: number;
  sourceName: string;
};

export function getCallLeadSpreadsheetId(): string | null {
  const id = process.env.CALL_LEAD_SPREADSHEET_ID?.trim();
  return id && id.length > 0 ? id : null;
}

export function isCallLeadSheetSyncConfigured(): boolean {
  return (
    getCallLeadSpreadsheetId() != null &&
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  );
}

export function getCallLeadSheetConfig(): CallLeadSheetConfig | null {
  const spreadsheetId = getCallLeadSpreadsheetId();
  if (!spreadsheetId) return null;

  const sheetName = process.env.CALL_LEAD_SHEET_NAME?.trim() || "架電リスト";
  const headerRow = Number.parseInt(process.env.CALL_LEAD_HEADER_ROW ?? "0", 10);
  const dataStartRow = Number.parseInt(process.env.CALL_LEAD_DATA_START_ROW ?? "0", 10);

  return {
    spreadsheetId,
    sheetName,
    headerRow: Number.isFinite(headerRow) ? headerRow : 0,
    dataStartRow: Number.isFinite(dataStartRow) ? dataStartRow : 0,
    sourceName: sheetName,
  };
}

export function getCallLeadSheetSourceMeta(config: CallLeadSheetConfig) {
  return {
    sourceType: "GOOGLE_SHEET" as ImportSourceType,
    sourceName: config.sourceName,
    sheetName: config.sheetName,
  };
}
