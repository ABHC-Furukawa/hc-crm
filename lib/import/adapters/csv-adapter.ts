import { ImportSourceType } from "@prisma/client";
import { parseCsv, rowsToObjects } from "@/lib/import/csv-parser";
import type {
  ImportAdapterResult,
  ImportParseError,
  ImportSourceAdapter,
} from "@/lib/import/types";
import { CSV_HEADER_MAP } from "@/lib/validators/call-lead-import";

export type CsvImportAdapterOptions = {
  /** CSV テキスト本体 */
  content: string;
  /** ファイル名（ImportLog.sourceName 用） */
  fileName?: string | null;
};

export class CsvImportAdapter implements ImportSourceAdapter {
  readonly sourceType = ImportSourceType.CSV;

  constructor(private readonly options: CsvImportAdapterOptions) {}

  parse(): ImportAdapterResult {
    const errors: ImportParseError[] = [];
    const grid = parseCsv(this.options.content);
    const { objects, errors: headerErrors } = rowsToObjects(grid, CSV_HEADER_MAP);

    for (const message of headerErrors) {
      errors.push({ message });
    }

    if (objects.length === 0 && headerErrors.length === 0) {
      errors.push({ message: "取込対象のデータ行がありません" });
    }

    const rows = objects.map((obj, index) => ({
      sourceIndex: index + 2,
      appliedAt: obj.appliedAt ? new Date(obj.appliedAt) : null,
      name: obj.name ?? "",
      email: obj.email || null,
      phone: obj.phone || null,
      age: obj.age ? Number(obj.age) : null,
      applicationArea: obj.applicationArea || null,
    }));

    return { rows, errors };
  }

  get sourceName(): string | null {
    return this.options.fileName ?? null;
  }
}
