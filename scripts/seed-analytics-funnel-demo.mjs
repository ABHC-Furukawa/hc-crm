/**
 * ファネル分析用ダミーデータ（当月・担当者分散）
 *
 *   node scripts/seed-analytics-funnel-demo.mjs
 *
 * 担当: admin / 山崎 / 磯部（Default tenant）
 * 再実行時は sourceId=analytics_funnel_demo のデータを削除して作り直す
 */
import {
  PrismaClient,
  ActivityAction,
  AssignmentRole,
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
  CandidateStatus,
  ImportSourceType,
} from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_TENANT_ID = "a0000000-0000-4000-a000-000000000001";
const SOURCE_ID = "analytics_funnel_demo";

const ADVISOR_LOOKUP = [
  { lastName: "admin", roles: ["ADVISOR", "DEVELOP", "ADMIN"] },
  { lastName: "山崎", roles: ["ADVISOR"] },
  { lastName: "磯部", roles: ["ADMIN", "MANAGER", "ADVISOR"] },
];

async function resolveAdvisor(lastName, roles) {
  for (const role of roles) {
    const user = await prisma.user.findFirst({
      where: {
        tenantId: DEFAULT_TENANT_ID,
        lastName,
        role,
        isActive: true,
      },
      select: { id: true, lastName: true, email: true, role: true },
    });
    if (user) return user;
  }
  return null;
}

/** 各担当の当月ファネル件数（応募→入社） */
const STAGE_TARGETS = [
  { applications: 8, calls: 7, hearings: 6, conversions: 5, proposals: 4, interviews: 4, offers: 3, joined: 2 },
  { applications: 6, calls: 5, hearings: 4, conversions: 3, proposals: 3, interviews: 2, offers: 2, joined: 1 },
  { applications: 5, calls: 4, hearings: 3, conversions: 2, proposals: 2, interviews: 2, offers: 1, joined: 1 },
];

function monthDate(day, hour = 10) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return new Date(Date.UTC(year, month, day, hour, 0, 0));
}

async function cleanupDemoData() {
  const demoLeads = await prisma.callLead.findMany({
    where: { tenantId: DEFAULT_TENANT_ID, sourceId: SOURCE_ID },
    select: { id: true, convertedCandidateId: true },
  });

  const candidateIds = demoLeads
    .map((lead) => lead.convertedCandidateId)
    .filter(Boolean);

  if (candidateIds.length > 0) {
    await prisma.candidate.deleteMany({ where: { id: { in: candidateIds } } });
  }

  await prisma.callLead.deleteMany({
    where: { tenantId: DEFAULT_TENANT_ID, sourceId: SOURCE_ID },
  });
}

async function ensureDemoCompany(tenantId) {
  const name = "ファネル検証用工場";
  const existing = await prisma.company.findFirst({
    where: { tenantId, name },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.company.create({
    data: { tenantId, name, industry: "MANUFACTURING", status: "ACTIVE" },
    select: { id: true },
  });
  return created.id;
}

async function createStatusActivity(tx, {
  candidateId,
  userId,
  from,
  to,
  occurredAt,
}) {
  await tx.candidate.update({
    where: { id: candidateId },
    data: { status: to },
  });
  await tx.activity.create({
    data: {
      candidateId,
      userId,
      action: ActivityAction.STATUS_CHANGED,
      entityType: "CANDIDATE",
      entityId: candidateId,
      occurredAt,
      metadata: { from, to },
    },
  });
}

async function seedAdvisorFunnel(advisor, targets, advisorIndex, companyId) {
  const leads = [];

  for (let i = 0; i < targets.applications; i += 1) {
    const day = 1 + ((advisorIndex * 3 + i) % 20);
    const lead = await prisma.callLead.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        name: `デモ${advisor.lastName} ${i + 1}`,
        email: `funnel-${advisorIndex}-${i + 1}@demo.local`,
        phone: `090-81${advisorIndex}${String(i + 1).padStart(2, "0")}0001`,
        age: 25 + (i % 15),
        applicationArea: "愛知県 豊田市",
        assignedUserId: advisor.id,
        status: CallLeadStatus.BLANK,
        sourceType: ImportSourceType.MANUAL,
        sourceName: "ファネル検証",
        sourceId: SOURCE_ID,
        importedAt: monthDate(day, 9),
        createdAt: monthDate(day, 9),
      },
    });
    leads.push(lead);
  }

  for (let i = 0; i < Math.min(targets.calls, leads.length); i += 1) {
    const day = 2 + ((advisorIndex + i) % 20);
    await prisma.callAttempt.create({
      data: {
        callLeadId: leads[i].id,
        calledById: advisor.id,
        calledAt: monthDate(day, 11),
      },
    });
    await prisma.callLead.update({
      where: { id: leads[i].id },
      data: { callCount: { increment: 1 }, lastCalledAt: monthDate(day, 11) },
    });
  }

  for (let i = 0; i < Math.min(targets.hearings, leads.length); i += 1) {
    const day = 3 + ((advisorIndex + i) % 20);
    await prisma.callLeadActivity.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        callLeadId: leads[i].id,
        userId: advisor.id,
        action: CallLeadActivityAction.HEARING_COMPLETED,
        entityType: CallLeadEntityType.CALL_LEAD,
        entityId: leads[i].id,
        occurredAt: monthDate(day, 13),
      },
    });
    await prisma.callLead.update({
      where: { id: leads[i].id },
      data: { status: CallLeadStatus.HEARING },
    });
  }

  const convertedCandidates = [];

  for (let i = 0; i < Math.min(targets.conversions, leads.length); i += 1) {
    const lead = leads[i];
    const day = 4 + ((advisorIndex + i) % 20);
    const occurredAt = monthDate(day, 14);
    const [lastName, ...firstParts] = lead.name.split(/\s+/);
    const firstName = firstParts.join(" ") || "デモ";

    const candidate = await prisma.candidate.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        lastName,
        firstName,
        email: lead.email,
        phone: lead.phone,
        age: lead.age,
        desiredArea: lead.applicationArea,
        hearingMemo: "【funnel-demo】ファネル検証データ",
        source: "OTHER",
        status: CandidateStatus.HEARING,
        createdById: advisor.id,
        assignments: {
          create: { userId: advisor.id, role: AssignmentRole.PRIMARY },
        },
      },
    });

    await prisma.callLead.update({
      where: { id: lead.id },
      data: {
        status: CallLeadStatus.CONVERTED,
        convertedCandidateId: candidate.id,
      },
    });

    await prisma.callLeadActivity.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        callLeadId: lead.id,
        userId: advisor.id,
        action: CallLeadActivityAction.CONVERTED_TO_CANDIDATE,
        entityType: CallLeadEntityType.CANDIDATE,
        entityId: candidate.id,
        occurredAt,
        metadata: { candidateId: candidate.id },
      },
    });

    await prisma.activity.create({
      data: {
        candidateId: candidate.id,
        userId: advisor.id,
        action: ActivityAction.CREATED,
        entityType: "CANDIDATE",
        entityId: candidate.id,
        occurredAt,
        metadata: { source: "funnel_demo_seed" },
      },
    });

    convertedCandidates.push(candidate);
  }

  const statusPlan = [
    { key: "proposals", to: CandidateStatus.JOB_PROPOSAL, from: CandidateStatus.HEARING },
    { key: "interviews", to: CandidateStatus.ENTRY, from: CandidateStatus.JOB_PROPOSAL },
    { key: "offers", to: CandidateStatus.OFFER_ACCEPTED, from: CandidateStatus.FIRST_INTERVIEW },
    { key: "joined", to: CandidateStatus.JOINED, from: CandidateStatus.OFFER_ACCEPTED },
  ];

  for (const step of statusPlan) {
    const count = targets[step.key];
    for (let i = 0; i < Math.min(count, convertedCandidates.length); i += 1) {
      const candidate = convertedCandidates[i];
      const day = 5 + i + (advisorIndex * 2) + statusPlan.indexOf(step);
      const occurredAt = monthDate(Math.min(day, 28), 15 + statusPlan.indexOf(step));

      await createStatusActivity(prisma, {
        candidateId: candidate.id,
        userId: advisor.id,
        from: step.from,
        to: step.to,
        occurredAt,
      });

      if (step.key === "interviews") {
        await createStatusActivity(prisma, {
          candidateId: candidate.id,
          userId: advisor.id,
          from: CandidateStatus.ENTRY,
          to: CandidateStatus.FIRST_INTERVIEW,
          occurredAt: new Date(occurredAt.getTime() + 60 * 60 * 1000),
        });
      }

      if (step.key === "offers") {
        await prisma.application.create({
          data: {
            candidateId: candidate.id,
            companyId,
            jobTitle: `デモ求人 ${advisor.lastName}-${i + 1}`,
            status: "OFFER",
            offerAt: occurredAt,
          },
        });
      }

      if (step.key === "joined") {
        const existingJobCase = await prisma.candidateJobCase.findFirst({
          where: { candidateId: candidate.id },
        });
        const referralFee = 50 + i * 10;
        if (existingJobCase) {
          await prisma.candidateJobCase.update({
            where: { id: existingJobCase.id },
            data: { referralFee },
          });
        } else {
          await prisma.candidateJobCase.create({
            data: {
              candidateId: candidate.id,
              entryJobName: "デモ工場勤務",
              referralFee,
            },
          });
        }
      }
    }
  }

  return {
    advisor: advisor.lastName,
    applications: targets.applications,
    conversions: Math.min(targets.conversions, leads.length),
  };
}

async function main() {
  const advisors = [];
  for (const spec of ADVISOR_LOOKUP) {
    const user = await resolveAdvisor(spec.lastName, spec.roles);
    if (!user) {
      throw new Error(
        `ユーザーが見つかりません: ${spec.lastName} — Default tenant`
      );
    }
    advisors.push(user);
  }

  console.log("Cleanup previous funnel demo data…");
  await cleanupDemoData();

  const companyId = await ensureDemoCompany(DEFAULT_TENANT_ID);
  const results = [];

  for (let i = 0; i < advisors.length; i += 1) {
    console.log(`Seeding funnel data for ${advisors[i].lastName}…`);
    results.push(
      await seedAdvisorFunnel(advisors[i], STAGE_TARGETS[i], i, companyId)
    );
  }

  console.log("Done:", results);
  console.log("Open /analytics (MANAGER+) to verify funnel chart.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
