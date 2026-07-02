import {
  CallAttemptResult,
  CallAttemptStatus,
  CallLeadActivityAction,
  CallLeadEntityType,
  CallLeadStatus,
  ImportLogStatus,
  ImportSourceType,
} from "@prisma/client";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";

export const CALL_LEAD_STATUS_LABELS: Record<CallLeadStatus, string> = {
  BLANK: "未架電",
  HEARING: "ヒアリング中",
  NO_ANSWER: "不通",
  DUPLICATE: "重複",
  OUT_OF_SCOPE: "対象外",
  CONVERTED: CANDIDATE_DISPLAY.convertDone,
};

export const CALL_LEAD_STATUS_STYLES: Record<CallLeadStatus, string> = {
  BLANK: "bg-slate-100 text-slate-800 border-slate-200",
  HEARING: "bg-blue-100 text-blue-800 border-blue-200",
  NO_ANSWER: "bg-amber-100 text-amber-800 border-amber-200",
  DUPLICATE: "bg-gray-100 text-gray-500 border-gray-200",
  OUT_OF_SCOPE: "bg-gray-100 text-gray-500 border-gray-200",
  CONVERTED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

/** DUPLICATE / OUT_OF_SCOPE / CONVERTED は一覧でグレーアウト */
export const CALL_LEAD_GRAYED_OUT_STATUSES: CallLeadStatus[] = [
  CallLeadStatus.DUPLICATE,
  CallLeadStatus.OUT_OF_SCOPE,
  CallLeadStatus.CONVERTED,
];

export function isCallLeadGrayedOut(status: CallLeadStatus): boolean {
  return CALL_LEAD_GRAYED_OUT_STATUSES.includes(status);
}

export const IMPORT_SOURCE_TYPE_LABELS: Record<ImportSourceType, string> = {
  CSV: "CSV",
  GOOGLE_SHEET: "Google Sheets",
  API: "API",
  MANUAL: "手動",
  MEDIA: "求人媒体",
  AGENCY: "広告代理店",
};

export const IMPORT_LOG_STATUS_LABELS: Record<ImportLogStatus, string> = {
  PENDING: "処理中",
  COMPLETED: "完了",
  FAILED: "失敗",
};

export const CALL_ATTEMPT_STATUS_LABELS: Record<CallAttemptStatus, string> = {
  INITIATED: "開始",
  RINGING: "呼出中",
  CONNECTED: "接続",
  COMPLETED: "完了",
  FAILED: "失敗",
  MISSED: "不在",
};

export const CALL_ATTEMPT_RESULT_LABELS: Record<CallAttemptResult, string> = {
  CONNECTED: "通電",
  NO_ANSWER: "不通",
  BUSY: "話中",
  CALL_BACK: "折返し",
  REJECTED: "拒否",
};

export const CALL_LEAD_ACTIVITY_ACTION_LABELS: Record<CallLeadActivityAction, string> = {
  IMPORTED: "取込",
  CALL_INITIATED: "架電開始",
  CALL_RESULT_RECORDED: "架電結果登録",
  HEARING_COMPLETED: "ヒアリング完了",
  CONVERTED_TO_CANDIDATE: CANDIDATE_DISPLAY.convertActivity,
  NOTE_ADDED: "メモ追加",
  FOLLOW_UP_SET: "フォロー設定",
  STATUS_CHANGED: "ステータス変更",
  UPDATED: "更新",
};

export const CALL_LEAD_ENTITY_TYPE_LABELS: Record<CallLeadEntityType, string> = {
  CALL_LEAD: "架電リード",
  CALL_ATTEMPT: "架電",
  CALL_LEAD_NOTE: "メモ",
  IMPORT_LOG: "取込",
  CANDIDATE: CANDIDATE_DISPLAY.name,
};

export const CALL_LEAD_DETAIL_TABS = [
  { id: "profile", label: "基本情報" },
  { id: "calls", label: "架電履歴" },
  { id: "activity", label: "活動履歴" },
  { id: "notes", label: "Notes" },
  { id: "followup", label: "FollowUp" },
] as const;

export type CallLeadDetailTabId = (typeof CALL_LEAD_DETAIL_TABS)[number]["id"];

export function isCallLeadDetailTab(value: string | undefined): value is CallLeadDetailTabId {
  return CALL_LEAD_DETAIL_TABS.some((tab) => tab.id === value);
}

export function formatCallLeadSource(
  sourceType: ImportSourceType,
  sourceName?: string | null
): string {
  const label = IMPORT_SOURCE_TYPE_LABELS[sourceType];
  return sourceName ? `${label}（${sourceName}）` : label;
}
