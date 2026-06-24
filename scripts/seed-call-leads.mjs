import { PrismaClient, CallLeadStatus, ImportSourceType } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_TENANT_ID = "a0000000-0000-4000-a000-000000000001";

const dummies = [
  {
    name: "山田 太郎",
    email: "yamada.dummy@example.com",
    phone: "090-1111-0001",
    age: 28,
    applicationArea: "愛知県 豊田市",
    status: CallLeadStatus.BLANK,
    sourceType: ImportSourceType.CSV,
    sourceName: "dummy_seed.csv",
  },
  {
    name: "佐藤 花子",
    email: "sato.dummy@example.com",
    phone: "080-2222-0002",
    age: 34,
    applicationArea: "三重県 四日市市",
    status: CallLeadStatus.HEARING,
    sourceType: ImportSourceType.CSV,
    sourceName: "dummy_seed.csv",
    callCount: 2,
  },
  {
    name: "鈴木 一郎",
    email: "suzuki.dummy@example.com",
    phone: "070-3333-0003",
    age: 22,
    applicationArea: "岐阜県 各務原市",
    status: CallLeadStatus.NO_ANSWER,
    sourceType: ImportSourceType.MANUAL,
    sourceName: "手動登録",
    callCount: 1,
  },
  {
    name: "田中 次郎",
    email: "tanaka.dup@example.com",
    phone: "090-4444-0004",
    age: 45,
    applicationArea: "愛知県 名古屋市",
    status: CallLeadStatus.DUPLICATE,
    sourceType: ImportSourceType.CSV,
    sourceName: "dummy_seed.csv",
  },
  {
    name: "高橋 三郎",
    email: "takahashi.dummy@example.com",
    phone: "090-5555-0005",
    age: 16,
    applicationArea: "静岡県 浜松市",
    status: CallLeadStatus.OUT_OF_SCOPE,
    sourceType: ImportSourceType.CSV,
    sourceName: "dummy_seed.csv",
  },
];

async function main() {
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error("アクティブなユーザーが見つかりません。先にログインしてユーザーを作成してください。");
  }

  const tenantId = user.tenantId ?? DEFAULT_TENANT_ID;
  const now = new Date();

  const existing = await prisma.callLead.count({
    where: {
      tenantId,
      sourceName: { in: ["dummy_seed.csv", "手動登録"] },
      email: { endsWith: "@example.com" },
    },
  });

  if (existing >= dummies.length) {
    console.log(`ダミー架電リードは既に ${existing} 件存在します。スキップします。`);
    return;
  }

  for (const row of dummies) {
    const duplicate = await prisma.callLead.findFirst({
      where: { tenantId, email: row.email },
    });
    if (duplicate) {
      console.log(`スキップ（既存）: ${row.name}`);
      continue;
    }

    const appliedAt = new Date(now);
    appliedAt.setDate(appliedAt.getDate() - Math.floor(Math.random() * 7));

    const callLead = await prisma.callLead.create({
      data: {
        tenantId,
        assignedUserId: user.id,
        appliedAt,
        importedAt: now,
        name: row.name,
        email: row.email,
        phone: row.phone,
        age: row.age,
        applicationArea: row.applicationArea,
        status: row.status,
        callCount: row.callCount ?? 0,
        sourceType: row.sourceType,
        sourceName: row.sourceName,
      },
    });

    await prisma.callLeadActivity.create({
      data: {
        tenantId,
        callLeadId: callLead.id,
        userId: user.id,
        action: "IMPORTED",
        entityType: "CALL_LEAD",
        entityId: callLead.id,
        metadata: { source: "dummy_seed", status: row.status },
      },
    });

    console.log(`作成: ${row.name} (${row.status})`);
  }

  console.log("ダミー架電リードの投入が完了しました。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
