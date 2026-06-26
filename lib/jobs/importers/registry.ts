import type { CompanySheetConfig } from "@/lib/jobs/sheets/company-sheet-config";
import { createGenericImporter } from "@/lib/jobs/importers/generic-company-importer";
import type { CompanyImporter } from "@/lib/jobs/importers/types";

const importerCache = new Map<string, CompanyImporter>();

export function getImporter(companyKey: string): CompanyImporter {
  const cached = importerCache.get(companyKey);
  if (cached) return cached;

  const importer = createGenericImporter(companyKey, companyKey);
  importerCache.set(companyKey, importer);
  return importer;
}

export function registerImporter(importer: CompanyImporter): void {
  importerCache.set(importer.companyKey, importer);
}

export function listImporters(configs: CompanySheetConfig[]): CompanyImporter[] {
  return configs.map((config) => {
    const existing = importerCache.get(config.companyKey);
    if (existing) return existing;

    const importer = createGenericImporter(config.companyKey, config.displayName);
    importerCache.set(config.companyKey, importer);
    return importer;
  });
}

export function getImporterForConfig(config: CompanySheetConfig): CompanyImporter {
  const existing = importerCache.get(config.companyKey);
  if (existing) return existing;

  const importer = createGenericImporter(config.companyKey, config.displayName);
  importerCache.set(config.companyKey, importer);
  return importer;
}
