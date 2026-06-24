import { PrismaClient, KpiMetricType, GoalPeriodType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "MANAGER", "DEVELOP"] }, isActive: true },
  });
  if (!user) {
    console.log(JSON.stringify({ skipped: true, reason: "no manager+ user" }));
    return;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1));
  const periodEnd = new Date(Date.UTC(year, month + 1, 1));

  const goal = await prisma.kpiGoal.findFirst({
    where: {
      tenantId: user.tenantId,
      userId: null,
      metricType: KpiMetricType.JOINED_AMOUNT,
      periodType: GoalPeriodType.MONTHLY,
      periodStart,
    },
  });

  const joinedActivities = await prisma.activity.findMany({
    where: {
      action: "STATUS_CHANGED",
      entityType: "CANDIDATE",
      occurredAt: { gte: periodStart, lt: now },
      userId: user.id,
      metadata: { path: ["to"], equals: "JOINED" },
    },
    select: { candidateId: true },
  });

  const candidateIds = [...new Set(joinedActivities.map((a) => a.candidateId))];
  let salesActual = 0;
  if (candidateIds.length > 0) {
    const jobCases = await prisma.candidateJobCase.findMany({
      where: {
        candidateId: { in: candidateIds },
        referralFee: { not: null },
      },
      select: { referralFee: true },
    });
    salesActual = jobCases.reduce((sum, row) => sum + (row.referralFee ?? 0), 0);
  }

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const today = now.getUTCDate();
  const linearForecast =
    today > 0 && today < daysInMonth
      ? (salesActual / today) * daysInMonth
      : salesActual;
  const forecast = Math.round(linearForecast / 10) * 10;

  console.log(
    JSON.stringify(
      {
        user: user.email,
        role: user.role,
        executive: {
          salesTarget: goal ? Number(goal.targetValue) : 0,
          salesActual,
          achievementRate:
            goal && Number(goal.targetValue) > 0
              ? Math.round((salesActual / Number(goal.targetValue)) * 100)
              : null,
          monthEndForecast: forecast,
          monthEndForecastLinear: Math.round(linearForecast),
          forecastUnit: "十万円（10万円刻み）",
          elapsedDays: today,
          daysInMonth,
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
