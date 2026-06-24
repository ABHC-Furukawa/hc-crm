/**
 * 開発・検証用 — 2 件目の demo tenant を作成（既存ならスキップ）
 *
 *   node scripts/seed-demo-tenant.mjs
 */
import { PrismaClient } from "@prisma/client";

const DEMO_TENANT_ID = "a0000000-0000-4000-a000-000000000002";
const DEMO_TENANT_SLUG = "demo-org";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.tenant.findUnique({
    where: { slug: DEMO_TENANT_SLUG },
    select: { id: true, name: true, slug: true },
  });

  if (existing) {
    console.log("Demo tenant already exists:", existing);
    return;
  }

  const created = await prisma.tenant.create({
    data: {
      id: DEMO_TENANT_ID,
      name: "デモ組織",
      slug: DEMO_TENANT_SLUG,
    },
    select: { id: true, name: true, slug: true },
  });

  console.log("Created demo tenant:", created);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
