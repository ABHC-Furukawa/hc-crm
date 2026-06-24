import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";

/** ファネル 8 ステージ（応募 → 入社） */
export const FUNNEL_STAGE_IDS = [
  "APPLICATION",
  "CALL",
  "HEARING",
  "CANDIDATE_CONVERTED",
  "PROPOSAL",
  "INTERVIEW_SET",
  "OFFER",
  "JOINED",
] as const;

export type FunnelStageId = (typeof FUNNEL_STAGE_IDS)[number];

export const FUNNEL_STAGE_LABELS: Record<FunnelStageId, string> = {
  APPLICATION: "応募数",
  CALL: "架電数",
  HEARING: "ヒアリング数",
  CANDIDATE_CONVERTED: CANDIDATE_DISPLAY.convertFunnelCount,
  PROPOSAL: "推薦数",
  INTERVIEW_SET: "面接数",
  OFFER: "内定数",
  JOINED: "入社数",
};

/** 期間イベント型 — 各ステージの独立カウント */
export const FUNNEL_AGGREGATION_HINT =
  "選択月内のイベント件数（期間イベント型）。各ステージは独立集計です。";

export type FunnelStageCount = {
  stageId: FunnelStageId;
  label: string;
  count: number;
};

export type FunnelConversionPair = {
  fromStageId: FunnelStageId;
  toStageId: FunnelStageId;
  fromLabel: string;
  toLabel: string;
  fromCount: number;
  toCount: number;
  conversionRate: number | null;
};

export type FunnelBottleneck = {
  pair: FunnelConversionPair;
  rank: 1;
};
