import {
  ActivityAction,
  AssignmentRole,
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
  ImportSourceType,
  NoteType,
  Prisma,
  type CallLead,
  type CallLeadNote,
} from "@prisma/client";
import { formatCallLeadSource } from "@/lib/constants/call-lead-labels";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { prisma } from "@/lib/prisma";
import {
  assertCanCreate,
  enforceAfterCreate,
  isTenantLimitError,
} from "@/lib/tenant/enforce-limits";

export type ConvertCallLeadErrorCode =
  | "NOT_FOUND"
  | "ALREADY_CONVERTED"
  | "INVALID_STATUS"
  | "MISSING_PHONE"
  | "DUPLICATE_PHONE"
  | "LIMIT_BLOCKED";

export class ConvertCallLeadError extends Error {
  constructor(
    public readonly code: ConvertCallLeadErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ConvertCallLeadError";
  }
}

export function canConvertCallLeadStatus(status: CallLeadStatus): boolean {
  return status !== CallLeadStatus.CONVERTED;
}

/** CallLead の氏名を Candidate 用の姓・名に分割 */
export function splitCallLeadName(name: string): { lastName: string; firstName: string } {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { lastName: parts[0], firstName: parts.slice(1).join(" ") };
  }
  return { lastName: trimmed, firstName: "名未設定" };
}

function mapImportSourceToCandidateSource(sourceType: ImportSourceType): string {
  switch (sourceType) {
    case ImportSourceType.MEDIA:
      return "KYUJIN_BOX";
    default:
      return "OTHER";
  }
}

function buildHearingMemo(callLead: CallLead): string | null {
  const lines = [
    callLead.applicationArea ? `応募地: ${callLead.applicationArea}` : null,
    callLead.nextCallMemo ? `次回架電メモ: ${callLead.nextCallMemo}` : null,
    `取込元: ${formatCallLeadSource(callLead.sourceType, callLead.sourceName)}`,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : null;
}

function buildMigratedNoteContent(note: CallLeadNote): string {
  return `【架電リストより移行】\n${note.content}`;
}

export type ConvertCallLeadInput = {
  callLeadId: string;
  tenantId: string;
  userId: string;
};

export type ConvertCallLeadResult = {
  candidateId: string;
  callLeadId: string;
};

export async function convertCallLeadToCandidate(
  input: ConvertCallLeadInput
): Promise<ConvertCallLeadResult> {
  const callLead = await prisma.callLead.findFirst({
    where: { id: input.callLeadId, tenantId: input.tenantId, deletedAt: null },
    include: {
      notes: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!callLead) {
    throw new ConvertCallLeadError("NOT_FOUND", "架電リードが見つかりません");
  }

  if (callLead.status === CallLeadStatus.CONVERTED || callLead.convertedCandidateId) {
    throw new ConvertCallLeadError("ALREADY_CONVERTED", CANDIDATE_DISPLAY.convertAlready);
  }

  if (!canConvertCallLeadStatus(callLead.status)) {
    throw new ConvertCallLeadError(
      "INVALID_STATUS",
      CANDIDATE_DISPLAY.convertStatusBlocked
    );
  }

  const phone = callLead.phone?.trim();
  if (!phone) {
    throw new ConvertCallLeadError(
      "MISSING_PHONE",
      CANDIDATE_DISPLAY.convertNoPhone
    );
  }

  const { lastName, firstName } = splitCallLeadName(callLead.name);
  const assigneeId = callLead.assignedUserId ?? input.userId;

  try {
    return await prisma.$transaction(async (tx) => {
      await assertCanCreate(input.tenantId, "candidates", {
        tx,
        actorUserId: input.userId,
      });

      const candidate = await tx.candidate.create({
        data: {
          tenantId: input.tenantId,
          lastName,
          firstName,
          email: callLead.email?.trim() || null,
          phone,
          age: callLead.age,
          desiredArea: callLead.applicationArea,
          hearingMemo: buildHearingMemo(callLead),
          source: mapImportSourceToCandidateSource(callLead.sourceType),
          createdById: input.userId,
          assignments: {
            create: {
              userId: assigneeId,
              role: AssignmentRole.PRIMARY,
            },
          },
        },
      });

      if (callLead.notes.length > 0) {
        await tx.note.createMany({
          data: callLead.notes.map((note) => ({
            candidateId: candidate.id,
            authorId: note.authorId,
            content: buildMigratedNoteContent(note),
            type: NoteType.INTERNAL,
            createdAt: note.createdAt,
          })),
        });
      }

      await tx.callLead.update({
        where: { id: callLead.id },
        data: {
          status: CallLeadStatus.CONVERTED,
          convertedCandidateId: candidate.id,
        },
      });

      await tx.callLeadActivity.create({
        data: {
          tenantId: input.tenantId,
          callLeadId: callLead.id,
          userId: input.userId,
          action: CallLeadActivityAction.CONVERTED_TO_CANDIDATE,
          entityType: CallLeadEntityType.CANDIDATE,
          entityId: candidate.id,
          metadata: {
            candidateId: candidate.id,
            candidateName: `${lastName} ${firstName}`,
          },
        },
      });

      await tx.activity.create({
        data: {
          candidateId: candidate.id,
          userId: input.userId,
          action: ActivityAction.CREATED,
          entityType: "CANDIDATE",
          entityId: candidate.id,
          metadata: {
            source: "call_lead_conversion",
            callLeadId: callLead.id,
          },
        },
      });

      if (callLead.notes.length > 0) {
        await tx.activity.create({
          data: {
            candidateId: candidate.id,
            userId: input.userId,
            action: ActivityAction.NOTE_ADDED,
            entityType: "NOTE",
            entityId: candidate.id,
            metadata: {
              migratedFromCallLead: true,
              noteCount: callLead.notes.length,
            },
          },
        });
      }

      await enforceAfterCreate(input.tenantId, "candidates", {
        tx,
        actorUserId: input.userId,
      });

      return { candidateId: candidate.id, callLeadId: callLead.id };
    });
  } catch (error) {
    if (isTenantLimitError(error)) {
      throw new ConvertCallLeadError("LIMIT_BLOCKED", error.message);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConvertCallLeadError(
        "DUPLICATE_PHONE",
        CANDIDATE_DISPLAY.convertDuplicatePhone
      );
    }
    throw error;
  }
}

export function convertCallLeadErrorMessage(code: ConvertCallLeadErrorCode): string {
  switch (code) {
    case "NOT_FOUND":
      return "架電リードが見つかりません";
    case "ALREADY_CONVERTED":
      return CANDIDATE_DISPLAY.convertAlready;
    case "INVALID_STATUS":
      return CANDIDATE_DISPLAY.convertAlready;
    case "MISSING_PHONE":
      return CANDIDATE_DISPLAY.convertNeedPhone;
    case "DUPLICATE_PHONE":
      return CANDIDATE_DISPLAY.convertDuplicatePhone;
    case "LIMIT_BLOCKED":
      return "求職者数がプラン上限に達しているため、新規登録できません。";
    default:
      return CANDIDATE_DISPLAY.convertFailed;
  }
}
