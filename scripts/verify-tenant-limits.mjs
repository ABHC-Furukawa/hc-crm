/**
 * Phase 4d-4 — テナント上限 enforcement 検証
 *
 *   npx tsx scripts/verify-tenant-limits.mjs
 */
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  CallLeadStatus,
  ImportSourceType,
  PrismaClient,
  TenantPlan,
  UserRole,
} from "@prisma/client";
import {
  assertCanCreate,
  enforceAfterCreate,
  isTenantLimitError,
} from "../lib/tenant/enforce-limits.ts";
import {
  countEvictableRecords,
  evictOldestRecords,
} from "../lib/tenant/eviction.ts";
import { countTenantResource } from "../lib/tenant/usage.ts";
import { getTenantPlanLimits } from "../lib/tenant/plan-config.ts";

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
    ["lib/tenant/plan-config.ts", /TENANT_PLAN_CONFIG/],
    ["lib/tenant/enforce-limits.ts", /assertCanCreate/],
    ["lib/tenant/enforce-limits.ts", /enforceAfterCreate/],
    ["lib/tenant/eviction.ts", /evictOldestRecords/],
    ["lib/constants/tenant-eviction.ts", /PROTECTED_CALL_LEAD_STATUSES/],
    ["prisma/schema.prisma", /deletedAt/],
    ["lib/import/import-service.ts", /assertCanCreate/],
  ];

  for (const [file, pattern] of checks) {
    const content = read(file);
    assert(pattern.test(content), `missing pattern in ${file}`);
  }
  console.log("OK: limit enforcement files present");
}

async function createTestTenant(slug, plan) {
  return prisma.tenant.create({
    data: {
      name: `Verify Limits ${slug}`,
      slug,
      plan,
    },
  });
}

async function cleanupTenant(tenantId) {
  await prisma.tenantAuditLog.deleteMany({ where: { tenantId } });
  await prisma.callLead.deleteMany({ where: { tenantId } });
  await prisma.candidate.deleteMany({ where: { tenantId } });
  await prisma.user.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
}

async function createUsers(tenantId, count) {
  for (let i = 0; i < count; i++) {
    await prisma.user.create({
      data: {
        tenantId,
        authId: randomUUID(),
        email: `verify-limits-${tenantId.slice(0, 8)}-${i}@example.invalid`,
        name: `Verify User ${i}`,
        lastName: "Verify",
        firstName: String(i),
        role: UserRole.ADVISOR,
        isActive: true,
      },
    });
  }
}

async function createCallLeadsBatch(tenantId, count, status = CallLeadStatus.BLANK) {
  const chunkSize = 100;
  const baseDate = new Date("2020-01-01T00:00:00.000Z");

  for (let offset = 0; offset < count; offset += chunkSize) {
    const batchCount = Math.min(chunkSize, count - offset);
    await prisma.callLead.createMany({
      data: Array.from({ length: batchCount }, (_, index) => {
        const i = offset + index;
        return {
          tenantId,
          name: `Verify Lead ${i}`,
          status,
          sourceType: ImportSourceType.MANUAL,
          appliedAt: new Date(baseDate.getTime() + i * 60_000),
        };
      }),
    });
  }
}

async function testProtectionAndEvictionOrder() {
  const slug = `verify-limits-evict-${Date.now()}`;
  const tenant = await createTestTenant(slug, TenantPlan.STARTER);

  try {
    const oldest = await prisma.callLead.create({
      data: {
        tenantId: tenant.id,
        name: "Oldest BLANK",
        status: CallLeadStatus.BLANK,
        sourceType: ImportSourceType.MANUAL,
        appliedAt: new Date("2019-06-01T00:00:00.000Z"),
      },
    });
    await prisma.callLead.create({
      data: {
        tenantId: tenant.id,
        name: "Newer BLANK",
        status: CallLeadStatus.BLANK,
        sourceType: ImportSourceType.MANUAL,
        appliedAt: new Date("2020-06-01T00:00:00.000Z"),
      },
    });
    const protectedLead = await prisma.callLead.create({
      data: {
        tenantId: tenant.id,
        name: "Protected HEARING",
        status: CallLeadStatus.HEARING,
        sourceType: ImportSourceType.MANUAL,
        appliedAt: new Date("2018-01-01T00:00:00.000Z"),
      },
    });

    const evictable = await countEvictableRecords(tenant.id, "callLeads");
    assert(evictable === 2, `expected 2 evictable call leads, got ${evictable}`);

    const evictedIds = await evictOldestRecords(tenant.id, "callLeads", 1);
    assert(evictedIds.length === 1, "expected one evicted call lead");
    assert(evictedIds[0] === oldest.id, "oldest BLANK call lead should be evicted");

    const protectedAfter = await prisma.callLead.findUnique({
      where: { id: protectedLead.id },
      select: { deletedAt: true },
    });
    assert(
      protectedAfter?.deletedAt === null,
      "HEARING call lead must not be evicted"
    );

    console.log("OK: protection + eviction order (callLeads)");
  } finally {
    await cleanupTenant(tenant.id);
  }
}

async function testUserBlockPolicy() {
  const slug = `verify-limits-users-${Date.now()}`;
  const tenant = await createTestTenant(slug, TenantPlan.FREE);
  const maxUsers = getTenantPlanLimits(TenantPlan.FREE).users.max;

  try {
    await createUsers(tenant.id, maxUsers);

    let blocked = false;
    try {
      await assertCanCreate(tenant.id, "users");
    } catch (error) {
      blocked =
        isTenantLimitError(error) && error.code === "LIMIT_BLOCKED";
    }
    assert(blocked, "users BLOCK policy should reject at limit");

    console.log("OK: users BLOCK policy");
  } finally {
    await cleanupTenant(tenant.id);
  }
}

async function testCallLeadBlockPolicy() {
  const slug = `verify-limits-block-cl-${Date.now()}`;
  const tenant = await createTestTenant(slug, TenantPlan.FREE);
  const max = getTenantPlanLimits(TenantPlan.FREE).callLeads.max;

  try {
    await createCallLeadsBatch(tenant.id, max);

    const usage = await countTenantResource(tenant.id, "callLeads");
    assert(usage === max, `expected ${max} active call leads, got ${usage}`);

    let blocked = false;
    try {
      await assertCanCreate(tenant.id, "callLeads");
    } catch (error) {
      blocked =
        isTenantLimitError(error) && error.code === "LIMIT_BLOCKED";
    }
    assert(blocked, "callLeads BLOCK policy should reject at limit");

    console.log("OK: callLeads BLOCK policy");
  } finally {
    await cleanupTenant(tenant.id);
  }
}

async function testEvictFallbackBlock() {
  const slug = `verify-limits-fallback-${Date.now()}`;
  const tenant = await createTestTenant(slug, TenantPlan.STARTER);
  const max = getTenantPlanLimits(TenantPlan.STARTER).callLeads.max;

  try {
    await createCallLeadsBatch(tenant.id, max, CallLeadStatus.HEARING);

    const evictable = await countEvictableRecords(tenant.id, "callLeads");
    assert(evictable === 0, "all HEARING call leads should be protected");

    let blocked = false;
    try {
      await assertCanCreate(tenant.id, "callLeads");
    } catch (error) {
      blocked =
        isTenantLimitError(error) && error.code === "EVICT_FALLBACK_BLOCK";
    }
    assert(blocked, "EVICT fallback should block when nothing is evictable");

    console.log("OK: EVICT fallback BLOCK");
  } finally {
    await cleanupTenant(tenant.id);
  }
}

async function testEnforceAfterCreateEvict() {
  const slug = `verify-limits-evict-enf-${Date.now()}`;
  const tenant = await createTestTenant(slug, TenantPlan.STARTER);
  const max = getTenantPlanLimits(TenantPlan.STARTER).callLeads.max;

  try {
    await createCallLeadsBatch(tenant.id, max);

    await prisma.$transaction(async (tx) => {
      await assertCanCreate(tenant.id, "callLeads", { tx });
      await tx.callLead.create({
        data: {
          tenantId: tenant.id,
          name: "Overflow Lead",
          status: CallLeadStatus.BLANK,
          sourceType: ImportSourceType.MANUAL,
          appliedAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      });
      const { evictedIds } = await enforceAfterCreate(tenant.id, "callLeads", {
        tx,
      });
      assert(evictedIds.length === 1, "expected one evicted record after create");
    });

    const active = await countTenantResource(tenant.id, "callLeads");
    assert(active === max, `active call leads should remain at max (${max})`);

    const evictedCount = await prisma.callLead.count({
      where: { tenantId: tenant.id, deletedAt: { not: null } },
    });
    assert(evictedCount >= 1, "at least one call lead should be soft-deleted");

    console.log("OK: enforceAfterCreate EVICT_OLDEST");
  } finally {
    await cleanupTenant(tenant.id);
  }
}

async function main() {
  checkFiles();
  await testProtectionAndEvictionOrder();
  await testUserBlockPolicy();
  await testCallLeadBlockPolicy();
  await testEvictFallbackBlock();
  await testEnforceAfterCreateEvict();
  console.log("OK: Phase 4d tenant limits verification passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
