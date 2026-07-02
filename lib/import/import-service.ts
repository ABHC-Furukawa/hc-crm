import type {
  ImportContext,
  ImportServiceResult,
  ImportSourceAdapter,
  ImportSourceMeta,
} from "@/lib/import/types";
import { callLeadImportService } from "@/lib/call-leads/import/call-lead-import-service";

type AdapterWithMeta = ImportSourceAdapter & { sourceName?: string | null };

/** @deprecated 直接 callLeadImportService を使用 */
export class ImportService {
  async import(
    adapter: AdapterWithMeta,
    meta: ImportSourceMeta,
    context: ImportContext
  ): Promise<ImportServiceResult> {
    return callLeadImportService.import(adapter, meta, context);
  }
}

export const importService = new ImportService();
