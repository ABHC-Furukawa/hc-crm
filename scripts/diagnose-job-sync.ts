/**
 * 各タブの取込可否を診断（dev サーバー不要）
 *
 *   npx tsx scripts/diagnose-job-sync.ts
 *   npx tsx scripts/diagnose-job-sync.ts --company yokota-enterprise
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GoogleSheetAdapter } from "../lib/jobs/import/adapters/google-sheet-adapter";
import { createGenericImporter, pickReferralFeeRaw } from "../lib/jobs/importers/generic-company-importer";
import {
  COLUMN_ALIASES,
  REFERRAL_FEE_MIN_YEN,
} from "../lib/jobs/sheet-columns";
import {
  parseReferralFeeYen,
  pickFirstValue,
} from "../lib/jobs/normalize/utils";
import {
  detectHeaderRow,
  normalizeHeaderCell,
} from "../lib/jobs/sheets/detect-header-row";
import { fetchSheetValues } from "../lib/jobs/sheets/google-sheets-client";
import {
  getCompanySheetConfig,
  getCompanySheetConfigs,
} from "../lib/jobs/sheets/company-sheet-config";

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

function parseCompanyKey(argv: string[]): string | undefined {
  const idx = argv.indexOf("--company");
  return idx >= 0 ? argv[idx + 1] : undefined;
}

function parseInspectFlag(argv: string[]): boolean {
  return argv.includes("--inspect");
}

function findReferralLikeHeaders(headers: string[]): string[] {
  return headers.filter((h) =>
    /紹介|手数料|マージン|fee|報酬|成功/i.test(h)
  );
}

async function diagnoseTab(
  config: ReturnType<typeof getCompanySheetConfig>,
  inspect: boolean
) {
  if (!config) return;

  const adapter = new GoogleSheetAdapter(config);
  const parsed = await adapter.parse();
  const importer = createGenericImporter(config.companyKey, config.displayName);

  const headers =
    parsed.rows.length > 0
      ? Object.keys(parsed.rows[0]!.rawData)
      : [];

  let noClient = 0;
  let lowReferral = 0;
  let noReferralCol = 0;
  let wouldImport = 0;
  let failed = 0;
  const referralSamples: string[] = [];
  const lowReferralSamples: string[] = [];

  for (const row of parsed.rows) {
    const raw = row.rawData;
    const referralRaw = pickReferralFeeRaw(raw);
    const referralYen = parseReferralFeeYen(referralRaw);
    const client = pickFirstValue(raw, [...COLUMN_ALIASES.clientCompany]);

    if (!referralRaw) noReferralCol++;
    if (!client?.trim()) {
      noClient++;
      continue;
    }
    if (referralYen == null) {
      lowReferral++;
      if (referralRaw && lowReferralSamples.length < 3) {
        lowReferralSamples.push(`"${referralRaw}" (parse failed)`);
      }
      continue;
    }
    if (referralYen < REFERRAL_FEE_MIN_YEN) {
      lowReferral++;
      if (lowReferralSamples.length < 3) {
        lowReferralSamples.push(`"${referralRaw}" => ${referralYen}円`);
      }
      continue;
    }

    if (importer.shouldSkip(raw)) {
      failed++;
      continue;
    }

    const normalized = importer.normalize(raw, {
      companyKey: config.companyKey,
      displayName: config.displayName,
      sheetName: config.sheetName,
      rowNumber: row.rowNumber,
    });

    if (normalized) {
      wouldImport++;
      if (referralSamples.length < 3) referralSamples.push(referralRaw ?? "");
    } else {
      failed++;
    }
  }

  console.log(`\n=== ${config.displayName} (${config.sheetName}) ===`);
  console.log(`  headerRow=${config.headerRow} rows=${parsed.rows.length}`);
  console.log(`  referral-like headers: ${findReferralLikeHeaders(headers).join(", ") || "(none)"}`);
  if (inspect || wouldImport === 0) {
    console.log(`  all headers: ${headers.slice(0, 30).join(" | ") || "(empty)"}`);
    if (parsed.rows[0]) {
      const sample = parsed.rows[0].rawData;
      const nonEmpty = Object.entries(sample)
        .filter(([, v]) => v?.trim())
        .slice(0, 8)
        .map(([k, v]) => `${k}=${v.slice(0, 40)}`);
      console.log(`  sample row: ${nonEmpty.join(" | ") || "(empty)"}`);
    }
  }
  console.log(`  client-like: ${pickFirstValue(
    parsed.rows[0]?.rawData ?? {},
    [...COLUMN_ALIASES.clientCompany]
  ) ? "found" : "missing"} in sample`);
  console.log(`  would import (>=40万): ${wouldImport}`);
  console.log(`  skip: no client=${noClient}, low/no referral=${lowReferral}, no referral cell=${noReferralCol}`);
  console.log(`  normalize failed: ${failed}`);
  if (referralSamples.length) console.log(`  import samples: ${referralSamples.join(" | ")}`);
  if (lowReferralSamples.length) console.log(`  skipped referral samples: ${lowReferralSamples.join(" | ")}`);
  if (parsed.errors.length) console.log(`  adapter errors: ${parsed.errors.map((e) => e.message).join("; ")}`);

  if (inspect) {
    const grid = await fetchSheetValues(config.spreadsheetId, config.sheetName);
    console.log(`  raw grid rows=${grid.length} detectedHeader=${detectHeaderRow(grid)}`);
    for (let i = 0; i < Math.min(6, grid.length); i++) {
      const cells = (grid[i] ?? [])
        .map((c) => normalizeHeaderCell(c))
        .filter(Boolean)
        .slice(0, 10);
      console.log(`  raw R${i + 1}: ${cells.join(" | ")}`);
    }
    if (config.companyKey === "shinnihon") {
      const headerIdx = 2;
      const row = grid[headerIdx] ?? [];
      console.log(
        `  shinnihon R3 headers: ${row
          .map((c, i) => `${i}:${normalizeHeaderCell(c)}`)
          .filter((s) => s.length > 3)
          .join(" | ")}`
      );
      for (let i = 3; i < Math.min(15, grid.length); i++) {
        const line = (grid[i] ?? []).map((c) => normalizeHeaderCell(c)).join(" | ");
        if (/紹介|万円|Fee/.test(line)) {
          console.log(`  shinnihon R${i + 1} (fee?): ${line.slice(0, 200)}`);
        }
      }
    }
  }
}

async function main() {
  loadEnv();
  const argv = process.argv.slice(2);
  const companyKey = parseCompanyKey(argv);
  const inspect = parseInspectFlag(argv);
  const configs = companyKey
    ? [getCompanySheetConfig(companyKey)].filter(Boolean)
    : getCompanySheetConfigs();

  if (configs.length === 0) {
    console.error("No configs found");
    process.exit(1);
  }

  for (const config of configs) {
    await diagnoseTab(config, inspect);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
