import { google, type sheets_v4 } from "googleapis";
import { isRowClosedByFormatting } from "@/lib/jobs/sheets/sheet-row-format";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

let cachedClient: sheets_v4.Sheets | null = null;

export type SheetFetchResult = {
  values: string[][];
  /** 0始まりのシート行インデックス → クローズ（グレー）行 */
  closedRowIndices: Set<number>;
};

function parseServiceAccountJson(): Record<string, unknown> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON が設定されていません");
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON の JSON 形式が不正です");
  }
}

export function getGoogleSheetsClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const credentials = parseServiceAccountJson();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

/** シート名に特殊文字が含まれる場合はシングルクォートでエスケープ */
export function quoteSheetRange(sheetName: string, a1Range?: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  const base = `'${escaped}'`;
  return a1Range ? `${base}!${a1Range}` : base;
}

export async function fetchSheetValues(
  spreadsheetId: string,
  sheetName: string
): Promise<string[][]> {
  const result = await fetchSheetWithFormat(spreadsheetId, sheetName);
  return result.values;
}

/** セル値 + 行の背景色（グレー＝クローズ判定用） */
export async function fetchSheetWithFormat(
  spreadsheetId: string,
  sheetName: string
): Promise<SheetFetchResult> {
  const sheets = getGoogleSheetsClient();
  const range = quoteSheetRange(sheetName);

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [range],
    includeGridData: true,
    fields:
      "sheets.data.rowData.values(formattedValue,effectiveFormat(backgroundColor,textFormat))",
  });

  const rowData =
    response.data.sheets?.[0]?.data?.[0]?.rowData ?? [];

  const values: string[][] = [];
  const closedRowIndices = new Set<number>();

  for (let rowIndex = 0; rowIndex < rowData.length; rowIndex++) {
    const cells = rowData[rowIndex]?.values ?? [];
    const line: string[] = [];

    for (const cell of cells) {
      line.push(String(cell?.formattedValue ?? ""));
    }

    values.push(line);

    if (isRowClosedByFormatting(cells)) {
      closedRowIndices.add(rowIndex);
    }
  }

  return { values, closedRowIndices };
}
