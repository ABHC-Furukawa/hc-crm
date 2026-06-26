/**
 * dev サーバー不要 — Google Sheets → Job 同期
 *
 *   npx tsx scripts/sync-jobs.ts
 *   npx tsx scripts/sync-jobs.ts --company wt
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { syncJobs } from "../lib/jobs/sync-jobs";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  try {
    const raw = readFileSync(envPath, "utf8");
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

function parseCompanyKey(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--company" && argv[i + 1]) {
      return argv[++i];
    }
  }
  return undefined;
}

loadEnv();

async function main() {
  const companyKey = parseCompanyKey(process.argv.slice(2));
  console.log(companyKey ? `Sync company: ${companyKey}` : "Sync all companies");

  const result = await syncJobs({ companyKey });

  if (!result.configured) {
    console.error("Job sync is not configured (JOB_SPREADSHEET_ID / GOOGLE_SERVICE_ACCOUNT_JSON)");
    process.exit(1);
  }

  for (const r of result.results) {
    console.log(
      `${r.displayName}: imported=${r.importedCount} success=${r.successCount} failed=${r.failedCount} closed=${r.skippedClosedCount ?? 0} removed=${r.removedCount ?? 0}`
    );
    if (r.errors.length > 0) {
      for (const e of r.errors.slice(0, 3)) {
        console.log(`  - ${e.rowNumber ?? "?"}行目: ${e.message}`);
      }
    }
  }

  const totalSuccess = result.results.reduce((s, r) => s + r.successCount, 0);
  console.log(`Done: ${result.companies} tabs, ${totalSuccess} jobs synced`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
