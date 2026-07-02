import { ImportSourceType } from "@prisma/client";
import { fetchSheetWithFormat } from "@/lib/jobs/sheets/google-sheets-client";
import type { CallLeadSheetConfig } from "@/lib/call-leads/import/sheet-config";
import {
  normalizeHeaderCell,
  resolveCallLeadSheetLayout,
} from "@/lib/call-leads/import/sheet-layout";
import type {
  ImportAdapterResult,
  ImportParseError,
  ImportSourceAdapter,
} from "@/lib/import/types";
import { CSV_HEADER_MAP } from "@/lib/validators/call-lead-import";

function mapRowToImportRow(
  headers: string[],
  line: string[],
  rowNumber: number,
  sheetName: string
): { row: ImportAdapterResult["rows"][number]; rawData: Record<string, string> } | null {
  const rawData: Record<string, string> = {};
  for (let col = 0; col < headers.length; col++) {
    rawData[headers[col]!] = normalizeHeaderCell(line[col]);
  }

  const mapped: Record<string, string> = {};
  for (const [header, value] of Object.entries(rawData)) {
    const field = CSV_HEADER_MAP[header];
    if (field && value) mapped[field] = value;
  }

  const name = mapped.name?.trim();
  if (!name) return null;

  return {
    rawData,
    row: {
      sourceIndex: rowNumber,
      sourceSheet: sheetName,
      sourceRowNumber: rowNumber,
      rawData,
      appliedAt: mapped.appliedAt ? new Date(mapped.appliedAt) : null,
      name,
      email: mapped.email || null,
      phone: mapped.phone || null,
      age: mapped.age ? Number(mapped.age) : null,
      applicationArea: mapped.applicationArea || null,
    },
  };
}

export class CallLeadGoogleSheetAdapter implements ImportSourceAdapter {
  readonly sourceType = ImportSourceType.GOOGLE_SHEET;

  constructor(private readonly config: CallLeadSheetConfig) {}

  get sourceName(): string {
    return this.config.sourceName;
  }

  async parse(): Promise<ImportAdapterResult> {
    const errors: ImportParseError[] = [];
    const sheet = await fetchSheetWithFormat(
      this.config.spreadsheetId,
      this.config.sheetName
    );

    const layout = resolveCallLeadSheetLayout(sheet.values, this.config);
    const headerIndex = layout.headerRow - 1;

    if (headerIndex >= sheet.values.length) {
      errors.push({ message: `ヘッダー行 ${layout.headerRow} が見つかりません` });
      return { rows: [], errors };
    }

    const headers = (sheet.values[headerIndex] ?? []).map((h, i) => {
      const trimmed = normalizeHeaderCell(h);
      return trimmed.length > 0 ? trimmed : `__col_${i + 1}`;
    });

    if (!headers.some((h) => CSV_HEADER_MAP[h] === "name")) {
      errors.push({ message: "「氏名」または「求職者」列が見つかりません" });
    }

    const rows: ImportAdapterResult["rows"] = [];

    for (let i = layout.dataStartRow - 1; i < sheet.values.length; i++) {
      if (sheet.closedRowIndices.has(i)) continue;

      const line = sheet.values[i];
      if (!line || line.every((cell) => normalizeHeaderCell(cell) === "")) continue;

      const mapped = mapRowToImportRow(headers, line, i + 1, this.config.sheetName);
      if (mapped) rows.push(mapped.row);
    }

    if (rows.length === 0) {
      errors.push({ message: "取込対象のデータ行がありません" });
    }

    return { rows, errors };
  }
}
