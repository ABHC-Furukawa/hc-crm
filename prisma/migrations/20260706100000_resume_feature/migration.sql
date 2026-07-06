-- CreateEnum
CREATE TYPE "ResumeDocumentType" AS ENUM ('RIREKISHO', 'SHOKUMUKEIREKISHO');
CREATE TYPE "ResumeTemplateType" AS ENUM ('JIS_STANDARD_A4');
CREATE TYPE "ResumeStatus" AS ENUM ('DRAFT', 'READY');
CREATE TYPE "ResumeGender" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'RESUME_CREATED';
ALTER TYPE "ActivityAction" ADD VALUE 'RESUME_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'RESUME_EXPORTED';
ALTER TYPE "ActivityEntityType" ADD VALUE 'RESUME';

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "document_type" "ResumeDocumentType" NOT NULL DEFAULT 'RIREKISHO',
    "template_type" "ResumeTemplateType" NOT NULL DEFAULT 'JIS_STANDARD_A4',
    "status" "ResumeStatus" NOT NULL DEFAULT 'DRAFT',
    "full_name" TEXT NOT NULL,
    "furigana" TEXT,
    "birth_date" DATE,
    "gender" "ResumeGender",
    "postal_code" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "education_json" JSONB NOT NULL DEFAULT '[]',
    "work_history_json" JSONB NOT NULL DEFAULT '[]',
    "licenses_json" JSONB NOT NULL DEFAULT '[]',
    "self_pr" TEXT,
    "motivation" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_export_logs" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "exported_by_id" UUID NOT NULL,
    "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" TEXT,
    "file_name" TEXT,

    CONSTRAINT "resume_export_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resumes_tenant_id_updated_at_idx" ON "resumes"("tenant_id", "updated_at" DESC);
CREATE INDEX "resumes_candidate_id_idx" ON "resumes"("candidate_id");
CREATE INDEX "resumes_deleted_at_idx" ON "resumes"("deleted_at");
CREATE UNIQUE INDEX "resumes_candidate_id_document_type_key" ON "resumes"("candidate_id", "document_type");

-- CreateIndex
CREATE INDEX "resume_export_logs_resume_id_exported_at_idx" ON "resume_export_logs"("resume_id", "exported_at" DESC);

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_export_logs" ADD CONSTRAINT "resume_export_logs_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resume_export_logs" ADD CONSTRAINT "resume_export_logs_exported_by_id_fkey" FOREIGN KEY ("exported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
