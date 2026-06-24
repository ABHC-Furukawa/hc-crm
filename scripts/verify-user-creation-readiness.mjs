import { PrismaClient, UserRole } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      isActive: true,
      tenantId: true,
    },
    orderBy: { email: "asc" },
  });

  const managers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOP] },
    },
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });

  const developUsers = users.filter((u) => u.role === UserRole.DEVELOP);
  const adminUsers = users.filter((u) => u.role === UserRole.ADMIN);

  const checks = {
    canAccessUsersPage: developUsers.length + adminUsers.length > 0,
    developCount: developUsers.length,
    adminCount: adminUsers.length,
    managerOptionsForAdvisor: managers.length,
    supabaseUrlConfigured: Boolean(url),
    serviceRoleKeyConfigured: Boolean(serviceRoleKey),
  };

  let supabaseAdminOk = false;
  let supabaseAdminError = null;

  if (url && serviceRoleKey) {
    try {
      const admin = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      supabaseAdminOk = !error && Boolean(data);
      supabaseAdminError = error?.message ?? null;
    } catch (error) {
      supabaseAdminError =
        error instanceof Error ? error.message : "unknown supabase error";
    }
  }

  const blockers = [];
  if (!checks.canAccessUsersPage) {
    blockers.push("DEVELOP または ADMIN ユーザーがいません（/users にアクセス不可）");
  }
  if (!checks.supabaseUrlConfigured || !checks.serviceRoleKeyConfigured) {
    blockers.push("Supabase 管理 API の環境変数が未設定です");
  }
  if (!supabaseAdminOk) {
    blockers.push(
      `Supabase Admin API 接続失敗${supabaseAdminError ? `: ${supabaseAdminError}` : ""}`
    );
  }
  if (checks.managerOptionsForAdvisor === 0) {
    blockers.push("CA 作成用のマネージャー候補が 0 件です");
  }

  console.log(
    JSON.stringify(
      {
        ready: blockers.length === 0,
        checks: {
          ...checks,
          supabaseAdminOk,
        },
        users,
        managers,
        blockers,
        notes: [
          "MANAGER / ADMIN / DEVELOP ロールはマネージャー指定なしで作成可能",
          "ADVISOR（CA）は MANAGER / ADMIN / DEVELOP のいずれかを所属マネージャーに指定が必要",
          "DEVELOP ロールの付与は DEVELOP ユーザーのみ可能",
        ],
      },
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
