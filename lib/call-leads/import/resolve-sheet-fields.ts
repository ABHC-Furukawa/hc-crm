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
  空白: CallLeadStatus.BLANK,
  未架電: CallLeadStatus.BLANK,
  重複: CallLeadStatus.DUPLICATE,
  対象外: CallLeadStatus.OUT_OF_SCOPE,
  不出: CallLeadStatus.NO_ANSWER,
  不通: CallLeadStatus.NO_ANSWER,
  "不出（50代以上）": CallLeadStatus.NO_ANSWER_OVER_50,
  先々入社: CallLeadStatus.FUTURE_HIRE,
  紹介不可: CallLeadStatus.REFERRAL_NOT_AVAILABLE,
  送客: CallLeadStatus.CONVERTED,
  ヒアリング: CallLeadStatus.HEARING,
  ヒアリング中: CallLeadStatus.HEARING,
  "アポ（ヒアリング）": CallLeadStatus.HEARING,
  対応: CallLeadStatus.HEARING,
  "アポ（提案）": CallLeadStatus.CONVERTED,
  検討中: CallLeadStatus.CONVERTED,
  提案失注: CallLeadStatus.CONVERTED,
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
  CallLeadStatus.NO_ANSWER_OVER_50,
  CallLeadStatus.FUTURE_HIRE,
  CallLeadStatus.REFERRAL_NOT_AVAILABLE,
]);

export function resolveStatusFromSheet(
  existingStatus: CallLeadStatus,
  sheetStatus: CallLeadStatus | null
): CallLeadStatus {
  if (!sheetStatus) return existingStatus;
  if (PRESERVE_STATUS_ON_UPDATE.has(existingStatus)) return existingStatus;
  return sheetStatus;
}
