import { UserRole } from "@prisma/client";
import { CallLeadGoogleSheetAdapter } from "@/lib/call-leads/import/adapters/google-sheet-adapter";
import { callLeadImportService } from "@/lib/call-leads/import/call-lead-import-service";
import {
  getCallLeadSheetConfig,
  getCallLeadSheetSourceMeta,
  isCallLeadSheetSyncConfigured,
} from "@/lib/call-leads/import/sheet-config";
import type { ImportServiceResult } from "@/lib/import/types";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant/context";

export type SyncCallLeadsOptions = {
  tenantId?: string;
  userId?: string;
};

export type SyncCallLeadsResult = {
  tenantId: string;
  configured: boolean;
  import?: ImportServiceResult;
  error?: string;
};

async function resolveSyncTenantId(tenantId?: string): Promise<string> {
  if (tenantId) return tenantId;
  if (process.env.CALL_LEAD_SYNC_TENANT_ID) {
    return process.env.CALL_LEAD_SYNC_TENANT_ID;
  }
  return getDefaultTenantId();
}

async function resolveSyncUserId(tenantId: string, userId?: string): Promise<string> {
  if (userId) return userId;

  const admin = await prisma.user.findFirst({
    where: { tenantId, role: { in: [UserRole.ADMIN, UserRole.DEVELOP] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (admin) return admin.id;

  const anyUser = await prisma.user.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!anyUser) {
    throw new Error(`tenant ${tenantId} にユーザーが存在しません`);
  }
  return anyUser.id;
}

export async function syncCallLeads(
  options: SyncCallLeadsOptions = {}
): Promise<SyncCallLeadsResult> {
  const tenantId = await resolveSyncTenantId(options.tenantId);
  const configured = isCallLeadSheetSyncConfigured();

  if (!configured) {
    return { tenantId, configured: false };
  }

  const config = getCallLeadSheetConfig();
  if (!config) {
    return {
      tenantId,
      configured: false,
      error: "CALL_LEAD_SPREADSHEET_ID が未設定です",
    };
  }

  const userId = await resolveSyncUserId(tenantId, options.userId);
  const adapter = new CallLeadGoogleSheetAdapter(config);

  const importResult = await callLeadImportService.import(
    adapter,
    getCallLeadSheetSourceMeta(config),
    { tenantId, userId, assignedUserId: userId }
  );

  return { tenantId, configured: true, import: importResult };
}
