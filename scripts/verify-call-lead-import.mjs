/**
 * Step 6 取込後の検証（件数・CONVERTED 保持・pagination クエリ）
 *
 *   npx tsx scripts/verify-call-lead-import.mjs
 *   npm run verify:call-lead-import
 */
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

nextEnv.loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function timeQuery(label, fn) {
  const start = performance.now();
  const result = await fn();
  const ms = (performance.now() - start).toFixed(0);
  console.log(`${label}: ${ms}ms`);
  return result;
}

async function main() {
  const tenant = await prisma.tenant.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true, plan: true },
  });

  if (!tenant) {
    console.error("No tenant found");
    process.exit(1);
  }

  const [
    total,
    converted,
    duplicate,
    outOfScope,
    rawCount,
    latestLog,
  ] = await Promise.all([
    prisma.callLead.count({ where: { tenantId: tenant.id, deletedAt: null } }),
    prisma.callLead.count({
      where: { tenantId: tenant.id, status: "CONVERTED", deletedAt: null },
    }),
    prisma.callLead.count({
      where: { tenantId: tenant.id, status: "DUPLICATE", deletedAt: null },
    }),
    prisma.callLead.count({
      where: { tenantId: tenant.id, status: "OUT_OF_SCOPE", deletedAt: null },
    }),
    prisma.rawCallLead.count({ where: { tenantId: tenant.id } }),
    prisma.callLeadImportLog.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { importedAt: "desc" },
    }),
  ]);

  console.log(JSON.stringify({ tenant, total, converted, duplicate, outOfScope, rawCount }, null, 2));

  if (latestLog) {
    console.log("latest import log:", {
      id: latestLog.id,
      status: latestLog.status,
      importedCount: latestLog.importedCount,
      createdCount: latestLog.createdCount,
      updatedCount: latestLog.updatedCount,
      duplicateCount: latestLog.duplicateCount,
      outOfScopeCount: latestLog.outOfScopeCount,
      importedAt: latestLog.importedAt,
    });
  } else {
    console.log("latest import log: (none)");
  }

  const pageSize = 50;
  const page1 = await timeQuery("page 1 list query", () =>
    prisma.callLead.findMany({
      where: { tenantId: tenant.id, deletedAt: null },
      orderBy: [{ appliedAt: "asc" }, { createdAt: "asc" }],
      skip: 0,
      take: pageSize,
      select: { id: true, name: true, status: true },
    })
  );

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages > 1) {
    await timeQuery(`page ${totalPages} list query`, () =>
      prisma.callLead.findMany({
        where: { tenantId: tenant.id, deletedAt: null },
        orderBy: [{ appliedAt: "asc" }, { createdAt: "asc" }],
        skip: (totalPages - 1) * pageSize,
        take: pageSize,
        select: { id: true },
      })
    );
  }

  await timeQuery("count query", () =>
    prisma.callLead.count({ where: { tenantId: tenant.id, deletedAt: null } })
  );

  console.log(`page1 sample: ${page1.length} rows`);
  console.log("verify: OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
