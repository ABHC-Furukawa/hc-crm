import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
  });
  if (!user) throw new Error("user not found");

  const tenantId = user.tenantId;
  const now = new Date();
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const range = { from: periodStart, to: periodEnd };
  const callLeadBase = {
    tenantId,
    status: { notIn: ["DUPLICATE", "OUT_OF_SCOPE"] },
    assignedUserId: user.id,
  };

  const [
    applications,
    calls,
    hearings,
    conversions,
    proposals,
    interviewSets,
    joined,
  ] = await Promise.all([
    prisma.callLead.count({
      where: {
        ...callLeadBase,
        OR: [
          { importedAt: { gte: range.from, lt: range.to } },
          { importedAt: null, createdAt: { gte: range.from, lt: range.to } },
        ],
      },
    }),
    prisma.callAttempt.count({
      where: {
        calledAt: { gte: range.from, lt: range.to },
        callLead: callLeadBase,
        calledById: user.id,
      },
    }),
    prisma.callLeadActivity.count({
      where: {
        tenantId,
        occurredAt: { gte: range.from, lt: range.to },
        callLead: callLeadBase,
        OR: [
          { action: "HEARING_COMPLETED" },
          {
            action: "STATUS_CHANGED",
            metadata: { path: ["to"], equals: "HEARING" },
          },
        ],
      },
    }),
    prisma.callLeadActivity.count({
      where: {
        tenantId,
        occurredAt: { gte: range.from, lt: range.to },
        callLead: callLeadBase,
        action: "CONVERTED_TO_CANDIDATE",
      },
    }),
    prisma.activity.count({
      where: {
        action: "STATUS_CHANGED",
        entityType: "CANDIDATE",
        occurredAt: { gte: range.from, lt: range.to },
        userId: user.id,
        metadata: { path: ["to"], equals: "JOB_PROPOSAL" },
      },
    }),
    prisma.activity.count({
      where: {
        action: "STATUS_CHANGED",
        entityType: "CANDIDATE",
        occurredAt: { gte: range.from, lt: range.to },
        userId: user.id,
        OR: ["ENTRY", "INTERVIEW_PREP", "FIRST_INTERVIEW"].map((status) => ({
          metadata: { path: ["to"], equals: status },
        })),
      },
    }),
    prisma.activity.count({
      where: {
        action: "STATUS_CHANGED",
        entityType: "CANDIDATE",
        occurredAt: { gte: range.from, lt: range.to },
        userId: user.id,
        metadata: { path: ["to"], equals: "JOINED" },
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        user: user.email,
        period: { from: range.from.toISOString(), to: range.to.toISOString() },
        funnel: {
          applications,
          calls,
          hearings,
          conversions,
          proposals,
          interviewSets,
          joined,
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
