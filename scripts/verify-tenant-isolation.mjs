/**
 * Phase 4a — テナント分離検証
 *
 *   node scripts/verify-tenant-isolation.mjs
 *   node scripts/seed-demo-tenant.mjs   # 2 件目 tenant（任意）
 */
import { PrismaClient, UserRole } from "@prisma/client";

const DEFAULT_TENANT_ID = "a0000000-0000-4000-a000-000000000001";
const DEMO_TENANT_ID = "a0000000-0000-4000-a000-000000000002";

const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, name: true, slug: true },
  });
  console.log("Tenants:", tenants);

  const tenantIds = new Set(tenants.map((tenant) => tenant.id));

  const candidates = await prisma.candidate.findMany({
    select: { tenantId: true },
  });
  for (const row of candidates) {
    assert(tenantIds.has(row.tenantId), `invalid candidate tenant_id: ${row.tenantId}`);
  }

  const companies = await prisma.company.findMany({
    select: { tenantId: true },
  });
  for (const row of companies) {
    assert(tenantIds.has(row.tenantId), `invalid company tenant_id: ${row.tenantId}`);
  }

  const tags = await prisma.tag.findMany({
    select: { tenantId: true },
  });
  for (const row of tags) {
    assert(tenantIds.has(row.tenantId), `invalid tag tenant_id: ${row.tenantId}`);
  }

  const users = await prisma.user.findMany({
    select: { tenantId: true },
  });
  for (const row of users) {
    assert(tenantIds.has(row.tenantId), `invalid user tenant_id: ${row.tenantId}`);
  }

  const defaultCandidates = await prisma.candidate.count({
    where: { tenantId: DEFAULT_TENANT_ID, deletedAt: null },
  });
  console.log(`Default tenant candidates: ${defaultCandidates}`);

  const demoTenant = tenants.find((tenant) => tenant.id === DEMO_TENANT_ID);
  if (demoTenant) {
    const demoCandidates = await prisma.candidate.count({
      where: { tenantId: DEMO_TENANT_ID, deletedAt: null },
    });
    console.log(`Demo tenant candidates: ${demoCandidates}`);

    const crossTenantAssignments = await prisma.candidateAssignment.count({
      where: {
        unassignedAt: null,
        candidate: { tenantId: DEFAULT_TENANT_ID },
        user: { tenantId: DEMO_TENANT_ID },
      },
    });
    assert(
      crossTenantAssignments === 0,
      "cross-tenant candidate assignments detected"
    );
  } else {
    console.log("NOTE: demo tenant not found — run node scripts/seed-demo-tenant.mjs");
  }

  const advisor = await prisma.user.findFirst({
    where: {
      role: UserRole.ADVISOR,
      isActive: true,
      tenantId: DEFAULT_TENANT_ID,
    },
    select: { id: true, email: true, tenantId: true },
  });

  if (advisor) {
    const visible = await prisma.candidate.count({
      where: {
        tenantId: advisor.tenantId,
        deletedAt: null,
        assignments: {
          some: { userId: advisor.id, unassignedAt: null },
        },
      },
    });
    console.log(`ADVISOR ${advisor.email} visible candidates: ${visible}`);
  }

  console.log("OK: Phase 4a tenant isolation checks passed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
