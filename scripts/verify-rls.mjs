import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const disabled = await prisma.$queryRaw`
    SELECT table_name, rls_enabled
    FROM public.app_rls_status
    WHERE rls_enabled = false
    ORDER BY table_name
  `;

  const enabledCount = await prisma.$queryRaw`
    SELECT count(*)::int AS cnt
    FROM public.app_rls_status
    WHERE rls_enabled = true
  `;

  const storagePolicies = await prisma.$queryRaw`
    SELECT policyname, cmd, roles::text
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY policyname
  `;

  const anonPublic = await prisma.$queryRaw`
    SELECT count(*)::int AS cnt
    FROM information_schema.role_table_grants
    WHERE grantee = 'anon' AND table_schema = 'public'
  `;

  const policyCount = await prisma.$queryRaw`
    SELECT count(*)::int AS cnt
    FROM pg_policies
    WHERE schemaname = 'public'
  `;

  console.log("RLS disabled tables:", disabled);
  console.log("RLS enabled count:", enabledCount[0].cnt);
  console.log("Storage policies:", storagePolicies);
  console.log("anon grants on public tables:", anonPublic[0].cnt);
  console.log("public policy count:", policyCount[0].cnt);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
