-- CreateTable
CREATE TABLE "candidate_job_cases" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "entry_job_name" TEXT,
    "dispatch_company_name" TEXT,
    "referral_fee" INTEGER,
    "interview_prep_at" TIMESTAMP(3),
    "interview_at" TIMESTAMP(3),
    "factory_tour_at" DATE,
    "offer_accepted_at" DATE,
    "scheduled_join_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_job_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_job_cases_candidate_id_key" ON "candidate_job_cases"("candidate_id");

-- AddForeignKey
ALTER TABLE "candidate_job_cases" ADD CONSTRAINT "candidate_job_cases_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
