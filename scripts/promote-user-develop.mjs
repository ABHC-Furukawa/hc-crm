import { PrismaClient, UserRole } from "@prisma/client";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/promote-user-develop.mjs <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.user.findMany({
    select: { email: true, role: true, name: true, isActive: true },
    orderBy: { email: "asc" },
  });
  console.log("Before:", JSON.stringify(before, null, 2));

  const updated = await prisma.user.update({
    where: { email },
    data: { role: UserRole.DEVELOP },
    select: { email: true, role: true, name: true, isActive: true },
  });

  console.log("Updated:", JSON.stringify(updated, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
