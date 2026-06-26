-- CreateEnum
CREATE TYPE "JobGender" AS ENUM ('MALE', 'FEMALE', 'ANY', 'UNKNOWN');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "gender" "JobGender" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "jobs" ADD COLUMN "max_age" INTEGER;

-- CreateIndex
CREATE INDEX "jobs_tenant_id_gender_idx" ON "jobs"("tenant_id", "gender");
