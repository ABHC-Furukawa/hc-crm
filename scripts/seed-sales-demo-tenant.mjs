/**
 * 営業デモ用テナント（DEVELOP テナント切替専用）
 *
 *   npm run seed:sales-demo
 *
 * KPI 確認: /kpi?scope=team （チーム集計でデモデータが反映されます）
 */
import {
  PrismaClient,
  ActivityAction,
  AssignmentRole,
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
  CandidateStatus,
  CommunicationChannel,
  CommunicationDirection,
  ImportSourceType,
  KpiMetricType,
  GoalPeriodType,
  TaskPriority,
  TaskStatus,
  TenantPlan,
  UserRole,
} from "@prisma/client";

export const SALES_DEMO_TENANT_ID = "a0000000-0000-4000-a000-000000000003";
export const SALES_DEMO_TENANT_SLUG = "sales-demo";
const SOURCE_ID = "sales_demo";
const MARKER = "【sales-demo】";

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    id: "d0000000-0000-4000-a000-000000000001",
    authId: "e0000000-0000-4000-a000-000000000001",
    email: "sales-demo-admin@demo.local",
    lastName: "高橋",
    firstName: "管理",
    name: "高橋 管理",
    role: UserRole.ADMIN,
    managerId: null,
  },
  {
    id: "d0000000-0000-4000-a000-000000000002",
    authId: "e0000000-0000-4000-a000-000000000002",
    email: "sales-demo-manager@demo.local",
    lastName: "山本",
    firstName: "健太",
    name: "山本 健太",
    role: UserRole.MANAGER,
    managerId: null,
  },
  {
    id: "d0000000-0000-4000-a000-000000000003",
    authId: "e0000000-0000-4000-a000-000000000003",
    email: "sales-demo-ca1@demo.local",
    lastName: "伊藤",
    firstName: "美咲",
    name: "伊藤 美咲",
    role: UserRole.ADVISOR,
    managerId: "d0000000-0000-4000-a000-000000000002",
  },
  {
    id: "d0000000-0000-4000-a000-000000000004",
    authId: "e0000000-0000-4000-a000-000000000004",
    email: "sales-demo-ca2@demo.local",
    lastName: "渡辺",
    firstName: "大輔",
    name: "渡辺 大輔",
    role: UserRole.ADVISOR,
    managerId: "d0000000-0000-4000-a000-000000000002",
  },
];

/** 架電リスト用の日本人名プール */
const LEAD_NAMES = [
  "佐藤 健", "田中 花子", "鈴木 一郎", "高橋 裕子", "伊藤 翔太",
  "渡辺 真由", "山本 直樹", "中村 さくら", "小林 大輔", "加藤 美優",
  "吉田 拓海", "山田 恵", "松本 亮", "井上 彩", "木村 慎一",
  "林 麻衣", "斎藤 勇", "清水 奈々", "山口 誠", "阿部 里奈",
  "森 和也", "池田 優花", "橋本 健太", "石川 明美", "前田 凌",
];

const DIRECT_CANDIDATES = [
  { lastName: "岡田", firstName: "浩二", status: CandidateStatus.JOB_PROPOSAL, day: 6 },
  { lastName: "藤田", firstName: "由美", status: CandidateStatus.ENTRY, day: 8 },
  { lastName: "後藤", firstName: "陽介", status: CandidateStatus.INTERVIEW_PREP, day: 10 },
  { lastName: "長谷川", firstName: "愛", status: CandidateStatus.FIRST_INTERVIEW, day: 12 },
  { lastName: "近藤", firstName: "拓也", status: CandidateStatus.FACTORY_TOUR, day: 14 },
  { lastName: "坂本", firstName: "千尋", status: CandidateStatus.OFFER_ACCEPTED, day: 16 },
];

const PIPELINE_STEPS = [
  { from: CandidateStatus.HEARING, to: CandidateStatus.HEARING },
  { from: CandidateStatus.HEARING, to: CandidateStatus.JOB_PROPOSAL },
  { from: CandidateStatus.JOB_PROPOSAL, to: CandidateStatus.ENTRY, fee: 55 },
  { from: CandidateStatus.ENTRY, to: CandidateStatus.INTERVIEW_PREP },
  { from: CandidateStatus.INTERVIEW_PREP, to: CandidateStatus.FIRST_INTERVIEW },
  { from: CandidateStatus.FIRST_INTERVIEW, to: CandidateStatus.FACTORY_TOUR },
  { from: CandidateStatus.FACTORY_TOUR, to: CandidateStatus.OFFER_ACCEPTED, offer: true },
  { from: CandidateStatus.OFFER_ACCEPTED, to: CandidateStatus.JOINED },
];

const KPI_COUNT_METRICS = [
  KpiMetricType.CALL_COUNT,
  KpiMetricType.HEARING_COUNT,
  KpiMetricType.PROPOSAL_COUNT,
  KpiMetricType.INTERVIEW_PREP_COUNT,
  KpiMetricType.OFFER_COUNT,
  KpiMetricType.OFFER_ACCEPTED_COUNT,
  KpiMetricType.ENTRY_COUNT,
  KpiMetricType.INTERVIEW_SET_COUNT,
  KpiMetricType.JOINED_COUNT,
];

const KPI_AMOUNT_METRICS = [
  KpiMetricType.ENTRY_AMOUNT,
  KpiMetricType.INTERVIEW_SET_AMOUNT,
  KpiMetricType.JOINED_AMOUNT,
];

function monthDate(day, hour = 10) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, hour, 0, 0)
  );
}

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function parseName(fullName) {
  const [lastName, ...rest] = fullName.split(/\s+/);
  return { lastName, firstName: rest.join(" ") || "—" };
}

async function ensureTenant() {
  return prisma.tenant.upsert({
    where: { slug: SALES_DEMO_TENANT_SLUG },
    create: {
      id: SALES_DEMO_TENANT_ID,
      name: "営業デモ（DEVELOP専用）",
      slug: SALES_DEMO_TENANT_SLUG,
      plan: TenantPlan.PROFESSIONAL,
    },
    update: {
      name: "営業デモ（DEVELOP専用）",
      plan: TenantPlan.PROFESSIONAL,
    },
    select: { id: true, name: true, slug: true, plan: true },
  });
}

async function ensureDemoUsers(tenantId) {
  for (const spec of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: spec.id },
      create: { ...spec, tenantId, isActive: true, pendingInvite: false },
      update: {
        tenantId,
        name: spec.name,
        lastName: spec.lastName,
        firstName: spec.firstName,
        role: spec.role,
        managerId: spec.managerId,
        isActive: true,
        pendingInvite: false,
      },
    });
  }
  return {
    admin: DEMO_USERS[0],
    manager: DEMO_USERS[1],
    advisor1: DEMO_USERS[2],
    advisor2: DEMO_USERS[3],
  };
}

async function cleanupDemoData(tenantId) {
  const demoLeads = await prisma.callLead.findMany({
    where: { tenantId, sourceId: SOURCE_ID },
    select: { id: true, convertedCandidateId: true },
  });

  const markedCandidates = await prisma.candidate.findMany({
    where: { tenantId, hearingMemo: { contains: MARKER } },
    select: { id: true },
  });

  const candidateIds = [
    ...new Set([
      ...demoLeads.map((r) => r.convertedCandidateId).filter(Boolean),
      ...markedCandidates.map((r) => r.id),
    ]),
  ];

  if (candidateIds.length > 0) {
    await prisma.candidate.deleteMany({ where: { id: { in: candidateIds } } });
  }

  await prisma.callLead.deleteMany({ where: { tenantId, sourceId: SOURCE_ID } });
  await prisma.kpiGoal.deleteMany({ where: { tenantId } });
  await prisma.activityMetricDaily.deleteMany({ where: { tenantId } });
}

async function createStatusActivity({
  candidateId,
  userId,
  from,
  to,
  occurredAt,
}) {
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: to },
  });
  await prisma.activity.create({
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

async function createCandidateBase({
  tenantId,
  advisor,
  lastName,
  firstName,
  phone,
  email,
  age,
  day,
}) {
  const occurredAt = monthDate(day, 9);
  const candidate = await prisma.candidate.create({
    data: {
      tenantId,
      lastName,
      firstName,
      email,
      phone,
      age,
      desiredArea: "愛知県 豊田市",
      desiredSalaryNet: 18 + (age % 5),
      employmentStatus: "EMPLOYED",
      hearingMemo: `${MARKER} 営業デモデータ`,
      source: "JOB_BOARD",
      status: CandidateStatus.HEARING,
      createdById: advisor.id,
      assignments: {
        create: { userId: advisor.id, role: AssignmentRole.PRIMARY },
      },
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
      metadata: { source: SOURCE_ID },
    },
  });

  return candidate;
}

async function runPipelineSteps({
  candidate,
  advisor,
  companyId,
  startDay,
  stepCount,
  feeBase = 50,
}) {
  let jobCaseId = null;

  for (let i = 0; i < stepCount && i < PIPELINE_STEPS.length; i += 1) {
    const step = PIPELINE_STEPS[i];
    const day = Math.min(startDay + i, 28);
    const occurredAt = monthDate(day, 10 + i);

    await createStatusActivity({
      candidateId: candidate.id,
      userId: advisor.id,
      from: step.from,
      to: step.to,
      occurredAt,
    });

    if (step.fee) {
      const jobCase = await prisma.candidateJobCase.create({
        data: {
          candidateId: candidate.id,
          entryJobName: "トヨタ系 組立ライン",
          dispatchCompanyKey: i % 2 === 0 ? "ABHC" : "BREXA_NEXT",
          referralFee: feeBase + (i % 3) * 5,
          interviewPrepAt: monthDate(Math.max(day - 1, 1)),
          interviewAt: monthDate(day),
          factoryTourAt: monthDate(Math.min(day + 1, 28)),
          includeInKpi: true,
        },
      });
      jobCaseId = jobCase.id;
    }

    if (step.offer) {
      await prisma.application.create({
        data: {
          candidateId: candidate.id,
          companyId,
          jobTitle: "製造オペレーター（デモ）",
          status: "OFFER",
          offerAt: occurredAt,
        },
      });
      if (jobCaseId) {
        await prisma.candidateJobCase.update({
          where: { id: jobCaseId },
          data: {
            offerAcceptedAt: monthDate(Math.min(day + 1, 28)),
            scheduledJoinAt: monthDate(Math.min(day + 3, 28)),
          },
        });
      }
    }
  }

  return candidate;
}

async function seedCallLead({
  tenantId,
  advisor,
  name,
  index,
  advisorIndex,
  status,
  convertedCandidateId = null,
  extra = {},
}) {
  const day = 1 + ((advisorIndex * 4 + index) % 22);
  const { lastName, firstName } = parseName(name);
  return prisma.callLead.create({
    data: {
      tenantId,
      name,
      email: `sales-lead-${advisorIndex}-${index}@demo.local`,
      phone: `090-91${advisorIndex}${String(index).padStart(2, "0")}0001`,
      age: 26 + (index % 14),
      applicationArea: index % 3 === 0 ? "愛知県 豊田市" : "三重県 四日市市",
      assignedUserId: advisor.id,
      status,
      callCount: status === CallLeadStatus.BLANK ? 0 : 1 + (index % 3),
      lastCalledAt: status !== CallLeadStatus.BLANK ? monthDate(day, 11) : null,
      nextCallDate:
        status === CallLeadStatus.NO_ANSWER || status === CallLeadStatus.BLANK
          ? monthDate(Math.min(day + 2, 28))
          : null,
      nextCallMemo:
        status === CallLeadStatus.NO_ANSWER ? "午後に再架電" : null,
      sourceType: ImportSourceType.MEDIA,
      sourceName: "営業デモ媒体",
      sourceId: SOURCE_ID,
      importedAt: monthDate(day, 8),
      createdAt: monthDate(day, 8),
      convertedCandidateId,
      ...extra,
    },
  });
}

async function seedAdvisorBundle({
  advisor,
  advisorIndex,
  tenantId,
  companyId,
  nameOffset,
}) {
  const stats = {
    leads: 0,
    calls: 0,
    candidates: 0,
    joined: 0,
  };

  let nameIdx = nameOffset;

  // --- 架電リスト: 多様なステータス ---
  const leadPlan = [
    { count: 4, status: CallLeadStatus.BLANK },
    { count: 3, status: CallLeadStatus.NO_ANSWER },
    { count: 3, status: CallLeadStatus.HEARING },
    { count: 2, status: CallLeadStatus.OUT_OF_SCOPE },
    { count: 1, status: CallLeadStatus.DUPLICATE },
  ];

  for (const { count, status } of leadPlan) {
    for (let i = 0; i < count; i += 1) {
      const lead = await seedCallLead({
        tenantId,
        advisor,
        name: LEAD_NAMES[nameIdx % LEAD_NAMES.length],
        index: nameIdx,
        advisorIndex,
        status,
      });
      stats.leads += 1;
      nameIdx += 1;

      if (status !== CallLeadStatus.BLANK && status !== CallLeadStatus.DUPLICATE) {
        await prisma.callAttempt.create({
          data: {
            callLeadId: lead.id,
            calledById: advisor.id,
            calledAt: monthDate(2 + (nameIdx % 20), 11),
          },
        });
        stats.calls += 1;
      }

      if (status === CallLeadStatus.HEARING) {
        await prisma.callLeadActivity.create({
          data: {
            tenantId,
            callLeadId: lead.id,
            userId: advisor.id,
            action: CallLeadActivityAction.HEARING_COMPLETED,
            entityType: CallLeadEntityType.CALL_LEAD,
            entityId: lead.id,
            occurredAt: monthDate(3 + (nameIdx % 20), 13),
          },
        });
      }
    }
  }

  // --- パイプライン完走 ×3 ---
  for (let i = 0; i < 3; i += 1) {
    const name = LEAD_NAMES[nameIdx % LEAD_NAMES.length];
    nameIdx += 1;
    const { lastName, firstName } = parseName(name);
    const startDay = 4 + i * 5 + advisorIndex;

    const lead = await seedCallLead({
      tenantId,
      advisor,
      name,
      index: 100 + i,
      advisorIndex,
      status: CallLeadStatus.CONVERTED,
    });

    const candidate = await createCandidateBase({
      tenantId,
      advisor,
      lastName,
      firstName,
      phone: lead.phone,
      email: lead.email,
      age: lead.age,
      day: startDay,
    });

    await prisma.callLead.update({
      where: { id: lead.id },
      data: { convertedCandidateId: candidate.id },
    });

    await runPipelineSteps({
      candidate,
      advisor,
      companyId,
      startDay,
      stepCount: PIPELINE_STEPS.length,
      feeBase: 48 + i * 8 + advisorIndex * 3,
    });

    stats.candidates += 1;
    stats.joined += 1;
    stats.calls += 2;
    await prisma.callAttempt.createMany({
      data: [11, 14].map((hour) => ({
        callLeadId: lead.id,
        calledById: advisor.id,
        calledAt: monthDate(startDay, hour),
      })),
    });
  }

  // --- 途中離脱パイプライン ×4 ---
  const partialDepths = [3, 4, 5, 6];
  for (let i = 0; i < partialDepths.length; i += 1) {
    const name = LEAD_NAMES[nameIdx % LEAD_NAMES.length];
    nameIdx += 1;
    const { lastName, firstName } = parseName(name);
    const startDay = 8 + i * 3 + advisorIndex;

    const candidate = await createCandidateBase({
      tenantId,
      advisor,
      lastName,
      firstName,
      phone: `090-92${advisorIndex}${String(i).padStart(2, "0")}0001`,
      email: `sales-partial-${advisorIndex}-${i}@demo.local`,
      age: 30 + i,
      day: startDay,
    });

    await runPipelineSteps({
      candidate,
      advisor,
      companyId,
      startDay,
      stepCount: partialDepths[i],
      feeBase: 42 + i * 6,
    });

    stats.candidates += 1;
    stats.calls += 1;
  }

  // --- 直接登録の求職者 ---
  for (let i = 0; i < DIRECT_CANDIDATES.length; i += 1) {
    const spec = DIRECT_CANDIDATES[(i + advisorIndex) % DIRECT_CANDIDATES.length];
    const candidate = await createCandidateBase({
      tenantId,
      advisor,
      lastName: spec.lastName,
      firstName: `${spec.firstName}${advisorIndex === 1 ? "B" : ""}`,
      phone: `090-93${advisorIndex}${String(i).padStart(2, "0")}0001`,
      email: `sales-direct-${advisorIndex}-${i}@demo.local`,
      age: 32 + i,
      day: spec.day + advisorIndex,
    });

    const targetIndex = PIPELINE_STEPS.findIndex((s) => s.to === spec.status);
    const stepCount = targetIndex >= 0 ? targetIndex + 1 : 2;

    await runPipelineSteps({
      candidate,
      advisor,
      companyId,
      startDay: spec.day + advisorIndex,
      stepCount,
      feeBase: 40 + i * 4,
    });

    stats.candidates += 1;
  }

  // --- 通信・タスク・メモ ---
  const activeCandidates = await prisma.candidate.findMany({
    where: {
      tenantId,
      hearingMemo: { contains: MARKER },
      assignments: { some: { userId: advisor.id, unassignedAt: null } },
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  for (const [i, candidate] of activeCandidates.entries()) {
    await prisma.communication.create({
      data: {
        candidateId: candidate.id,
        userId: advisor.id,
        channel: i % 2 === 0 ? CommunicationChannel.CALL : CommunicationChannel.LINE,
        direction: CommunicationDirection.OUTBOUND,
        subject: i % 2 === 0 ? "架電フォロー" : null,
        body: `${MARKER} デモ連絡 ${i + 1}件目`,
        occurredAt: monthDate(5 + i, 15),
      },
    });

    if (i < 3) {
      await prisma.task.create({
        data: {
          candidateId: candidate.id,
          assignedToId: advisor.id,
          title: ["面接前確認", "書類回収", "工場見学リマインド"][i],
          status: i === 0 ? TaskStatus.TODO : TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          dueAt: monthDate(20 + i, 17),
        },
      });
    }

    if (i === 0) {
      await prisma.note.create({
        data: {
          candidateId: candidate.id,
          authorId: advisor.id,
          content: `${MARKER} 工場見学の候補日を調整中。本人希望は平日午前。`,
          type: "FOLLOW_UP",
          isPinned: true,
        },
      });
    }
  }

  return stats;
}

async function seedKpiGoals(tenantId, users) {
  const periodStart = monthStart();

  const teamTargets = {
    CALL_COUNT: 45,
    HEARING_COUNT: 16,
    PROPOSAL_COUNT: 14,
    INTERVIEW_PREP_COUNT: 10,
    OFFER_COUNT: 8,
    OFFER_ACCEPTED_COUNT: 6,
    ENTRY_COUNT: 12,
    INTERVIEW_SET_COUNT: 10,
    JOINED_COUNT: 5,
    ENTRY_AMOUNT: 280,
    INTERVIEW_SET_AMOUNT: 260,
    JOINED_AMOUNT: 120,
  };

  const advisorTargets = {
    CALL_COUNT: 24,
    HEARING_COUNT: 8,
    PROPOSAL_COUNT: 7,
    INTERVIEW_PREP_COUNT: 5,
    OFFER_COUNT: 4,
    OFFER_ACCEPTED_COUNT: 3,
    ENTRY_COUNT: 6,
    INTERVIEW_SET_COUNT: 5,
    JOINED_COUNT: 3,
    ENTRY_AMOUNT: 150,
    INTERVIEW_SET_AMOUNT: 140,
    JOINED_AMOUNT: 65,
  };

  async function createGoals(userId, targets) {
    for (const metricType of KPI_COUNT_METRICS) {
      await prisma.kpiGoal.create({
        data: {
          tenantId,
          userId,
          metricType,
          periodType: GoalPeriodType.MONTHLY,
          periodStart,
          targetValue: targets[metricType],
        },
      });
    }
    for (const metricType of KPI_AMOUNT_METRICS) {
      await prisma.kpiGoal.create({
        data: {
          tenantId,
          userId,
          metricType,
          periodType: GoalPeriodType.MONTHLY,
          periodStart,
          targetValue: targets[metricType],
        },
      });
    }
  }

  await createGoals(null, teamTargets);
  await createGoals(users.advisor1.id, advisorTargets);
  await createGoals(users.advisor2.id, advisorTargets);
}

async function seedDevelopUserTasks(tenantId, developUserId) {
  if (!developUserId) return;

  const candidate = await prisma.candidate.findFirst({
    where: { tenantId, hearingMemo: { contains: MARKER }, status: CandidateStatus.JOINED },
    orderBy: { updatedAt: "desc" },
  });
  if (!candidate) return;

  await prisma.task.create({
    data: {
      candidateId: candidate.id,
      assignedToId: developUserId,
      title: "デモ: 入社予定者フォロー",
      description: `${MARKER} ダッシュボード未完了タスク確認用`,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueAt: monthDate(26, 16),
    },
  });
}

async function main() {
  const tenant = await ensureTenant();
  console.log("Tenant:", tenant);

  const users = await ensureDemoUsers(tenant.id);
  console.log("Demo users:", users.advisor1.name, users.advisor2.name);

  console.log("Cleaning previous sales demo data…");
  await cleanupDemoData(tenant.id);

  const company = await prisma.company.upsert({
    where: { id: "c0000000-0000-4000-a000-000000000003" },
    create: {
      id: "c0000000-0000-4000-a000-000000000003",
      tenantId: tenant.id,
      name: "デモ製造株式会社",
      industry: "MANUFACTURING",
      status: "ACTIVE",
    },
    update: { tenantId: tenant.id, name: "デモ製造株式会社" },
    select: { id: true },
  });

  const totals = { leads: 0, calls: 0, candidates: 0, joined: 0 };

  for (const [index, advisor] of [users.advisor1, users.advisor2].entries()) {
    console.log(`Seeding ${advisor.name}…`);
    const stats = await seedAdvisorBundle({
      advisor,
      advisorIndex: index,
      tenantId: tenant.id,
      companyId: company.id,
      nameOffset: index * 12,
    });
    totals.leads += stats.leads;
    totals.calls += stats.calls;
    totals.candidates += stats.candidates;
    totals.joined += stats.joined;
    console.log(" ", stats);
  }

  await seedKpiGoals(tenant.id, users);

  const developUser = await prisma.user.findFirst({
    where: { role: UserRole.DEVELOP, isActive: true },
    select: { id: true, email: true },
  });
  if (developUser) {
    await seedDevelopUserTasks(tenant.id, developUser.id);
    console.log("DEVELOP task assigned:", developUser.email);
  }

  const counts = await Promise.all([
    prisma.callLead.count({ where: { tenantId: tenant.id, sourceId: SOURCE_ID } }),
    prisma.candidate.count({ where: { tenantId: tenant.id, hearingMemo: { contains: MARKER } } }),
    prisma.kpiGoal.count({ where: { tenantId: tenant.id } }),
  ]);

  console.log("\n✅ Sales demo tenant ready");
  console.log("   架電リード:", counts[0], "件");
  console.log("   求職者:   ", counts[1], "件");
  console.log("   KPI目標:  ", counts[2], "件（チーム+CA×2）");
  console.log("   入社完走: ", totals.joined, "名（CA合計）");
  console.log("\n   Access: DEVELOP → テナント切替 → 営業デモ（DEVELOP専用）");
  console.log("   KPI:    /kpi?scope=team  （チーム表示推奨）");
  console.log("   個人CA: /kpi?scope=personal&userId=d0000000-0000-4000-a000-000000000003（伊藤）");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
