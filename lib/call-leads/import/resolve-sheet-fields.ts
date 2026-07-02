import { CallLeadStatus } from "@prisma/client";
import { formatUserSurname } from "@/lib/users/display";

export type AssigneeLookupUser = {
  id: string;
  name: string;
  lastName?: string | null;
  firstName?: string | null;
};

/** スプレッドシート「対応履歴」→ CallLeadStatus */
const SHEET_STATUS_MAP: Record<string, CallLeadStatus> = {
  重複: CallLeadStatus.DUPLICATE,
  対象外: CallLeadStatus.OUT_OF_SCOPE,
  不出: CallLeadStatus.NO_ANSWER,
  不通: CallLeadStatus.NO_ANSWER,
  送客: CallLeadStatus.CONVERTED,
  ヒアリング: CallLeadStatus.HEARING,
  ヒアリング中: CallLeadStatus.HEARING,
  提案失注: CallLeadStatus.HEARING,
  紹介不可: CallLeadStatus.OUT_OF_SCOPE,
};

/** シート上の苗字 → CRM ユーザー（furukawa 等） */
const ASSIGNEE_ALIASES: Record<string, (user: AssigneeLookupUser) => boolean> = {
  古川: (u) =>
    u.name.toLowerCase().includes("furukawa") ||
    (u.lastName?.toLowerCase().includes("furukawa") ?? false),
};

export function parseSheetStatusLabel(
  label: string | null | undefined
): CallLeadStatus | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return SHEET_STATUS_MAP[trimmed] ?? null;
}

export function resolveAssigneeFromSheetLabel(
  label: string | null | undefined,
  users: AssigneeLookupUser[]
): string | null {
  const trimmed = label?.trim();
  if (!trimmed) return null;

  const aliasMatch = ASSIGNEE_ALIASES[trimmed];
  if (aliasMatch) {
    const user = users.find(aliasMatch);
    if (user) return user.id;
  }

  const exactLast = users.find(
    (u) => u.lastName?.trim() === trimmed || formatUserSurname(u) === trimmed
  );
  if (exactLast) return exactLast.id;

  const nameStarts = users.find(
    (u) => u.name.startsWith(`${trimmed} `) || u.name === trimmed
  );
  if (nameStarts) return nameStarts.id;

  return null;
}

export function extractSheetAssigneeLabel(
  rawData?: Record<string, string> | null
): string | null {
  if (!rawData) return null;
  return rawData["担当"]?.trim() || null;
}

export function extractSheetStatusLabel(
  rawData?: Record<string, string> | null
): string | null {
  if (!rawData) return null;
  return rawData["対応履歴"]?.trim() || null;
}

/** 手動更新済みステータスはシート取込で上書きしない */
const PRESERVE_STATUS_ON_UPDATE = new Set<CallLeadStatus>([
  CallLeadStatus.CONVERTED,
  CallLeadStatus.HEARING,
  CallLeadStatus.NO_ANSWER,
]);

export function resolveStatusFromSheet(
  existingStatus: CallLeadStatus,
  sheetStatus: CallLeadStatus | null
): CallLeadStatus {
  if (!sheetStatus) return existingStatus;
  if (PRESERVE_STATUS_ON_UPDATE.has(existingStatus)) return existingStatus;
  return sheetStatus;
}
