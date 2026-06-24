import {
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
  ImportLogStatus,
} from "@prisma/client";
import {
  createBatchDuplicateTracker,
  isDuplicateLead,
  registerBatchRow,
} from "@/lib/call-leads/duplicate-detector";
import { isOutOfScopeAge, resolveImportStatus } from "@/lib/call-leads/eligibility";
import type {
  ImportContext,
  ImportParseError,
  ImportServiceResult,
  ImportSourceAdapter,
  ImportSourceMeta,
  ImportedCallLeadSummary,
} from "@/lib/import/types";
import { prisma } from "@/lib/prisma";
import { toValidatedImportRow, validateImportRow } from "@/lib/validators/call-lead-import";
import {
  assertCanCreate,
  enforceAfterCreate,
  isTenantLimitError,
  tenantLimitErrorMessage,
} from "@/lib/tenant/enforce-limits";

type AdapterWithMeta = ImportSourceAdapter & { sourceName?: string | null };

export class ImportService {
  /** Adapter 経由で CallLead を一括取込 */
  async import(
    adapter: AdapterWithMeta,
    meta: ImportSourceMeta,
    context: ImportContext
  ): Promise<ImportServiceResult> {
    const parsed = await adapter.parse();
    const parseErrors: ImportParseError[] = [...parsed.errors];

    const importLog = await prisma.importLog.create({
      data: {
        tenantId: context.tenantId,
        sourceType: meta.sourceType,
        sourceName: meta.sourceName ?? adapter.sourceName ?? null,
        status: ImportLogStatus.PENDING,
      },
    });

    if (parsed.rows.length === 0) {
      const errorMessage =
        parseErrors.map((e) => e.message).join("; ") || "取込対象の行がありません";
      await prisma.importLog.update({
        where: { id: importLog.id },
        data: {
          status: ImportLogStatus.FAILED,
          errorMessage,
        },
      });
      return {
        importLogId: importLog.id,
        importedCount: 0,
        duplicateCount: 0,
        outOfScopeCount: 0,
        validCount: 0,
        parseErrors,
        rows: [],
      };
    }

    const tracker = createBatchDuplicateTracker();
    const summaries: ImportedCallLeadSummary[] = [];
    let duplicateCount = 0;
    let outOfScopeCount = 0;
    let validCount = 0;
    const rowErrors: ImportParseError[] = [];

    for (const rawRow of parsed.rows) {
      const validation = validateImportRow(rawRow);
      if (!validation.success) {
        rowErrors.push({
          sourceIndex: rawRow.sourceIndex,
          message: validation.message,
        });
        continue;
      }

      const row = toValidatedImportRow(validation.data);
      const duplicate = await isDuplicateLead(context.tenantId, row, tracker);
      const status = resolveImportStatus(row.age, duplicate);
      const isDuplicate = status === CallLeadStatus.DUPLICATE;
      const isOutOfScope = status === CallLeadStatus.OUT_OF_SCOPE;

      if (isDuplicate) duplicateCount++;
      else if (isOutOfScope) outOfScopeCount++;
      else validCount++;

      try {
        const callLead = await prisma.$transaction(async (tx) => {
          await assertCanCreate(context.tenantId, "callLeads", {
          tx,
          actorUserId: context.userId,
        });

          const created = await tx.callLead.create({
            data: {
              tenantId: context.tenantId,
              appliedAt: row.appliedAt,
              name: row.name,
              email: row.email,
              phone: row.phone,
              age: row.age,
              applicationArea: row.applicationArea,
              assignedUserId: context.assignedUserId ?? context.userId,
              status,
              sourceType: meta.sourceType,
              sourceName: meta.sourceName ?? adapter.sourceName ?? null,
              sourceId: row.sourceId,
              importedAt: new Date(),
            },
          });

          await enforceAfterCreate(context.tenantId, "callLeads", {
            tx,
            actorUserId: context.userId,
          });

          await tx.callLeadActivity.create({
            data: {
              tenantId: context.tenantId,
              callLeadId: created.id,
              userId: context.userId,
              action: CallLeadActivityAction.IMPORTED,
              entityType: CallLeadEntityType.IMPORT_LOG,
              entityId: importLog.id,
              metadata: {
                sourceType: meta.sourceType,
                sourceName: meta.sourceName ?? adapter.sourceName ?? null,
                status,
                isDuplicate,
                isOutOfScope: isOutOfScopeAge(row.age),
                sourceIndex: row.sourceIndex,
              },
            },
          });

          return created;
        });

        registerBatchRow(row, tracker);

        summaries.push({
          callLeadId: callLead.id,
          status: callLead.status,
          name: callLead.name,
          isDuplicate,
          isOutOfScope,
          sourceIndex: row.sourceIndex,
        });
      } catch (error) {
        if (isDuplicate) duplicateCount--;
        else if (isOutOfScope) outOfScopeCount--;
        else validCount--;

        if (isTenantLimitError(error)) {
          rowErrors.push({
            sourceIndex: rawRow.sourceIndex,
            message: tenantLimitErrorMessage(error),
          });
          break;
        }
        throw error;
      }
    }

    const allErrors = [...parseErrors, ...rowErrors];
    const importedCount = summaries.length;
    const failed = importedCount === 0;

    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        importedCount,
        duplicateCount,
        outOfScopeCount,
        status: failed ? ImportLogStatus.FAILED : ImportLogStatus.COMPLETED,
        errorMessage: failed
          ? allErrors.map((e) => e.message).join("; ") || "有効な行がありませんでした"
          : allErrors.length > 0
            ? allErrors.map((e) => e.message).join("; ")
            : null,
      },
    });

    return {
      importLogId: importLog.id,
      importedCount,
      duplicateCount,
      outOfScopeCount,
      validCount,
      parseErrors: allErrors,
      rows: summaries,
    };
  }
}

export const importService = new ImportService();
