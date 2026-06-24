import { PrismaClient, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const testEmail = `verify-user-${Date.now()}@example.com`;
const testPassword = "TestPass123!";
const prisma = new PrismaClient();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin env missing");
  }

  const developUser = await prisma.user.findFirst({
    where: { role: UserRole.DEVELOP, isActive: true },
  });
  if (!developUser) {
    throw new Error("No DEVELOP user found");
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: "Verify User", lastName: "Verify", firstName: "User" },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Supabase createUser failed");
  }

  let prismaUserId = null;
  try {
    const created = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email: testEmail,
        name: "Verify User",
        lastName: "Verify",
        firstName: "User",
        tenantId: developUser.tenantId,
        role: UserRole.MANAGER,
      },
    });
    prismaUserId = created.id;
  } catch (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    throw error;
  }

  await prisma.user.delete({ where: { id: prismaUserId } });
  await admin.auth.admin.deleteUser(authData.user.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        message: "Test user created and cleaned up successfully",
        testEmail,
        actorTenant: developUser.email,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ ok: false, error: String(error) }, null, 2));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
