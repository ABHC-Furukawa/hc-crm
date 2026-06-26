import { ImportSourceType } from "@prisma/client";
import type { CompanySheetConfig } from "@/lib/jobs/sheets/company-sheet-config";
import {
  normalizeHeaderCell,
  resolveSheetLayout,
} from "@/lib/jobs/sheets/detect-header-row";
import { fetchSheetWithFormat } from "@/lib/jobs/sheets/google-sheets-client";
import { mergeRowRawData } from "@/lib/jobs/sheets/apply-tab-column-mapping";
import { getTabColumnMapping } from "@/lib/jobs/sheets/tab-column-mapping";
import type {
  JobAdapterResult,
  JobParseError,
  JobSourceAdapter,
  RawJobRow,
} from "@/lib/jobs/import/types";

function gridToRows(
  grid: string[][],
  headerRow: number,
  dataStartRow: number,
  closedRowIndices: Set<number>,
  companyKey: string
): { rows: RawJobRow[]; errors: JobParseError[]; skippedClosedCount: number } {
  const errors: JobParseError[] = [];
  const headerIndex = headerRow - 1;
  let skippedClosedCount = 0;

  if (grid.length === 0) {
    errors.push({ message: "シートにデータがありません" });
    return { rows: [], errors, skippedClosedCount: 0 };
  }

  if (headerIndex >= grid.length) {
    errors.push({ message: `ヘッダー行 ${headerRow} が見つかりません` });
    return { rows: [], errors, skippedClosedCount: 0 };
  }

  const headers = grid[headerIndex].map((h, i) => {
    const trimmed = normalizeHeaderCell(h);
    return trimmed.length > 0 ? trimmed : `__col_${i + 1}`;
  });

  const tabMapping = getTabColumnMapping(companyKey);
  const rows: RawJobRow[] = [];

  for (let i = dataStartRow - 1; i < grid.length; i++) {
    if (closedRowIndices.has(i)) {
      skippedClosedCount++;
      continue;
    }

    const line = grid[i];
    if (!line || line.every((cell) => normalizeHeaderCell(cell) === "")) {
      continue;
    }

    const headerRawData: Record<string, string> = {};
    for (let col = 0; col < headers.length; col++) {
      headerRawData[headers[col]!] = normalizeHeaderCell(line[col]);
    }

    const rawData = mergeRowRawData(headerRawData, line, tabMapping);

    rows.push({
      rowNumber: i + 1,
      rawData,
    });
  }

  if (rows.length === 0 && skippedClosedCount === 0) {
    errors.push({ message: "取込対象のデータ行がありません" });
  }

  return { rows, errors, skippedClosedCount };
}

export class GoogleSheetAdapter implements JobSourceAdapter {
  readonly sourceType = ImportSourceType.GOOGLE_SHEET;

  constructor(private readonly config: CompanySheetConfig) {}

  async parse(): Promise<JobAdapterResult> {
    const sheet = await fetchSheetWithFormat(
      this.config.spreadsheetId,
      this.config.sheetName
    );

    const layout = resolveSheetLayout(sheet.values, this.config);
    const { rows, errors, skippedClosedCount } = gridToRows(
      sheet.values,
      layout.headerRow,
      layout.dataStartRow,
      sheet.closedRowIndices,
      this.config.companyKey
    );

    return { rows, errors, skippedClosedCount };
  }
}
