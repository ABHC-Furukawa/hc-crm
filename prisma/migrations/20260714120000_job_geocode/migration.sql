-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "jobs" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "jobs" ADD COLUMN "geocoded_at" TIMESTAMP(3);
ALTER TABLE "jobs" ADD COLUMN "geocode_status" TEXT;
ALTER TABLE "jobs" ADD COLUMN "geocode_query" TEXT;

-- CreateIndex
CREATE INDEX "jobs_tenant_id_geocode_status_idx" ON "jobs"("tenant_id", "geocode_status");
