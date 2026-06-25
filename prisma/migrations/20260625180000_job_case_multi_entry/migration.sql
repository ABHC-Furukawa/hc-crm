-- 1:1 → 1:N、派遣会社キー、クローズ、KPI 反映フラグ
DROP INDEX IF EXISTS "candidate_job_cases_candidate_id_key";

ALTER TABLE "candidate_job_cases" ADD COLUMN IF NOT EXISTS "dispatch_company_key" TEXT;
ALTER TABLE "candidate_job_cases" ADD COLUMN IF NOT EXISTS "dispatch_company_other" TEXT;
ALTER TABLE "candidate_job_cases" ADD COLUMN IF NOT EXISTS "include_in_kpi" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "candidate_job_cases" ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3);
ALTER TABLE "candidate_job_cases" ADD COLUMN IF NOT EXISTS "closed_reason" TEXT;

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'ABHC'
WHERE "dispatch_company_name" = 'ABHC';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'BREXA_NEXT'
WHERE "dispatch_company_name" = 'BREXA Next';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'NS_TECH'
WHERE "dispatch_company_name" = 'エヌエス・テック';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'SOGO_CAREER'
WHERE "dispatch_company_name" = '綜合キャリアオプション';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'HIRAYAMA'
WHERE "dispatch_company_name" = '平山';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'TOYO_WORK'
WHERE "dispatch_company_name" = '東洋ワーク';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'YOKOTA'
WHERE "dispatch_company_name" = 'ヨコタエンタープライズ';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'UT_AIM'
WHERE "dispatch_company_name" = 'UTエイム';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'WORLD_INTEC'
WHERE "dispatch_company_name" = 'ワールドインテック';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'TAKAKOGYO'
WHERE "dispatch_company_name" = '高木工業';

UPDATE "candidate_job_cases"
SET "dispatch_company_key" = 'NIKKEN'
WHERE "dispatch_company_name" = '日研トータルソーシング';

UPDATE "candidate_job_cases"
SET
  "dispatch_company_key" = 'OTHER',
  "dispatch_company_other" = "dispatch_company_name"
WHERE "dispatch_company_name" IS NOT NULL
  AND "dispatch_company_key" IS NULL;

ALTER TABLE "candidate_job_cases" DROP COLUMN IF EXISTS "dispatch_company_name";

ALTER TABLE "candidate_job_cases"
  ALTER COLUMN "interview_prep_at" TYPE DATE USING ("interview_prep_at"::date);

ALTER TABLE "candidate_job_cases"
  ALTER COLUMN "interview_at" TYPE DATE USING ("interview_at"::date);

CREATE INDEX IF NOT EXISTS "candidate_job_cases_candidate_id_idx"
  ON "candidate_job_cases"("candidate_id");
