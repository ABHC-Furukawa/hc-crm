-- AlterEnum
ALTER TYPE "ActivityAction" ADD VALUE 'INTERVIEW_PREP_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'INTERVIEW_RESULT_RECORDED';
ALTER TYPE "ActivityEntityType" ADD VALUE 'INTERVIEW_PREP';

-- CreateEnum
CREATE TYPE "InterviewResultOutcome" AS ENUM ('PASSED', 'ON_HOLD', 'FAILED', 'DECLINED');

-- CreateTable
CREATE TABLE "interview_preparations" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "display_job_case_id" UUID,
    "interview_url" TEXT,
    "checklist_interview_at" BOOLEAN NOT NULL DEFAULT false,
    "checklist_url" BOOLEAN NOT NULL DEFAULT false,
    "checklist_resume" BOOLEAN NOT NULL DEFAULT false,
    "checklist_attire" BOOLEAN NOT NULL DEFAULT false,
    "checklist_belongings" BOOLEAN NOT NULL DEFAULT false,
    "checklist_sms" BOOLEAN NOT NULL DEFAULT false,
    "memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_preparations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" UUID NOT NULL,
    "preparation_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "guidance" TEXT NOT NULL,
    "answer_memo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_results" (
    "id" UUID NOT NULL,
    "preparation_id" UUID NOT NULL,
    "outcome" "InterviewResultOutcome" NOT NULL,
    "note" TEXT,
    "recorded_by_id" UUID,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_prep_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "body_markdown" TEXT NOT NULL,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_prep_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interview_preparations_candidate_id_key" ON "interview_preparations"("candidate_id");
CREATE INDEX "interview_preparations_display_job_case_id_idx" ON "interview_preparations"("display_job_case_id");

CREATE INDEX "interview_questions_preparation_id_sort_order_idx" ON "interview_questions"("preparation_id", "sort_order");

CREATE UNIQUE INDEX "interview_results_preparation_id_key" ON "interview_results"("preparation_id");
CREATE INDEX "interview_results_recorded_by_id_idx" ON "interview_results"("recorded_by_id");

CREATE UNIQUE INDEX "interview_prep_templates_tenant_id_key" ON "interview_prep_templates"("tenant_id");
CREATE INDEX "interview_prep_templates_updated_by_id_idx" ON "interview_prep_templates"("updated_by_id");

-- AddForeignKey
ALTER TABLE "interview_preparations" ADD CONSTRAINT "interview_preparations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_preparations" ADD CONSTRAINT "interview_preparations_display_job_case_id_fkey" FOREIGN KEY ("display_job_case_id") REFERENCES "candidate_job_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_preparation_id_fkey" FOREIGN KEY ("preparation_id") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "interview_results" ADD CONSTRAINT "interview_results_preparation_id_fkey" FOREIGN KEY ("preparation_id") REFERENCES "interview_preparations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_results" ADD CONSTRAINT "interview_results_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "interview_prep_templates" ADD CONSTRAINT "interview_prep_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_prep_templates" ADD CONSTRAINT "interview_prep_templates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
