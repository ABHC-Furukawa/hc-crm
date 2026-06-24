import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.activityMetricDaily.count();
  const latest = await prisma.activityMetricDaily.findFirst({
    orderBy: { date: "desc" },
    select: { date: true, computedAt: true, metricType: true, userId: true },
  });

  const sample = await prisma.activityMetricDaily.findMany({
    take: 5,
    orderBy: [{ date: "desc" }, { metricType: "asc" }],
    select: {
      date: true,
      metricType: true,
      userId: true,
      value: true,
    },
  });

  console.log("activity_metrics_daily rows:", count);
  console.log("latest row:", latest);
  console.log("sample:", sample);

  if (count === 0) {
    console.warn("WARN: cache is empty — run npm run kpi:backfill");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
