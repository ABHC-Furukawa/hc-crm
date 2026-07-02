/**
 * dev サーバー不要 — Google Sheets → CallLead 一括同期
 *
 *   npx tsx scripts/sync-call-leads.ts
 *   npm run call-leads:sync
 */
import { loadEnv } from "./load-env";
import { syncCallLeads } from "../lib/call-leads/sync-call-leads";

loadEnv();

async function main() {
  const started = Date.now();
  console.log("CallLead Google Sheets sync starting...");

  const result = await syncCallLeads();

  if (!result.configured) {
    console.error(
      "CallLead sync is not configured. Set CALL_LEAD_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON."
    );
    process.exit(1);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  const imp = result.import!;
  console.log(`tenantId: ${result.tenantId}`);
  console.log(`importLogId: ${imp.importLogId}`);
  console.log(
    `imported=${imp.importedCount} created=${imp.createdCount} updated=${imp.updatedCount} duplicate=${imp.duplicateCount} outOfScope=${imp.outOfScopeCount} skipped=${imp.skippedCount} failed=${imp.failedCount}`
  );

  if (imp.syncWindow) {
    console.log(`sync window: ${imp.syncWindow.message}`);
  }

  if (imp.parseErrors.length > 0) {
    console.log("warnings/errors (first 5):");
    for (const e of imp.parseErrors.slice(0, 5)) {
      const row = e.sourceIndex != null ? `${e.sourceIndex}行目: ` : "";
      console.log(`  - ${row}${e.message}`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Done in ${elapsed}s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
