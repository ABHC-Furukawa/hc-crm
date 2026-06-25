-- CreateEnum
CREATE TYPE "CommutingArrangement" AS ENUM ('HOME_COMMUTE', 'DORMITORY');
CREATE TYPE "CommuteMeans" AS ENUM ('CAR', 'MOTORBIKE', 'BICYCLE', 'BIKE', 'PUBLIC_TRANSIT');

-- Address split
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "address_line" TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'address'
  ) THEN
    UPDATE "candidates" SET "address_line" = "address" WHERE "address_line" IS NULL;
    ALTER TABLE "candidates" DROP COLUMN "address";
  END IF;
END $$;

-- Source: enum -> text (extensible via app constants)
ALTER TABLE "candidates" ALTER COLUMN "source" DROP DEFAULT;
ALTER TABLE "candidates" ALTER COLUMN "source" TYPE TEXT USING (
  CASE "source"::text
    WHEN 'JOB_BOARD' THEN 'KYUJIN_BOX'
    WHEN 'SNS' THEN 'META_AD'
    WHEN 'INBOUND' THEN 'INDEED'
    ELSE 'OTHER'
  END
);
ALTER TABLE "candidates" ALTER COLUMN "source" SET DEFAULT 'OTHER';

-- Experience: level -> boolean (legacy) or add boolean columns (fresh install)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'manufacturing_experience'
      AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "manufacturing_experience_bool" BOOLEAN;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "factory_experience_bool" BOOLEAN;
    UPDATE "candidates" SET
      "manufacturing_experience_bool" = CASE
        WHEN "manufacturing_experience" IS NULL THEN NULL
        WHEN "manufacturing_experience"::text = 'NONE' THEN false
        ELSE true
      END,
      "factory_experience_bool" = CASE
        WHEN "factory_experience" IS NULL THEN NULL
        WHEN "factory_experience"::text = 'NONE' THEN false
        ELSE true
      END;
    ALTER TABLE "candidates" DROP COLUMN "manufacturing_experience";
    ALTER TABLE "candidates" DROP COLUMN "factory_experience";
    ALTER TABLE "candidates" RENAME COLUMN "manufacturing_experience_bool" TO "manufacturing_experience";
    ALTER TABLE "candidates" RENAME COLUMN "factory_experience_bool" TO "factory_experience";
  ELSE
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "manufacturing_experience" BOOLEAN;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "factory_experience" BOOLEAN;
  END IF;
END $$;

ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "other_company_selection" TEXT;

-- Salary: net + gross estimate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'desired_salary'
  ) THEN
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "desired_salary_net" INTEGER;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "desired_salary_gross" INTEGER;
    UPDATE "candidates" SET
      "desired_salary_net" = "desired_salary",
      "desired_salary_gross" = CASE
        WHEN "desired_salary" IS NOT NULL THEN ROUND("desired_salary"::numeric / 0.78)::integer
        ELSE NULL
      END;
    ALTER TABLE "candidates" DROP COLUMN "desired_salary";
  ELSE
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "desired_salary_net" INTEGER;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "desired_salary_gross" INTEGER;
  END IF;
END $$;

-- Commute fields
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "commuting_arrangement" "CommutingArrangement";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "commute_means" "CommuteMeans";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "commute_method";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "night_shift";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "heavy_lifting_ok" BOOLEAN;

-- Qualifications array
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "qualifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'qualification'
  ) THEN
    UPDATE "candidates" SET "qualifications" = ARRAY["qualification"]::TEXT[]
      WHERE "qualification" IS NOT NULL AND "qualification" <> '';
    ALTER TABLE "candidates" DROP COLUMN "qualification";
  END IF;
END $$;

-- Yes/No detail fields
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "has_tattoo" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "tattoo_detail" TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'tattoo'
  ) THEN
    UPDATE "candidates" SET
      "has_tattoo" = CASE
        WHEN "tattoo" IS NULL OR "tattoo"::text = 'UNKNOWN' THEN NULL
        WHEN "tattoo"::text = 'NONE' THEN false
        ELSE true
      END
      WHERE "tattoo" IS NOT NULL;
    ALTER TABLE "candidates" DROP COLUMN "tattoo";
  END IF;
END $$;

ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "has_medical_treatment" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "medical_treatment_detail" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "has_disability" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "disability_detail" TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'candidates' AND column_name = 'disability'
  ) THEN
    UPDATE "candidates" SET
      "has_disability" = CASE WHEN "disability" IS NOT NULL AND "disability" <> '' THEN true ELSE NULL END,
      "disability_detail" = "disability"
      WHERE "disability" IS NOT NULL AND "disability" <> '';
    ALTER TABLE "candidates" DROP COLUMN "disability";
  END IF;
END $$;

-- Drop unused enums
DROP TYPE IF EXISTS "CandidateSource";
DROP TYPE IF EXISTS "CommuteMethod";
DROP TYPE IF EXISTS "ExperienceLevel";
DROP TYPE IF EXISTS "TattooStatus";
