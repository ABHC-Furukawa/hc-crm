import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { GoogleSheetAdapter } from "../lib/jobs/import/adapters/google-sheet-adapter";
import { createGenericImporter } from "../lib/jobs/importers/generic-company-importer";
import { pickFirstValue } from "../lib/jobs/normalize/utils";
import { COLUMN_ALIASES } from "../lib/jobs/sheet-columns";
import { getCompanySheetConfig } from "../lib/jobs/sheets/company-sheet-config";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnv();

async function main() {
  const prisma = new PrismaClient();
  const jobs = await prisma.job.findMany({
    where: { sourceCompany: "yokota-enterprise" },
    take: 5,
    select: { jobTitle: true, shiftType: true },
  });
  console.log("DB samples:", jobs);

  const config = getCompanySheetConfig("yokota-enterprise")!;
  const parsed = await new GoogleSheetAdapter(config).parse();
  const importer = createGenericImporter(config.companyKey, config.displayName);

  const importable = parsed.rows.find((r) => !importer.shouldSkip(r.rawData));
  if (importable) {
    const raw = importable.rawData;
    console.log("\nAll Yokota headers:", Object.keys(raw).join(" | "));
    console.log("pick shiftType alias:", pickFirstValue(raw, [...COLUMN_ALIASES.shiftType]));
    const n = importer.normalize(raw, {
      companyKey: config.companyKey,
      displayName: config.displayName,
      sheetName: config.sheetName,
      rowNumber: importable.rowNumber,
    });
    console.log("normalized shiftType:", n?.shiftType);
    console.log("normalized jobTitle:", n?.jobTitle);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
