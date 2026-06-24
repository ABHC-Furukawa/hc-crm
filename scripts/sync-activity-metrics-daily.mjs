/**
 * ActivityMetricDaily 同期トリガー（本番 API またはローカル dev サーバー経由）
 *
 * 例:
 *   node scripts/sync-activity-metrics-daily.mjs
 *   node scripts/sync-activity-metrics-daily.mjs --days 31
 *   node scripts/sync-activity-metrics-daily.mjs --from 2026-06-01 --to 2026-06-22
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    // .env が無くても CLI 引数 / 環境変数で動作
  }
}

function parseArgs(argv) {
  const options = { days: 1, from: undefined, to: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--days" && argv[i + 1]) {
      options.days = Number(argv[++i]);
    } else if (arg === "--from" && argv[i + 1]) {
      options.from = argv[++i];
    } else if (arg === "--to" && argv[i + 1]) {
      options.to = argv[++i];
    }
  }
  return options;
}

loadEnv();

const args = parseArgs(process.argv.slice(2));
const baseUrl =
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3003";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is not set (.env or environment)");
  process.exit(1);
}

const params = new URLSearchParams();
if (args.from && args.to) {
  params.set("from", args.from);
  params.set("to", args.to);
} else {
  params.set("days", String(args.days));
}

const url = `${baseUrl.replace(/\/$/, "")}/api/cron/activity-metrics-daily?${params}`;
console.log(`POST ${url}`);

const response = await fetch(url, {
  method: "GET",
  headers: { Authorization: `Bearer ${secret}` },
});

const body = await response.text();
let json;
try {
  json = JSON.parse(body);
} catch {
  json = { raw: body };
}

if (!response.ok) {
  console.error("Sync failed:", response.status, json);
  process.exit(1);
}

console.log("Sync complete:", json);
