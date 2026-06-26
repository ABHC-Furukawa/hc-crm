import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JobImportLogStatus, PrismaClient } from "@prisma/client";

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
  const pending = await prisma.jobImportLog.findMany({
    where: { status: JobImportLogStatus.PENDING },
    orderBy: { importedAt: "desc" },
    take: 10,
  });
  const recent = await prisma.jobImportLog.findMany({
    orderBy: { importedAt: "desc" },
    take: 5,
  });
  const rawCount = await prisma.rawJob.count();
  const jobCount = await prisma.job.count();

  console.log("Pending logs:", pending.length);
  for (const p of pending) {
    console.log(`  ${p.companyName} since ${p.importedAt.toISOString()}`);
  }
  console.log("\nRecent logs:");
  for (const r of recent) {
    console.log(
      `  ${r.importedAt.toISOString()} ${r.companyName} ${r.status} imported=${r.importedCount} success=${r.successCount}`
    );
  }
  console.log(`\nTotal raw_jobs: ${rawCount}, jobs: ${jobCount}`);
  await prisma.$disconnect();
}

main().catch(console.error);
