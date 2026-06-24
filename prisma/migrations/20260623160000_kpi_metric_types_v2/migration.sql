-- 廃止指標のデータを削除
DELETE FROM "activity_metrics_daily"
WHERE "metric_type"::text IN (
  'CONNECTED_CALL_COUNT',
  'NEW_CANDIDATE_COUNT',
  'REFERRAL_FEE',
  'CALL_LEAD_CONVERSION'
);

DELETE FROM "kpi_goals"
WHERE "metric_type"::text IN (
  'CONNECTED_CALL_COUNT',
  'NEW_CANDIDATE_COUNT',
  'REFERRAL_FEE',
  'CALL_LEAD_CONVERSION'
);

CREATE TYPE "KpiMetricType_new" AS ENUM (
  'CALL_COUNT',
  'HEARING_COUNT',
  'PROPOSAL_COUNT',
  'ENTRY_COUNT',
  'INTERVIEW_PREP_COUNT',
  'INTERVIEW_SET_COUNT',
  'OFFER_COUNT',
  'OFFER_ACCEPTED_COUNT',
  'JOINED_COUNT',
  'ENTRY_AMOUNT',
  'INTERVIEW_SET_AMOUNT',
  'JOINED_AMOUNT'
);

ALTER TABLE "kpi_goals"
  ALTER COLUMN "metric_type" TYPE "KpiMetricType_new"
  USING ("metric_type"::text::"KpiMetricType_new");

ALTER TABLE "activity_metrics_daily"
  ALTER COLUMN "metric_type" TYPE "KpiMetricType_new"
  USING ("metric_type"::text::"KpiMetricType_new");

DROP TYPE "KpiMetricType";
ALTER TYPE "KpiMetricType_new" RENAME TO "KpiMetricType";
