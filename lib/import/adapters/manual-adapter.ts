import { ImportSourceType } from "@prisma/client";
import type {
  CallLeadImportRow,
  ImportAdapterResult,
  ImportSourceAdapter,
} from "@/lib/import/types";

export type ManualImportAdapterOptions = {
  row: CallLeadImportRow;
  sourceName?: string | null;
};

/** 手動 1 件登録用 Adapter */
export class ManualImportAdapter implements ImportSourceAdapter {
  readonly sourceType = ImportSourceType.MANUAL;

  constructor(private readonly options: ManualImportAdapterOptions) {}

  parse(): ImportAdapterResult {
    return {
      rows: [{ ...this.options.row, sourceIndex: 1 }],
      errors: [],
    };
  }

  get sourceName(): string | null {
    return this.options.sourceName ?? null;
  }
}
