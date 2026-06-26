/**
 * 案件管理の同期データをすべて削除（jobs / raw_jobs / job_import_logs）
 *
 *   npx tsx scripts/clear-jobs.ts
 *   npx tsx scripts/clear-jobs.ts --company toyowork
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
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

  const args = process.argv.slice(2);
  const companyIdx = args.indexOf("--company");
  const sourceCompany =
    companyIdx >= 0 ? args[companyIdx + 1]?.trim() : undefined;

  const jobWhere = sourceCompany ? { sourceCompany } : {};

  const displayNameForLogs =
    sourceCompany === "toyowork"
      ? "東洋ワーク"
      : (getCompanySheetConfig(sourceCompany ?? "")?.displayName ??
        sourceCompany);

  const before = {
    jobs: await prisma.job.count({ where: jobWhere }),
    rawJobs: await prisma.rawJob.count(
      sourceCompany ? { where: { companyName: sourceCompany } } : undefined
    ),
    logs: await prisma.jobImportLog.count(
      sourceCompany
        ? { where: { companyName: displayNameForLogs } }
        : undefined
    ),
  };

  await prisma.job.deleteMany({ where: jobWhere });
  if (sourceCompany) {
    await prisma.rawJob.deleteMany({ where: { companyName: sourceCompany } });
    await prisma.jobImportLog.deleteMany({
      where: { companyName: displayNameForLogs },
    });
  } else {
    await prisma.rawJob.deleteMany({});
    await prisma.jobImportLog.deleteMany({});
  }

  console.log("Deleted job sync data:");
  console.log(`  jobs:           ${before.jobs}`);
  console.log(`  raw_jobs:       ${before.rawJobs}`);
  console.log(`  import_logs:    ${before.logs}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
