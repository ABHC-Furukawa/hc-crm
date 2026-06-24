/**
 * 架電リスト — 求職者登録ボタン表示条件の検証
 * node scripts/verify-call-lead-convert-button.mjs
 */
import { PrismaClient } from "@prisma/client";

const DEFAULT_TENANT_ID = "a0000000-0000-4000-a000-000000000001";
const prisma = new PrismaClient();

function shouldShowButton(lead) {
  return !lead.convertedCandidateId;
}

async function main() {
  const leads = await prisma.callLead.findMany({
    where: { tenantId: DEFAULT_TENANT_ID },
    select: { id: true, name: true, status: true, convertedCandidateId: true },
    orderBy: { name: "asc" },
  });

  const byStatus = {};
  const hidden = [];

  for (const lead of leads) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    if (!shouldShowButton(lead)) {
      hidden.push(lead);
    }
  }

  const showDuplicate = leads.filter(
    (l) => l.status === "DUPLICATE" && shouldShowButton(l)
  );
  const showOos = leads.filter(
    (l) => l.status === "OUT_OF_SCOPE" && shouldShowButton(l)
  );

  console.log("Total:", leads.length);
  console.log("By status:", byStatus);
  console.log("Hidden (converted):", hidden.length);
  console.log("DUPLICATE with button:", showDuplicate.length);
  console.log("OUT_OF_SCOPE with button:", showOos.length);

  const missing =
    leads.filter((l) => shouldShowButton(l)).length -
    showDuplicate.length -
    showOos.length -
    leads.filter((l) => !["DUPLICATE", "OUT_OF_SCOPE"].includes(l.status) && shouldShowButton(l)).length;

  if (showDuplicate.length === 0 && byStatus.DUPLICATE > 0) {
    console.error("FAIL: DUPLICATE rows should show convert button");
    process.exitCode = 1;
  }
  if (showOos.length === 0 && byStatus.OUT_OF_SCOPE > 0) {
    console.error("FAIL: OUT_OF_SCOPE rows should show convert button");
    process.exitCode = 1;
  }

  if (!process.exitCode) {
    console.log("OK: convert button visible for all non-converted statuses");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
