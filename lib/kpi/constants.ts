import { CandidateStatus, KpiMetricType } from "@prisma/client";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";

/** 候補者ステータスの進捗順 */
export const CANDIDATE_PIPELINE_ORDER = [
  CandidateStatus.HEARING,
  CandidateStatus.JOB_PROPOSAL,
  CandidateStatus.ENTRY,
  CandidateStatus.INTERVIEW_PREP,
  CandidateStatus.FIRST_INTERVIEW,
  CandidateStatus.FACTORY_TOUR,
  CandidateStatus.OFFER_ACCEPTED,
  CandidateStatus.JOINED,
] as const;

/** 面談設定: エントリー〜一次面接（累計カウント / 累計金額の対象範囲） */
export const INTERVIEW_SET_PIPELINE_STATUSES = [
  CandidateStatus.ENTRY,
  CandidateStatus.INTERVIEW_PREP,
  CandidateStatus.FIRST_INTERVIEW,
] as const;

/** 数値面 — 月次遷移集計（6 指標） */
export const KPI_TRANSITION_COUNT_METRICS = [
  KpiMetricType.CALL_COUNT,
  KpiMetricType.HEARING_COUNT,
  KpiMetricType.PROPOSAL_COUNT,
  KpiMetricType.INTERVIEW_PREP_COUNT,
  KpiMetricType.OFFER_COUNT,
  KpiMetricType.OFFER_ACCEPTED_COUNT,
] as const;

/** 数値面 — 月末時点スナップショット（3 指標） */
export const KPI_PIPELINE_COUNT_METRICS = [
  KpiMetricType.ENTRY_COUNT,
  KpiMetricType.INTERVIEW_SET_COUNT,
  KpiMetricType.JOINED_COUNT,
] as const;

/** 数値面 — 目標設定用（9 指標） */
export const KPI_COUNT_METRICS = [
  ...KPI_TRANSITION_COUNT_METRICS,
  ...KPI_PIPELINE_COUNT_METRICS,
] as const;

/** エントリー以降の進行中ステータス（現在位置スナップショット用） */
export const ENTRY_OR_BEYOND_STATUSES = [
  CandidateStatus.ENTRY,
  CandidateStatus.INTERVIEW_PREP,
  CandidateStatus.FIRST_INTERVIEW,
  CandidateStatus.FACTORY_TOUR,
  CandidateStatus.OFFER_ACCEPTED,
  CandidateStatus.JOINED,
] as const;

/**
 * 面談設定累計: エントリー以降に到達した候補者（一次面接・入社済みも含む）
 * INTERVIEW_SET_PIPELINE_STATUSES は日次遷移集計用
 */
export const INTERVIEW_SET_CUMULATIVE_STATUSES = ENTRY_OR_BEYOND_STATUSES;

/** スナップショット集計する指標（担当候補者の現在ステータスベース） */
export const KPI_SNAPSHOT_METRICS = [
  KpiMetricType.ENTRY_COUNT,
  KpiMetricType.INTERVIEW_SET_COUNT,
  KpiMetricType.JOINED_COUNT,
  KpiMetricType.ENTRY_AMOUNT,
  KpiMetricType.INTERVIEW_SET_AMOUNT,
  KpiMetricType.JOINED_AMOUNT,
] as const;

/** 金額面 — 目標設定用（3 指標・万円） */
export const KPI_AMOUNT_METRICS = [
  KpiMetricType.ENTRY_AMOUNT,
  KpiMetricType.INTERVIEW_SET_AMOUNT,
  KpiMetricType.JOINED_AMOUNT,
] as const;

/** 目標追加フォームで選択可能な全指標 */
export const KPI_GOAL_METRICS = [
  ...KPI_COUNT_METRICS,
  ...KPI_AMOUNT_METRICS,
] as const;

/** ダッシュボード — 数値面（名） */
export const KPI_DASHBOARD_COUNT_METRICS = [
  KpiMetricType.ENTRY_COUNT,
  KpiMetricType.INTERVIEW_SET_COUNT,
  KpiMetricType.JOINED_COUNT,
] as const;

/** ダッシュボード — 金額面（万円・累計） */
export const KPI_DASHBOARD_AMOUNT_METRICS = [
  KpiMetricType.ENTRY_AMOUNT,
  KpiMetricType.INTERVIEW_SET_AMOUNT,
  KpiMetricType.JOINED_AMOUNT,
] as const;

/** ダッシュボード表示用（数値 + 金額） */
export const KPI_DASHBOARD_METRICS = [
  ...KPI_DASHBOARD_COUNT_METRICS,
  ...KPI_DASHBOARD_AMOUNT_METRICS,
] as const;

/** 日次行動量テーブル — 当日のステータス遷移件数 */
export const KPI_DAILY_TABLE_METRICS = [
  KpiMetricType.ENTRY_COUNT,
  KpiMetricType.INTERVIEW_SET_COUNT,
  KpiMetricType.JOINED_COUNT,
] as const;

/** 日次行動量テーブル用ラベル（遷移集計であることを明示） */
export const KPI_DAILY_METRIC_LABELS: Record<
  (typeof KPI_DAILY_TABLE_METRICS)[number],
  string
> = {
  ENTRY_COUNT: "エントリー（遷移）",
  INTERVIEW_SET_COUNT: "面談設定（遷移）",
  JOINED_COUNT: "入社（遷移）",
};

export const KPI_SNAPSHOT_AGGREGATION_HINT =
  CANDIDATE_DISPLAY.snapshotStatusHint;

/** 月次遷移指標の集計説明 */
export const KPI_TRANSITION_AGGREGATION_HINT =
  "選択月内の Activity / CallAttempt / Application から集計";

/** トップダッシュボードウィジェット — 数値面（名）3項目 */
export const KPI_WIDGET_COUNT_METRICS = [...KPI_DASHBOARD_COUNT_METRICS] as const;

/** トップダッシュボードウィジェット — 金額面（万円）3項目 */
export const KPI_WIDGET_AMOUNT_METRICS = [...KPI_DASHBOARD_AMOUNT_METRICS] as const;

/** @deprecated KPI_WIDGET_COUNT_METRICS を使用 */
export const KPI_WIDGET_METRICS = KPI_WIDGET_COUNT_METRICS;

export const KPI_METRIC_LABELS: Record<KpiMetricType, string> = {
  CALL_COUNT: "架電数",
  HEARING_COUNT: "ヒアリング数",
  PROPOSAL_COUNT: "提案数",
  ENTRY_COUNT: "エントリー数",
  INTERVIEW_PREP_COUNT: "面談対策数",
  INTERVIEW_SET_COUNT: "面談設定数",
  OFFER_COUNT: "内定数",
  OFFER_ACCEPTED_COUNT: "内定承諾数",
  JOINED_COUNT: "入社数",
  ENTRY_AMOUNT: "エントリー金額",
  INTERVIEW_SET_AMOUNT: "面談設定金額",
  JOINED_AMOUNT: "入社金額",
};

/** 進行中パイプライン（スナップショット）カード用 */
export const KPI_PIPELINE_METRIC_LABELS: Record<
  (typeof KPI_PIPELINE_COUNT_METRICS)[number],
  string
> = {
  ENTRY_COUNT: "エントリー（スナップ）",
  INTERVIEW_SET_COUNT: "面談設定（スナップ）",
  JOINED_COUNT: "入社（スナップ）",
};

/** 金額面カード用 */
export const KPI_AMOUNT_METRIC_LABELS: Record<
  (typeof KPI_AMOUNT_METRICS)[number],
  string
> = {
  ENTRY_AMOUNT: "エントリー金額（累計）",
  INTERVIEW_SET_AMOUNT: "面談設定金額（累計）",
  JOINED_AMOUNT: "入社金額（累計）",
};

/** 月次遷移カード用（必要な指標のみ上書き） */
export const KPI_TRANSITION_METRIC_LABELS: Partial<
  Record<(typeof KPI_TRANSITION_COUNT_METRICS)[number], string>
> = {
  OFFER_COUNT: "内定数（offerAt）",
};

export type MetricLabelContext =
  | "default"
  | "daily"
  | "pipeline"
  | "amount"
  | "transition";

export const KPI_METRIC_UNITS: Record<KpiMetricType, string> = {
  CALL_COUNT: "件",
  HEARING_COUNT: "名",
  PROPOSAL_COUNT: "名",
  ENTRY_COUNT: "名",
  INTERVIEW_PREP_COUNT: "名",
  INTERVIEW_SET_COUNT: "名",
  OFFER_COUNT: "名",
  OFFER_ACCEPTED_COUNT: "名",
  JOINED_COUNT: "名",
  ENTRY_AMOUNT: "万円",
  INTERVIEW_SET_AMOUNT: "万円",
  JOINED_AMOUNT: "万円",
};

export function isSnapshotMetric(metricType: KpiMetricType): boolean {
  return (KPI_SNAPSHOT_METRICS as readonly KpiMetricType[]).includes(metricType);
}

export function isTransitionCountMetric(metricType: KpiMetricType): boolean {
  return (KPI_TRANSITION_COUNT_METRICS as readonly KpiMetricType[]).includes(
    metricType
  );
}

export function getMetricLabel(
  metricType: KpiMetricType,
  context: MetricLabelContext = "default"
): string {
  if (context === "daily") {
    const dailyLabel =
      KPI_DAILY_METRIC_LABELS[
        metricType as (typeof KPI_DAILY_TABLE_METRICS)[number]
      ];
    if (dailyLabel) return dailyLabel;
  }

  if (context === "pipeline") {
    const pipelineLabel =
      KPI_PIPELINE_METRIC_LABELS[
        metricType as (typeof KPI_PIPELINE_COUNT_METRICS)[number]
      ];
    if (pipelineLabel) return pipelineLabel;
  }

  if (context === "amount") {
    const amountLabel =
      KPI_AMOUNT_METRIC_LABELS[
        metricType as (typeof KPI_AMOUNT_METRICS)[number]
      ];
    if (amountLabel) return amountLabel;
  }

  if (context === "transition") {
    const transitionLabel =
      KPI_TRANSITION_METRIC_LABELS[
        metricType as (typeof KPI_TRANSITION_COUNT_METRICS)[number]
      ];
    if (transitionLabel) return transitionLabel;
  }

  return KPI_METRIC_LABELS[metricType];
}

/** 目標設定フォーム — 集計方式付きラベル */
export function getGoalMetricLabel(metricType: KpiMetricType): string {
  if (
    (KPI_TRANSITION_COUNT_METRICS as readonly KpiMetricType[]).includes(
      metricType
    )
  ) {
    return `${getMetricLabel(metricType, "transition")} · 月次遷移`;
  }
  if (
    (KPI_PIPELINE_COUNT_METRICS as readonly KpiMetricType[]).includes(
      metricType
    )
  ) {
    return `${getMetricLabel(metricType, "pipeline")} · 月末スナップ`;
  }
  if (isAmountMetric(metricType)) {
    return `${getMetricLabel(metricType, "amount")} · 月末スナップ`;
  }
  return KPI_METRIC_LABELS[metricType];
}

export function isAmountMetric(metricType: KpiMetricType): boolean {
  return (KPI_AMOUNT_METRICS as readonly KpiMetricType[]).includes(metricType);
}

export function formatMetricValue(
  metricType: KpiMetricType,
  value: number
): string {
  if (isAmountMetric(metricType)) {
    return Math.round(value).toLocaleString("ja-JP");
  }
  return Math.round(value).toLocaleString("ja-JP");
}

export function metricProgressPercent(actual: number, target: number): number {
  if (target <= 0) return actual > 0 ? 100 : 0;
  return Math.min(100, Math.round((actual / target) * 100));
}
