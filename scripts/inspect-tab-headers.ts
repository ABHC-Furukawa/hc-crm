import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleSheetAdapter } from "../lib/jobs/import/adapters/google-sheet-adapter";
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
  const keys = process.argv.slice(2);
  if (keys.length === 0) {
    console.error("usage: npx tsx scripts/inspect-tab-headers.ts hirayama ns-haken");
    process.exit(1);
  }

  for (const key of keys) {
    const config = getCompanySheetConfig(key);
    if (!config) {
      console.log(`unknown: ${key}`);
      continue;
    }
    const parsed = await new GoogleSheetAdapter(config).parse();
    const row = parsed.rows[0];
    if (!row) {
      console.log(`${key}: no rows`);
      continue;
    }
    console.log(`\n${config.displayName} headers:`);
    for (const h of Object.keys(row.rawData)) {
      console.log(`  ${h}`);
    }
  }
}

main().catch(console.error);
