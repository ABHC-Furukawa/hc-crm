/**
 * Phase 2.5 Step 7 — 回帰スモーク（DB クエリ + ルート存在確認用）
 * Usage: node scripts/regression-step7.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function candidateAccessFilter(user) {
  const tenantFilter = user.tenantId ? { tenantId: user.tenantId } : {};

  if (user.role === "ADMIN" || user.role === "MANAGER" || user.role === "DEVELOP") {
    return { AND: [tenantFilter, { deletedAt: null }] };
  }
  return {
    AND: [
      tenantFilter,
      {
        deletedAt: null,
        assignments: {
          some: { userId: user.id, unassignedAt: null },
        },
      },
    ],
  };
}

async function regressionForUser(user) {
  const baseWhere = candidateAccessFilter(user);
  const tenantId = user.tenantId;

  const [candidateCount, communicationCount, callLeadCount, openTasks] =
    await Promise.all([
      prisma.candidate.count({ where: baseWhere }),
      prisma.communication.count({
        where: { candidate: baseWhere },
        take: 200,
      }),
      tenantId
        ? prisma.callLead.count({ where: { tenantId, deletedAt: null } })
        : Promise.resolve(0),
      prisma.task.count({
        where: {
          status: { in: ["TODO", "IN_PROGRESS"] },
          assignedToId: user.id,
          candidate: baseWhere,
        },
      }),
    ]);

  return {
    email: user.email,
    role: user.role,
    candidateCount,
    communicationCount,
    callLeadCount,
    openTasks,
  };
}

async function main() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  if (users.length === 0) {
    throw new Error("アクティブユーザーが見つかりません");
  }

  const results = [];
  for (const user of users) {
    results.push(await regressionForUser(user));
  }

  const tenants = await prisma.tenant.count();
  const totalCandidates = await prisma.candidate.count({
    where: { deletedAt: null },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        tenants,
        totalCandidates,
        users: results,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ ok: false, error: String(e.message ?? e) }));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
