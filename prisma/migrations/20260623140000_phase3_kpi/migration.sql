-- CreateEnum
CREATE TYPE "KpiMetricType" AS ENUM ('CALL_COUNT', 'CONNECTED_CALL_COUNT', 'ENTRY_COUNT', 'INTERVIEW_SET_COUNT', 'OFFER_COUNT', 'JOINED_COUNT', 'REFERRAL_FEE', 'NEW_CANDIDATE_COUNT', 'CALL_LEAD_CONVERSION');

-- CreateEnum
CREATE TYPE "GoalPeriodType" AS ENUM ('MONTHLY', 'WEEKLY');

-- CreateTable
CREATE TABLE "kpi_goals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "metric_type" "KpiMetricType" NOT NULL,
    "period_type" "GoalPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "period_start" DATE NOT NULL,
    "target_value" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_metrics_daily" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "metric_type" "KpiMetricType" NOT NULL,
    "date" DATE NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_metrics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpi_goals_tenant_id_period_start_idx" ON "kpi_goals"("tenant_id", "period_start");

-- CreateIndex
CREATE INDEX "kpi_goals_user_id_period_start_idx" ON "kpi_goals"("user_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "kpi_goals_tenant_id_user_id_metric_type_period_type_period_key" ON "kpi_goals"("tenant_id", "user_id", "metric_type", "period_type", "period_start");

-- CreateIndex
CREATE INDEX "activity_metrics_daily_tenant_id_date_idx" ON "activity_metrics_daily"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "activity_metrics_daily_user_id_date_idx" ON "activity_metrics_daily"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "activity_metrics_daily_tenant_id_user_id_metric_type_date_key" ON "activity_metrics_daily"("tenant_id", "user_id", "metric_type", "date");

-- AddForeignKey
ALTER TABLE "kpi_goals" ADD CONSTRAINT "kpi_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_goals" ADD CONSTRAINT "kpi_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_metrics_daily" ADD CONSTRAINT "activity_metrics_daily_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_metrics_daily" ADD CONSTRAINT "activity_metrics_daily_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
