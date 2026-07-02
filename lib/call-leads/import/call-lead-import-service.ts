import {
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
  ImportLogStatus,
  ImportSourceType,
  type Prisma,
} from "@prisma/client";
import {
  createBatchDuplicateTracker,
  isDuplicateLead,
  registerBatchRow,
} from "@/lib/call-leads/duplicate-detector";
import { isOutOfScopeAge, resolveImportStatus } from "@/lib/call-leads/eligibility";
import {
  CALL_LEAD_IMPORT_CHUNK_SIZE,
  chunkArray,
} from "@/lib/call-leads/import/constants";
import {
  findExistingCallLeadForUpsert,
  toUpsertLookup,
} from "@/lib/call-leads/import/find-existing";
import {
  extractSheetAssigneeLabel,
  extractSheetStatusLabel,
  resolveAssigneeFromSheetLabel,
  resolveStatusFromSheet,
  type AssigneeLookupUser,
} from "@/lib/call-leads/import/resolve-sheet-fields";
import { buildSourceHashFromRow } from "@/lib/call-leads/import/source-hash";
import {
  applyGoogleSheetSyncWindow,
  formatSyncWindowSummary,
  type SyncWindowSelection,
} from "@/lib/call-leads/import/sync-window";
import type {
  ImportContext,
  ImportParseError,
  ImportServiceResult,
  ImportSourceAdapter,
  ImportSourceMeta,
  ImportSyncWindowSummary,
  ImportedCallLeadSummary,
} from "@/lib/import/types";
import { prisma } from "@/lib/prisma";
import {
  assertCanCreate,
  enforceAfterCreate,
  isTenantLimitError,
  tenantLimitErrorMessage,
} from "@/lib/tenant/enforce-limits";
import { toValidatedImportRow, validateImportRow } from "@/lib/validators/call-lead-import";

type AdapterWithMeta = ImportSourceAdapter & { sourceName?: string | null };

type ProcessCounters = {
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  outOfScopeCount: number;
  skippedCount: number;
  failedCount: number;
  validCount: number;
};

function buildCallLeadWriteData(
  row: ReturnType<typeof toValidatedImportRow>,
  meta: ImportSourceMeta,
  adapter: AdapterWithMeta,
  sourceHash: string,
  status: CallLeadStatus,
  assignedUserId: string
): Omit<Prisma.CallLeadUncheckedCreateInput, "tenantId"> {
  return {
    appliedAt: row.appliedAt,
    name: row.name,
    email: row.email,
    phone: row.phone,
    age: row.age,
    applicationArea: row.applicationArea,
    assignedUserId,
    status,
    sourceType: meta.sourceType,
    sourceName: meta.sourceName ?? adapter.sourceName ?? null,
    sourceSheet: row.sourceSheet ?? null,
    sourceRowNumber: row.sourceRowNumber ?? null,
    sourceHash,
    sourceId: row.sourceId,
    importedAt: new Date(),
  };
}

export class CallLeadImportService {
  async import(
    adapter: AdapterWithMeta,
    meta: ImportSourceMeta,
    context: ImportContext
  ): Promise<ImportServiceResult> {
    const parsed = await adapter.parse();
    const parseErrors: ImportParseError[] = [...parsed.errors];
    const sourceName = meta.sourceName ?? adapter.sourceName ?? null;
    const sheetName =
      parsed.rows[0]?.sourceSheet ??
      ("sheetName" in meta ? (meta as { sheetName?: string }).sheetName : null) ??
      sourceName;

    let rowsToImport = parsed.rows;
    let syncWindow: SyncWindowSelection | undefined;

    if (
      meta.sourceType === ImportSourceType.GOOGLE_SHEET &&
      sourceName &&
      sheetName
    ) {
      syncWindow = await applyGoogleSheetSyncWindow(
        context.tenantId,
        sourceName,
        sheetName,
        parsed.rows
      );
      rowsToImport = syncWindow.rows;
    }

    const syncWindowSummary = syncWindow
      ? toSyncWindowSummary(syncWindow)
      : undefined;

    const importLog = await prisma.callLeadImportLog.create({
      data: {
        tenantId: context.tenantId,
        sourceType: meta.sourceType,
        sourceName,
        sheetName,
        status: ImportLogStatus.PENDING,
      },
    });

    if (parsed.rows.length === 0) {
      const errorMessage =
        parseErrors.map((e) => e.message).join("; ") || "取込対象の行がありません";
      await prisma.callLeadImportLog.update({
        where: { id: importLog.id },
        data: { status: ImportLogStatus.FAILED, errorMessage },
      });
      return emptyResult(importLog.id, parseErrors, syncWindowSummary);
    }

    if (rowsToImport.length === 0) {
      const message =
        syncWindowSummary?.message ?? "取込対象の行がありません";
      await prisma.callLeadImportLog.update({
        where: { id: importLog.id },
        data: {
          status: ImportLogStatus.COMPLETED,
          skippedCount: syncWindow?.skippedByWindow ?? 0,
          errorMessage: message,
        },
      });
      return emptyResult(importLog.id, parseErrors, syncWindowSummary, message);
    }

    const tracker = createBatchDuplicateTracker();
    const summaries: ImportedCallLeadSummary[] = [];
    const rowErrors: ImportParseError[] = [];
    const counters: ProcessCounters = {
      createdCount: 0,
      updatedCount: 0,
      duplicateCount: 0,
      outOfScopeCount: 0,
      skippedCount: syncWindow?.skippedByWindow ?? 0,
      failedCount: 0,
      validCount: 0,
    };

    const assignableUsers: AssigneeLookupUser[] = await prisma.user.findMany({
      where: { tenantId: context.tenantId, isActive: true },
      select: { id: true, name: true, lastName: true, firstName: true },
    });

    const importedAt = new Date();
    const chunks = chunkArray(rowsToImport, CALL_LEAD_IMPORT_CHUNK_SIZE);

    for (const chunk of chunks) {
      const rawRecords: Prisma.RawCallLeadCreateManyInput[] = [];

      for (const rawRow of chunk) {
        const validation = validateImportRow(rawRow);
        if (!validation.success) {
          counters.skippedCount++;
          counters.failedCount++;
          rowErrors.push({
            sourceIndex: rawRow.sourceRowNumber ?? rawRow.sourceIndex,
            message: validation.message,
          });
          continue;
        }

        const row = toValidatedImportRow(validation.data);
        const sourceHash = buildSourceHashFromRow(row);
        rawRecords.push({
          tenantId: context.tenantId,
          sourceType: meta.sourceType,
          sourceName,
          sheetName: row.sourceSheet ?? sheetName ?? "",
          rowNumber: row.sourceRowNumber ?? row.sourceIndex ?? 0,
          rawData: (row.rawData ?? {}) as Prisma.InputJsonValue,
          sourceHash,
          importedAt,
          callLeadImportLogId: importLog.id,
        });
      }

      if (rawRecords.length > 0) {
        await prisma.rawCallLead.createMany({ data: rawRecords });
      }

      for (const rawRow of chunk) {
        const validation = validateImportRow(rawRow);
        if (!validation.success) continue;

        const row = toValidatedImportRow(validation.data);
        const sourceHash = buildSourceHashFromRow(row);

        try {
          const result = await this.processRow({
            row,
            sourceHash,
            meta,
            adapter,
            context,
            importLogId: importLog.id,
            tracker,
            counters,
            assignableUsers,
          });

          if (result) summaries.push(result);
        } catch (error) {
          counters.failedCount++;
          if (isTenantLimitError(error)) {
            rowErrors.push({
              sourceIndex: row.sourceRowNumber ?? row.sourceIndex,
              message: tenantLimitErrorMessage(error),
            });
            break;
          }
          throw error;
        }
      }
    }

    const importedCount = summaries.length;
    const allErrors = [...parseErrors, ...rowErrors];
    const status =
      importedCount === 0 ? ImportLogStatus.FAILED : ImportLogStatus.COMPLETED;

    await prisma.callLeadImportLog.update({
      where: { id: importLog.id },
      data: {
        importedCount,
        createdCount: counters.createdCount,
        updatedCount: counters.updatedCount,
        duplicateCount: counters.duplicateCount,
        outOfScopeCount: counters.outOfScopeCount,
        skippedCount: counters.skippedCount,
        failedCount: counters.failedCount,
        status,
        errorMessage:
          allErrors.length > 0 ? allErrors.slice(0, 20).map((e) => e.message).join("; ") : null,
      },
    });

    return {
      importLogId: importLog.id,
      importedCount,
      createdCount: counters.createdCount,
      updatedCount: counters.updatedCount,
      duplicateCount: counters.duplicateCount,
      outOfScopeCount: counters.outOfScopeCount,
      skippedCount: counters.skippedCount,
      failedCount: counters.failedCount,
      validCount: counters.validCount,
      parseErrors: allErrors,
      rows: summaries,
      syncWindow: syncWindowSummary,
    };
  }

  private async processRow(params: {
    row: ReturnType<typeof toValidatedImportRow>;
    sourceHash: string;
    meta: ImportSourceMeta;
    adapter: AdapterWithMeta;
    context: ImportContext;
    importLogId: string;
    tracker: ReturnType<typeof createBatchDuplicateTracker>;
    counters: ProcessCounters;
    assignableUsers: AssigneeLookupUser[];
  }): Promise<ImportedCallLeadSummary | null> {
    const {
      row,
      sourceHash,
      meta,
      adapter,
      context,
      importLogId,
      tracker,
      counters,
      assignableUsers,
    } = params;

    const sourceName = meta.sourceName ?? adapter.sourceName ?? null;
    const existing = await findExistingCallLeadForUpsert(
      context.tenantId,
      toUpsertLookup(row, { sourceName, sourceHash })
    );

    const duplicate = await isDuplicateLead(
      context.tenantId,
      row,
      tracker,
      existing?.id
    );
    const sheetStatusLabel = extractSheetStatusLabel(row.rawData);
    const importStatus = resolveImportStatus(row.age, duplicate, sheetStatusLabel);
    const isDuplicate = importStatus === CallLeadStatus.DUPLICATE;
    const isOutOfScope = importStatus === CallLeadStatus.OUT_OF_SCOPE;

    if (isDuplicate) counters.duplicateCount++;
    else if (isOutOfScope) counters.outOfScopeCount++;
    else counters.validCount++;

    const fallbackAssigneeId = context.assignedUserId ?? context.userId;
    const sheetAssigneeId = resolveAssigneeFromSheetLabel(
      extractSheetAssigneeLabel(row.rawData),
      assignableUsers
    );
    const assignedUserId = sheetAssigneeId ?? fallbackAssigneeId;
    const writeData = buildCallLeadWriteData(
      row,
      meta,
      adapter,
      sourceHash,
      importStatus,
      assignedUserId
    );

    const callLead = await prisma.$transaction(async (tx) => {
      if (existing) {
        counters.updatedCount++;
        const status = resolveStatusFromSheet(existing.status, importStatus);
        return tx.callLead.update({
          where: { id: existing.id },
          data: {
            ...writeData,
            status,
            assignedUserId:
              sheetAssigneeId ?? existing.assignedUserId ?? fallbackAssigneeId,
            callCount: existing.callCount,
            lastCalledAt: existing.lastCalledAt,
            nextCallDate: existing.nextCallDate,
            nextCallMemo: existing.nextCallMemo,
            convertedCandidateId: existing.convertedCandidateId,
          },
        });
      }

      await assertCanCreate(context.tenantId, "callLeads", {
        tx,
        actorUserId: context.userId,
      });

      counters.createdCount++;
      const created = await tx.callLead.create({
        data: {
          tenantId: context.tenantId,
          ...writeData,
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
          entityId: importLogId,
          metadata: {
            sourceType: meta.sourceType,
            sourceName,
            status: importStatus,
            isDuplicate,
            isOutOfScope: isOutOfScopeAge(row.age),
            sourceRowNumber: row.sourceRowNumber,
          },
        },
      });

      return created;
    });

    await prisma.rawCallLead.updateMany({
      where: {
        tenantId: context.tenantId,
        callLeadImportLogId: importLogId,
        rowNumber: row.sourceRowNumber ?? row.sourceIndex ?? -1,
        sourceHash,
      },
      data: { callLeadId: callLead.id },
    });

    registerBatchRow(row, tracker);

    return {
      callLeadId: callLead.id,
      status: callLead.status,
      name: callLead.name,
      isDuplicate,
      isOutOfScope,
      sourceIndex: row.sourceRowNumber ?? row.sourceIndex,
    };
  }
}

function toSyncWindowSummary(selection: SyncWindowSelection): ImportSyncWindowSummary {
  return {
    mode: selection.mode,
    selectedCount: selection.rows.length,
    skippedByWindow: selection.skippedByWindow,
    totalSheetRows: selection.totalSheetRows,
    maxSyncedRowBefore: selection.maxSyncedRowBefore,
    message: formatSyncWindowSummary(selection),
  };
}

function emptyResult(
  importLogId: string,
  parseErrors: ImportParseError[],
  syncWindow?: ImportSyncWindowSummary,
  infoMessage?: string
): ImportServiceResult {
  const errors = infoMessage
    ? [...parseErrors, { message: infoMessage }]
    : parseErrors;
  return {
    importLogId,
    importedCount: 0,
    createdCount: 0,
    updatedCount: 0,
    duplicateCount: 0,
    outOfScopeCount: 0,
    skippedCount: syncWindow?.skippedByWindow ?? 0,
    failedCount: 0,
    validCount: 0,
    parseErrors: errors,
    rows: [],
    syncWindow,
  };
}

export const callLeadImportService = new CallLeadImportService();
