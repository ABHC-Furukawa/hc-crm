/** 先頭10行の非空セル数とキーワード一致を表示 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchSheetValues } from "../lib/jobs/sheets/google-sheets-client";
import { getJobSpreadsheetId } from "../lib/jobs/sheets/company-sheet-config";

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

const KEYWORDS = [
  "紹介",
  "配属",
  "就業",
  "取引",
  "派遣",
  "勤務",
  "給与",
  "雇用",
  "募集",
];

async function inspect(sheetName: string) {
  const id = getJobSpreadsheetId();
  if (!id) throw new Error("no spreadsheet id");
  const grid = await fetchSheetValues(id, sheetName);
  console.log(`\n### ${sheetName} (${grid.length} rows) ###`);
  for (let i = 0; i < Math.min(8, grid.length); i++) {
    const row = grid[i] ?? [];
    const cells = row
      .map((c) => String(c ?? "").trim())
      .filter((c) => c.length > 0);
    const hits = cells.filter((c) => KEYWORDS.some((k) => c.includes(k)));
    console.log(
      `  row ${i + 1}: ${cells.length} cells, keyword hits=${hits.length}`
    );
    if (hits.length >= 3) {
      console.log(`    headers: ${hits.slice(0, 12).join(" | ")}`);
    }
  }
}

async function main() {
  loadEnv();
  const tabs = process.argv.slice(2);
  const targets =
    tabs.length > 0
      ? tabs
      : ["平山", "綜合キャリア", "WIC", "UTエイム", "BREXA Next", "日研", "ns派遣"];
  for (const tab of targets) {
    await inspect(tab);
  }
}

main().catch(console.error);
