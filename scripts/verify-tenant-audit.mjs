/**
 * Phase 4d-4 — テナント監査ログ検証
 *
 *   npx tsx scripts/verify-tenant-audit.mjs
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  PrismaClient,
  TenantAuditAction,
  TenantPlan,
  UserRole,
} from "@prisma/client";
import {
  formatTenantAuditSummary,
  logLimitBlocked,
  logPlanChanged,
  logRecordEvicted,
  logUserInvited,
  TENANT_AUDIT_ACTION_LABELS,
} from "../lib/tenant/audit.ts";

const prisma = new PrismaClient();
const root = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function checkFiles() {
  const checks = [
    ["prisma/schema.prisma", /model TenantAuditLog/],
    ["prisma/schema.prisma", /enum TenantAuditAction/],
    ["lib/tenant/audit.ts", /writeTenantAuditLog/],
    ["lib/tenant/enforce-limits.ts", /logLimitBlocked/],
    ["lib/tenant/enforce-limits.ts", /logRecordEvicted/],
    ["lib/actions/tenant.ts", /logPlanChanged/],
    ["lib/users/invite.ts", /logUserInvited/],
    ["lib/auth/rbac.ts", /canViewTenantAuditLogs/],
    ["lib/tenant/queries.ts", /canViewTenantAuditLogs/],
    ["app/(dashboard)/settings/tenants/[id]/page.tsx", /TenantAuditLogTable/],
  ];

  for (const [file, pattern] of checks) {
    const content = read(file);
    assert(pattern.test(content), `missing pattern in ${file}`);
  }

  for (const action of Object.values(TenantAuditAction)) {
    assert(
      TENANT_AUDIT_ACTION_LABELS[action],
      `missing audit label for ${action}`
    );
  }

  console.log("OK: audit log files and RBAC hooks present");
}

async function checkSchema() {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_audit_logs'
  `;
  assert(Array.isArray(tables) && tables.length === 1, "tenant_audit_logs table missing");

  const enumRows = await prisma.$queryRaw`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'TenantAuditAction'
    ORDER BY e.enumsortorder
  `;
  const labels = enumRows.map((row) => row.enumlabel);
  for (const action of Object.values(TenantAuditAction)) {
    assert(labels.includes(action), `TenantAuditAction.${action} missing in DB`);
  }

  console.log("OK: tenant audit schema present");
}

async function testAuditWrites() {
  const slug = `verify-audit-${Date.now()}`;
  const tenant = await prisma.tenant.create({
    data: {
      name: "Verify Audit Tenant",
      slug,
      plan: TenantPlan.FREE,
    },
  });

  const actor = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      authId: randomUUID(),
      email: `verify-audit-actor-${Date.now()}@example.invalid`,
      name: "Audit Actor",
      lastName: "Audit",
      firstName: "Actor",
      role: UserRole.DEVELOP,
      isActive: true,
    },
  });

  try {
    await logLimitBlocked({
      tenantId: tenant.id,
      resource: "callLeads",
      usage: 100,
      max: 100,
      actorUserId: actor.id,
    });

    await logRecordEvicted({
      tenantId: tenant.id,
      resource: "callLeads",
      evictedIds: [randomUUID()],
      actorUserId: actor.id,
    });

    await logPlanChanged({
      tenantId: tenant.id,
      fromPlan: TenantPlan.FREE,
      toPlan: TenantPlan.STARTER,
      actorUserId: actor.id,
    });

    await logUserInvited({
      tenantId: tenant.id,
      email: "invited@example.invalid",
      role: UserRole.ADMIN,
      userId: randomUUID(),
      actorUserId: actor.id,
    });

    const logs = await prisma.tenantAuditLog.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "asc" },
      include: {
        actor: { select: { id: true, name: true } },
      },
    });

    assert(logs.length === 4, `expected 4 audit logs, got ${logs.length}`);

    const actions = logs.map((log) => log.action);
    assert(actions.includes(TenantAuditAction.LIMIT_BLOCKED));
    assert(actions.includes(TenantAuditAction.RECORD_EVICTED));
    assert(actions.includes(TenantAuditAction.PLAN_CHANGED));
    assert(actions.includes(TenantAuditAction.USER_INVITED));

    for (const log of logs) {
      assert(log.actor?.id === actor.id, "audit actor should be recorded");
      const summary = formatTenantAuditSummary(log.action, log.metadata);
      assert(summary.length > 0, `empty summary for ${log.action}`);
    }

    const blockedSummary = formatTenantAuditSummary(
      TenantAuditAction.LIMIT_BLOCKED,
      { resource: "callLeads", usage: 100, max: 100 }
    );
    assert(blockedSummary.includes("架電リスト"), blockedSummary);

    console.log("OK: audit log write + format");
  } finally {
    await prisma.tenantAuditLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  }
}

async function main() {
  checkFiles();
  await checkSchema();
  await testAuditWrites();
  console.log("OK: Phase 4d tenant audit verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
