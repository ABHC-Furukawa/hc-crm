import { PrismaClient, CallLeadStatus, ImportSourceType } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_TENANT_ID = "a0000000-0000-4000-a000-000000000001";
const BATCH_TAG = "dummy_batch_30";
const SOURCE_NAME = "dummy_batch_30.csv";

const AREAS = [
  "愛知県 豊田市",
  "愛知県 名古屋市",
  "三重県 四日市市",
  "岐阜県 各務原市",
  "静岡県 浜松市",
  "愛知県 刈谷市",
  "三重県 鈴鹿市",
  "岐阜県 大垣市",
  "愛知県 岡崎市",
  "静岡県 富士市",
];

const FIRST_NAMES = [
  "太郎", "花子", "一郎", "美咲", "健太", "由美", "大輔", "真由", "翔太", "愛",
  "拓也", "恵", "直樹", "さくら", "和也", "麻衣", "亮", "優子", "诚", "奈々",
];

const LAST_NAMES = [
  "山田", "佐藤", "鈴木", "田中", "高橋", "伊藤", "渡辺", "中村", "小林", "加藤",
  "吉田", "山本", "松本", "井上", "木村", "林", "斎藤", "清水", "山口", "阿部",
];

const NOTE_SAMPLES = [
  "初回架電予定。午前中希望。",
  "製造経験あり。即日勤務可。",
  "前回不通。夕方再架電。",
  "工場勤務希望。転居予定なし。",
  "LINE連絡希望だが架電優先。",
  null,
  null,
  null,
];

function pick(arr, i) {
  return arr[i % arr.length];
}

/** 30件分の定義（重複ペア2組含む） */
function buildRecords() {
  const records = [];

  for (let i = 1; i <= 26; i++) {
    const lastName = pick(LAST_NAMES, i);
    const firstName = pick(FIRST_NAMES, i + 3);
    const age = 18 + (i % 37);
    const status =
      i % 7 === 0
        ? CallLeadStatus.NO_ANSWER
        : i % 5 === 0
          ? CallLeadStatus.HEARING
          : CallLeadStatus.BLANK;

    records.push({
      name: `${lastName} ${firstName}`,
      email: `dummy30-${String(i).padStart(3, "0")}@example.com`,
      phone: `090-3000-${String(i).padStart(4, "0")}`,
      age,
      applicationArea: pick(AREAS, i),
      status,
      callCount: status === CallLeadStatus.HEARING ? 2 : status === CallLeadStatus.NO_ANSWER ? 1 : 0,
      note: pick(NOTE_SAMPLES, i),
      daysAgo: i % 14,
      nextCallDays: i % 4 === 0 ? i % 10 : null,
    });
  }

  records.push({
    name: "中野 重複子",
    email: "dummy30-dup@example.com",
    phone: "090-3001-0001",
    age: 32,
    applicationArea: "愛知県 豊田市",
    status: CallLeadStatus.BLANK,
    callCount: 0,
    note: "重複テスト1件目（BLANK）",
    daysAgo: 1,
    nextCallDays: 3,
  });
  records.push({
    name: "中野 重複子",
    email: "dummy30-dup@example.com",
    phone: "090-3001-0001",
    age: 32,
    applicationArea: "愛知県 豊田市",
    status: CallLeadStatus.DUPLICATE,
    callCount: 0,
    note: null,
    daysAgo: 0,
    nextCallDays: null,
  });

  records.push({
    name: "石川 年少",
    email: "dummy30-oos1@example.com",
    phone: "090-3002-0001",
    age: 17,
    applicationArea: "愛知県 名古屋市",
    status: CallLeadStatus.OUT_OF_SCOPE,
    callCount: 0,
    note: null,
    daysAgo: 2,
    nextCallDays: null,
  });
  records.push({
    name: "藤田 シニア",
    email: "dummy30-oos2@example.com",
    phone: "090-3002-0002",
    age: 58,
    applicationArea: "静岡県 浜松市",
    status: CallLeadStatus.OUT_OF_SCOPE,
    callCount: 0,
    note: null,
    daysAgo: 3,
    nextCallDays: null,
  });

  return records;
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    throw new Error("アクティブなユーザーが見つかりません。先にログインしてください。");
  }

  const tenantId = user.tenantId ?? DEFAULT_TENANT_ID;
  const now = new Date();
  const records = buildRecords();

  const existing = await prisma.callLead.count({
    where: { tenantId, sourceName: SOURCE_NAME },
  });

  if (existing >= records.length) {
    console.log(`バッチ ${SOURCE_NAME} は既に ${existing} 件あります。スキップします。`);
    return;
  }

  let created = 0;

  for (const row of records) {
    const exists = await prisma.callLead.findFirst({
      where: {
        tenantId,
        email: row.email,
        sourceName: SOURCE_NAME,
        status: row.status,
      },
    });
    if (exists) {
      console.log(`スキップ: ${row.name} (${row.status})`);
      continue;
    }

    const appliedAt = new Date(now);
    appliedAt.setDate(appliedAt.getDate() - row.daysAgo);

    let nextCallDate = null;
    if (row.nextCallDays != null) {
      nextCallDate = new Date(now);
      nextCallDate.setDate(nextCallDate.getDate() + row.nextCallDays);
    }

    const callLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.callLead.create({
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
          callCount: row.callCount,
          lastCalledAt: row.callCount > 0 ? appliedAt : null,
          nextCallDate,
          nextCallMemo: row.nextCallDays != null ? "ダミー: フォロー架電予定" : null,
          sourceType: ImportSourceType.CSV,
          sourceName: SOURCE_NAME,
        },
      });

      await tx.callLeadActivity.create({
        data: {
          tenantId,
          callLeadId: lead.id,
          userId: user.id,
          action: "IMPORTED",
          entityType: "CALL_LEAD",
          entityId: lead.id,
          metadata: { batch: BATCH_TAG, status: row.status },
        },
      });

      if (row.note) {
        const note = await tx.callLeadNote.create({
          data: {
            callLeadId: lead.id,
            authorId: user.id,
            content: row.note,
          },
        });
        await tx.callLeadActivity.create({
          data: {
            tenantId,
            callLeadId: lead.id,
            userId: user.id,
            action: "NOTE_ADDED",
            entityType: "CALL_LEAD_NOTE",
            entityId: note.id,
          },
        });
      }

      return lead;
    });

    created++;
    console.log(`作成: ${callLead.name} (${row.status})`);
  }

  console.log(`\n完了: ${created} 件追加（バッチ: ${SOURCE_NAME}）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
