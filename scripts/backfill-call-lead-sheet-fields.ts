/**
 * 既存 CallLead にスプレッドシート rawData の担当・対応履歴を反映
 *
 *   npx tsx scripts/backfill-call-lead-sheet-fields.ts
 */
import { loadEnv } from "./load-env";
import { prisma } from "../lib/prisma";
import { getDefaultTenantId } from "../lib/tenant/context";
import {
  extractSheetAssigneeLabel,
  extractSheetStatusLabel,
  parseSheetStatusLabel,
  resolveAssigneeFromSheetLabel,
  resolveStatusFromSheet,
} from "../lib/call-leads/import/resolve-sheet-fields";

loadEnv();

async function main() {
  const tenantId =
    process.env.CALL_LEAD_SYNC_TENANT_ID ?? (await getDefaultTenantId());

  const users = await prisma.user.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, name: true, lastName: true, firstName: true },
  });

  const raws = await prisma.rawCallLead.findMany({
    where: { tenantId, callLeadId: { not: null } },
    select: { callLeadId: true, rawData: true },
  });

  const byLeadId = new Map<string, Record<string, string>>();
  for (const raw of raws) {
    if (!raw.callLeadId) continue;
    byLeadId.set(raw.callLeadId, raw.rawData as Record<string, string>);
  }

  const leads = await prisma.callLead.findMany({
    where: { tenantId, deletedAt: null, id: { in: [...byLeadId.keys()] } },
    select: { id: true, status: true, assignedUserId: true },
  });

  let assigneeUpdated = 0;
  let statusUpdated = 0;

  for (const lead of leads) {
    const rawData = byLeadId.get(lead.id);
    if (!rawData) continue;

    const sheetAssigneeId = resolveAssigneeFromSheetLabel(
      extractSheetAssigneeLabel(rawData),
      users
    );
    const sheetStatus = parseSheetStatusLabel(extractSheetStatusLabel(rawData));
    const nextStatus = resolveStatusFromSheet(lead.status, sheetStatus);

    const data: { assignedUserId?: string; status?: typeof lead.status } = {};
    if (sheetAssigneeId && sheetAssigneeId !== lead.assignedUserId) {
      data.assignedUserId = sheetAssigneeId;
      assigneeUpdated++;
    }
    if (nextStatus !== lead.status) {
      data.status = nextStatus;
      statusUpdated++;
    }

    if (Object.keys(data).length === 0) continue;

    await prisma.callLead.update({
      where: { id: lead.id },
      data,
    });
  }

  console.log(`tenantId: ${tenantId}`);
  console.log(`leads scanned: ${leads.length}`);
  console.log(`assignee updated: ${assigneeUpdated}`);
  console.log(`status updated: ${statusUpdated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
