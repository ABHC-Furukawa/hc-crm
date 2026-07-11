import {
  ActivityAction,
  ActivityEntityType,
  CallStatus,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
  NoteType,
  PbxProvider,
  RecordingStatus,
  TaskPriority,
  TaskStatus,
  TranscriptStatus,
  AiSummaryStatus,
} from "@prisma/client";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";

export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  CREATED: "作成",
  UPDATED: "更新",
  DELETED: "削除",
  STATUS_CHANGED: "ステータス変更",
  ASSIGNED: "担当割当",
  UNASSIGNED: "担当解除",
  COMMUNICATION_LOGGED: "連絡記録",
  CALL_COMPLETED: "通話完了",
  FILE_UPLOADED: "ファイル追加",
  NOTE_ADDED: "メモ追加",
  TAG_ASSIGNED: "タグ付与",
  TAG_REMOVED: "タグ削除",
  APPLICATION_SUBMITTED: "選考登録",
  RESUME_CREATED: "履歴書作成",
  RESUME_UPDATED: "履歴書更新",
  RESUME_EXPORTED: "履歴書出力",
  INTERVIEW_PREP_UPDATED: "面接対策を更新",
  INTERVIEW_RESULT_RECORDED: "面接結果を記録",
};

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  CANDIDATE: CANDIDATE_DISPLAY.name,
  COMPANY: "企業",
  COMMUNICATION: "連絡",
  CALL: "通話",
  LINE_CONVERSATION: "LINE",
  LINE_MESSAGE: "LINEメッセージ",
  EMAIL_THREAD: "メール",
  EMAIL_MESSAGE: "メール",
  TASK: "タスク",
  FILE: "ファイル",
  NOTE: "メモ",
  TAG: "タグ",
  APPLICATION: "選考",
  CANDIDATE_ASSIGNMENT: "担当",
  USER: "ユーザー",
  RESUME: "履歴書",
  INTERVIEW_PREP: "面接対策",
};

export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  CALL: "電話",
  EMAIL: "メール",
  SMS: "SMS",
  LINE: "LINE",
  MEETING: "面談",
  OTHER: "その他",
};

export const COMMUNICATION_DIRECTION_LABELS: Record<CommunicationDirection, string> = {
  INBOUND: "受信",
  OUTBOUND: "発信",
  INTERNAL: "内部",
};

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
  DRAFT: "下書き",
  SENT: "送信済",
  DELIVERED: "配信済",
  READ: "既読",
  FAILED: "失敗",
  CANCELLED: "キャンセル",
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  INITIATED: "開始",
  RINGING: "呼出中",
  IN_PROGRESS: "通話中",
  ANSWERED: "応答",
  COMPLETED: "完了",
  MISSED: "不在",
  VOICEMAIL: "留守電",
  BUSY: "話中",
  FAILED: "失敗",
  CANCELLED: "キャンセル",
};

export const PBX_PROVIDER_LABELS: Record<PbxProvider, string> = {
  TWILIO: "Twilio",
  MIITEL: "MiiTel",
  BIZTEL: "Biztel",
  ZOOM_PHONE: "Zoom Phone",
  ASTERISK: "Asterisk",
  FREEPBX: "FreePBX",
  CUSTOM: "カスタム",
  UNKNOWN: "不明",
};

export const RECORDING_STATUS_LABELS: Record<RecordingStatus, string> = {
  NONE: "なし",
  PENDING: "処理中",
  AVAILABLE: "利用可",
  FAILED: "失敗",
  EXPIRED: "期限切れ",
};

export const TRANSCRIPT_STATUS_LABELS: Record<TranscriptStatus, string> = {
  NONE: "なし",
  PENDING: "待機中",
  PROCESSING: "処理中",
  COMPLETED: "完了",
  FAILED: "失敗",
};

export const AI_SUMMARY_STATUS_LABELS: Record<AiSummaryStatus, string> = {
  NONE: "なし",
  PENDING: "待機中",
  PROCESSING: "処理中",
  COMPLETED: "完了",
  FAILED: "失敗",
};

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  GENERAL: "一般",
  INTERVIEW: "面接",
  FOLLOW_UP: "フォロー",
  INTERNAL: "内部",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
  CANCELLED: "キャンセル",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  URGENT: "緊急",
};

export const DETAIL_TABS = [
  { id: "profile", label: "プロフィール" },
  { id: "job", label: "案件" },
  { id: "interview-prep", label: "面接対策" },
  { id: "resume", label: "履歴書" },
  { id: "activity", label: "アクティビティ" },
  { id: "tasks", label: "タスク" },
  { id: "notes", label: "メモ" },
  { id: "communications", label: "連絡履歴" },
] as const;

export type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

export function isDetailTab(value: string | undefined): value is DetailTabId {
  return DETAIL_TABS.some((tab) => tab.id === value);
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
