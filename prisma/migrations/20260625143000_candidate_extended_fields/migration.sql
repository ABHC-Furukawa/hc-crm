-- Candidate extended fields (schema drift fix — present in Prisma, missing from earlier migrations)

DO $$ BEGIN
  CREATE TYPE "EmploymentStatus" AS ENUM (
    'EMPLOYED',
    'UNEMPLOYED',
    'DISPATCH',
    'PART_TIME',
    'STUDENT',
    'OTHER',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmploymentType" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'DISPATCH',
    'CONTRACT',
    'TEMPORARY',
    'OTHER',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VisaStatus" AS ENUM (
    'JAPANESE',
    'PERMANENT',
    'WORK',
    'STUDENT',
    'DEPENDENT',
    'SPECIFIED_SKILLED',
    'OTHER',
    'UNKNOWN'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "furigana" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "birth_date" DATE;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "age" INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "employment_status" "EmploymentStatus";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "available_date" DATE;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "latest_employment_type" "EmploymentType";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "dispatch_company" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "resignation_reason" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "work_description" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "desired_area" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "shift_work" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "height" INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "weight" INTEGER;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "shoe_size" DOUBLE PRECISION;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "visa_status" "VisaStatus";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "hearing_memo" TEXT;
