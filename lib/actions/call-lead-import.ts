"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ImportSourceType } from "@prisma/client";
import { CsvImportAdapter } from "@/lib/import/adapters/csv-adapter";
import { ManualImportAdapter } from "@/lib/import/adapters/manual-adapter";
import { importService } from "@/lib/import/import-service";
import { prisma } from "@/lib/prisma";
import { isTenantLimitError, tenantLimitErrorMessage } from "@/lib/tenant/enforce-limits";
import { requireTenantContext } from "@/lib/tenant/context";
import {
  toValidatedImportRow,
  validateImportRow,
} from "@/lib/validators/call-lead-import";

export type CallLeadImportActionState = {
  error?: string;
  success?: boolean;
  importedCount?: number;
  duplicateCount?: number;
  outOfScopeCount?: number;
  validCount?: number;
  importLogId?: string;
  warnings?: string[];
};

const MAX_CSV_BYTES = 5 * 1024 * 1024;

function warningMessages(
  errors: { sourceIndex?: number; message: string }[]
): string[] {
  return errors.map((e) =>
    e.sourceIndex != null ? `${e.sourceIndex}行目: ${e.message}` : e.message
  );
}

export async function importCallLeadsCsvAction(
  _prevState: CallLeadImportActionState,
  formData: FormData
): Promise<CallLeadImportActionState> {
  const { user, tenantId } = await requireTenantContext();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "CSV ファイルを選択してください" };
  }

  if (file.size > MAX_CSV_BYTES) {
    return { error: "CSV ファイルは 5MB 以下にしてください" };
  }

  const content = await file.text();
  const adapter = new CsvImportAdapter({
    content,
    fileName: file.name,
  });

  try {
    const result = await importService.import(
      adapter,
      { sourceType: ImportSourceType.CSV, sourceName: file.name },
      { tenantId, userId: user.id, assignedUserId: user.id }
    );

    revalidatePath("/call-leads");

    if (result.importedCount === 0) {
      return {
        error:
          result.parseErrors[0]?.message ?? "取込に失敗しました",
        warnings: warningMessages(result.parseErrors),
        importLogId: result.importLogId,
      };
    }

    if (formData.get("redirect") === "list") {
      redirect("/call-leads");
    }

    return {
      success: true,
      importedCount: result.importedCount,
      duplicateCount: result.duplicateCount,
      outOfScopeCount: result.outOfScopeCount,
      validCount: result.validCount,
      importLogId: result.importLogId,
      warnings: warningMessages(result.parseErrors),
    };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (isTenantLimitError(e)) {
      return { error: tenantLimitErrorMessage(e) };
    }
    return { error: "CSV 取込中にエラーが発生しました" };
  }
}

export async function importCallLeadManualAction(
  _prevState: CallLeadImportActionState,
  formData: FormData
): Promise<CallLeadImportActionState> {
  const { user, tenantId } = await requireTenantContext();

  const validation = validateImportRow({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    age: formData.get("age") ? Number(formData.get("age")) : null,
    applicationArea: String(formData.get("applicationArea") ?? "") || null,
    appliedAt: formData.get("appliedAt")
      ? new Date(String(formData.get("appliedAt")))
      : null,
  });

  if (!validation.success) {
    return { error: validation.message };
  }

  const row = toValidatedImportRow(validation.data);
  const adapter = new ManualImportAdapter({ row, sourceName: "手動登録" });

  try {
    const result = await importService.import(
      adapter,
      { sourceType: ImportSourceType.MANUAL, sourceName: "手動登録" },
      { tenantId, userId: user.id, assignedUserId: user.id }
    );

    revalidatePath("/call-leads");

    if (result.importedCount === 0 || result.rows.length === 0) {
      return {
        error:
          result.parseErrors[0]?.message ?? "架電リードの登録に失敗しました",
      };
    }

    redirect(`/call-leads/${result.rows[0].callLeadId}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (isTenantLimitError(e)) {
      return { error: tenantLimitErrorMessage(e) };
    }
    return { error: "架電リードの登録に失敗しました" };
  }
}

export async function getRecentImportLogs(limit = 10) {
  const { tenantId } = await requireTenantContext();

  return prisma.importLog.findMany({
    where: { tenantId },
    orderBy: { importedAt: "desc" },
    take: limit,
  });
}
