/**
 * dev サーバー不要 — Prisma 直呼びで ActivityMetricDaily を同期
 *
 *   npx tsx scripts/backfill-activity-metrics-daily.ts
 *   npx tsx scripts/backfill-activity-metrics-daily.ts --days 31
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseSyncRangeFromRequest,
  syncActivityMetricsDaily,
} from "../lib/kpi/sync-activity-metrics-daily";

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

function parseArgs(argv: string[]) {
  const options: { days?: number; from?: string; to?: string } = {};
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const range = parseSyncRangeFromRequest(args);

  console.log(
    `Backfill ${range.from.toISOString().slice(0, 10)} .. ${range.to.toISOString().slice(0, 10)}`
  );

  const result = await syncActivityMetricsDaily({
    from: range.from,
    to: range.to,
  });

  console.log("Backfill complete:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
