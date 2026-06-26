-- AlterTable
ALTER TABLE "candidate_job_cases" ADD COLUMN "job_id" UUID;

-- CreateIndex
CREATE INDEX "candidate_job_cases_job_id_idx" ON "candidate_job_cases"("job_id");

-- AddForeignKey
ALTER TABLE "candidate_job_cases" ADD CONSTRAINT "candidate_job_cases_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
