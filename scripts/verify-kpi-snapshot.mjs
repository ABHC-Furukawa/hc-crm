import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENTRY_OR_BEYOND = [
  "ENTRY",
  "INTERVIEW_PREP",
  "FIRST_INTERVIEW",
  "FACTORY_TOUR",
  "OFFER_ACCEPTED",
  "JOINED",
];

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
  });
  if (!user) throw new Error("user not found");

  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const baseWhere = {
    deletedAt: null,
    assignments: {
      some: { userId: user.id, unassignedAt: null },
    },
  };

  const candidates = await prisma.candidate.findMany({
    where: baseWhere,
    select: {
      lastName: true,
      firstName: true,
      status: true,
      jobCase: { select: { referralFee: true } },
    },
  });

  const entryOrBeyond = await prisma.candidate.count({
    where: { ...baseWhere, status: { in: ENTRY_OR_BEYOND } },
  });

  const joined = await prisma.candidate.count({
    where: { ...baseWhere, status: "JOINED" },
  });

  const entryFees = await prisma.candidateJobCase.findMany({
    where: {
      referralFee: { not: null },
      candidate: { ...baseWhere, status: { in: ENTRY_OR_BEYOND } },
    },
    select: { referralFee: true },
  });

  const joinedFees = await prisma.candidateJobCase.findMany({
    where: {
      referralFee: { not: null },
      candidate: { ...baseWhere, status: "JOINED" },
    },
    select: { referralFee: true },
  });

  const sum = (rows) => rows.reduce((s, r) => s + (r.referralFee ?? 0), 0);

  const expectedSnapshot = {
    entryCount: entryOrBeyond,
    interviewSetCount: entryOrBeyond,
    joinedCount: joined,
    entryAmountMan: sum(entryFees),
    interviewSetAmountMan: sum(entryFees),
    joinedAmountMan: sum(joinedFees),
  };

  const [calls, joinedTransitions] = await Promise.all([
    prisma.callAttempt.count({
      where: {
        calledAt: { gte: periodStart, lt: periodEnd },
        calledById: user.id,
      },
    }),
    prisma.activity.count({
      where: {
        action: "STATUS_CHANGED",
        entityType: "CANDIDATE",
        occurredAt: { gte: periodStart, lt: periodEnd },
        userId: user.id,
        metadata: { path: ["to"], equals: "JOINED" },
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        note: "スナップショット: 当月は本日時点 / 過去月は月末時点（Activity 履歴から復元）",
        user: user.email,
        candidates,
        expectedSnapshot,
        transitionSmoke: {
          callCount: calls,
          joinedTransitionCount: joinedTransitions,
        },
        labels: {
          snapshot: "エントリー（スナップ）等 — /kpi 進行中パイプライン",
          daily: "エントリー（遷移）等 — 日次行動量テーブル",
          transition: "架電数・内定数（offerAt）等 — 月次活動実績",
        },
      },
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
