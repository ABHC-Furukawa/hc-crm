/**
 * 架電リスト Sheets の接続・ヘッダー・行数を確認（取込前の preflight）
 *
 *   npx tsx scripts/inspect-call-lead-sheet.ts
 *   npm run call-leads:inspect
 */
import { CallLeadGoogleSheetAdapter } from "../lib/call-leads/import/adapters/google-sheet-adapter";
import {
  getCallLeadSheetConfig,
  isCallLeadSheetSyncConfigured,
} from "../lib/call-leads/import/sheet-config";
import {
  applyGoogleSheetSyncWindow,
  countSyncedFromSheet,
  formatSyncWindowSummary,
  getCallLeadSyncInitialLimit,
  getMaxSyncedRowNumber,
  isCallLeadFullSyncMode,
} from "../lib/call-leads/import/sync-window";
import { getDefaultTenantId } from "../lib/tenant/context";
import { loadEnv } from "./load-env";

loadEnv();

async function main() {
  if (!isCallLeadSheetSyncConfigured()) {
    console.error(
      "Not configured. Set CALL_LEAD_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON."
    );
    process.exit(1);
  }

  const config = getCallLeadSheetConfig()!;
  console.log(`spreadsheetId: ${config.spreadsheetId}`);
  console.log(`sheetName: ${config.sheetName}`);
  console.log(
    `sync mode: ${isCallLeadFullSyncMode() ? "full (全件)" : `incremental (初回 ${getCallLeadSyncInitialLimit()} 件)`}`
  );

  const adapter = new CallLeadGoogleSheetAdapter(config);
  const parsed = await adapter.parse();

  if (parsed.errors.length > 0) {
    for (const e of parsed.errors) console.log(`parse error: ${e.message}`);
  }

  console.log(`parseable rows (氏名あり): ${parsed.rows.length}`);

  const tenantId = await getDefaultTenantId();
  const [maxSynced, syncedCount, selection] = await Promise.all([
    getMaxSyncedRowNumber(tenantId, config.sourceName, config.sheetName),
    countSyncedFromSheet(tenantId, config.sourceName, config.sheetName),
    applyGoogleSheetSyncWindow(
      tenantId,
      config.sourceName,
      config.sheetName,
      parsed.rows
    ),
  ]);

  console.log(`DB synced from sheet: ${syncedCount} rows (max row ${maxSynced ?? "none"})`);
  console.log(`next sync: ${formatSyncWindowSummary(selection)}`);
  console.log(`would import now: ${selection.rows.length} rows`);

  if (parsed.rows.length === 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
