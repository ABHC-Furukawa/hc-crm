/**
 * タブのヘッダー・先頭行を表示
 *   npx tsx scripts/inspect-job-sheet.ts --company shinnihon
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  detectHeaderRow,
  normalizeHeaderCell,
} from "../lib/jobs/sheets/detect-header-row";
import { fetchSheetValues } from "../lib/jobs/sheets/google-sheets-client";
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

async function main() {
  loadEnv();
  const idx = process.argv.indexOf("--company");
  const companyKey = idx >= 0 ? process.argv[idx + 1] : "shinnihon";
  const config = getCompanySheetConfig(companyKey ?? "shinnihon");
  if (!config) {
    console.error("Config not found");
    process.exit(1);
  }

  const grid = await fetchSheetValues(config.spreadsheetId, config.sheetName);
  console.log(`\n=== ${config.displayName} (${grid.length} rows) ===`);
  console.log(`detected headerRow=${detectHeaderRow(grid)}`);

  for (let i = 0; i < Math.min(10, grid.length); i++) {
    const cells = (grid[i] ?? [])
      .map((c) => normalizeHeaderCell(c))
      .filter(Boolean);
    console.log(`R${i + 1}: ${cells.slice(0, 15).join(" | ")}`);
  }

  const hr = detectHeaderRow(grid) - 1;
  const headers = (grid[hr] ?? []).map(
    (h, i) => normalizeHeaderCell(h) || `__col_${i + 1}`
  );
  console.log(`\nHEADERS (${headers.length}):`);
  console.log(headers.join(" | "));

  for (let i = hr + 1; i < Math.min(hr + 6, grid.length); i++) {
    const row = grid[i] ?? [];
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => {
      const v = normalizeHeaderCell(row[j]);
      if (v) obj[h] = v;
    });
    console.log(`\nDATA R${i + 1}:`);
    console.log(JSON.stringify(obj, null, 2).slice(0, 800));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
