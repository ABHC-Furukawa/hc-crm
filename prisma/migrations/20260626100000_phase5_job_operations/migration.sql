-- CreateEnum
CREATE TYPE "JobRecruitmentStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED', 'UNKNOWN');
CREATE TYPE "JobImportLogStatus" AS ENUM ('PENDING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "raw_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "location" TEXT,
    "salary" TEXT,
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'UNKNOWN',
    "working_hours" TEXT,
    "dormitory" BOOLEAN,
    "dormitory_note" TEXT,
    "shift_type" TEXT,
    "has_night_shift" BOOLEAN,
    "recruitment_status" "JobRecruitmentStatus" NOT NULL DEFAULT 'UNKNOWN',
    "recruitment_count" INTEGER,
    "description" TEXT,
    "source_company" TEXT NOT NULL,
    "source_sheet" TEXT NOT NULL,
    "raw_job_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_import_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JobImportLogStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "source_type" "ImportSourceType" NOT NULL DEFAULT 'CSV',

    CONSTRAINT "job_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_jobs_tenant_id_company_name_sheet_name_idx" ON "raw_jobs"("tenant_id", "company_name", "sheet_name");
CREATE INDEX "raw_jobs_tenant_id_imported_at_idx" ON "raw_jobs"("tenant_id", "imported_at" DESC);

CREATE UNIQUE INDEX "jobs_tenant_id_source_company_source_sheet_job_title_location_key" ON "jobs"("tenant_id", "source_company", "source_sheet", "job_title", "location");
CREATE INDEX "jobs_tenant_id_company_name_idx" ON "jobs"("tenant_id", "company_name");
CREATE INDEX "jobs_tenant_id_location_idx" ON "jobs"("tenant_id", "location");
CREATE INDEX "jobs_tenant_id_employment_type_idx" ON "jobs"("tenant_id", "employment_type");
CREATE INDEX "jobs_tenant_id_recruitment_status_idx" ON "jobs"("tenant_id", "recruitment_status");
CREATE INDEX "jobs_tenant_id_updated_at_idx" ON "jobs"("tenant_id", "updated_at" DESC);

CREATE INDEX "job_import_logs_tenant_id_imported_at_idx" ON "job_import_logs"("tenant_id", "imported_at" DESC);

-- AddForeignKey
ALTER TABLE "raw_jobs" ADD CONSTRAINT "raw_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "jobs" ADD CONSTRAINT "jobs_raw_job_id_fkey" FOREIGN KEY ("raw_job_id") REFERENCES "raw_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_import_logs" ADD CONSTRAINT "job_import_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
