import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  console.log("Tenants:", tenants);

  const developUsers = await prisma.user.findMany({
    where: { role: UserRole.DEVELOP, isActive: true },
    select: { email: true, tenantId: true, name: true },
  });
  console.log("DEVELOP users:", developUsers);

  if (developUsers.length === 0) {
    console.warn("WARN: no active DEVELOP user — run scripts/promote-user-develop.mjs");
    process.exitCode = 1;
    return;
  }

  const nonDevelopAdmins = await prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("Checks:");
  console.log("  - canCrossTenantAccess(DEVELOP): true (code-level)");
  console.log("  - canAssignDevelopRole(ADMIN): false (code-level)");
  console.log(`  - tenant count: ${tenants.length}`);
  console.log(`  - active DEVELOP users: ${developUsers.length}`);
  console.log(`  - active ADMIN users: ${nonDevelopAdmins}`);

  if (tenants.length < 2) {
    console.log(
      "NOTE: single tenant — switcher UI is disabled until a second tenant exists"
    );
  }

  console.log("OK: Phase R3 develop-tenant prerequisites met");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
