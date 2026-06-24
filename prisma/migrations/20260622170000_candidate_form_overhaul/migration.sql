-- CreateEnum
CREATE TYPE "CommutingArrangement" AS ENUM ('HOME_COMMUTE', 'DORMITORY');
CREATE TYPE "CommuteMeans" AS ENUM ('CAR', 'MOTORBIKE', 'BICYCLE', 'BIKE', 'PUBLIC_TRANSIT');

-- Address split
ALTER TABLE "candidates" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "candidates" ADD COLUMN "address_line" TEXT;
UPDATE "candidates" SET "address_line" = "address";
ALTER TABLE "candidates" DROP COLUMN "address";

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

-- Experience: level -> boolean
ALTER TABLE "candidates" ADD COLUMN "manufacturing_experience_bool" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN "factory_experience_bool" BOOLEAN;
UPDATE "candidates" SET
  "manufacturing_experience_bool" = CASE
    WHEN "manufacturing_experience" IS NULL THEN NULL
    WHEN "manufacturing_experience" = 'NONE' THEN false
    ELSE true
  END,
  "factory_experience_bool" = CASE
    WHEN "factory_experience" IS NULL THEN NULL
    WHEN "factory_experience" = 'NONE' THEN false
    ELSE true
  END;
ALTER TABLE "candidates" DROP COLUMN "manufacturing_experience";
ALTER TABLE "candidates" DROP COLUMN "factory_experience";
ALTER TABLE "candidates" RENAME COLUMN "manufacturing_experience_bool" TO "manufacturing_experience";
ALTER TABLE "candidates" RENAME COLUMN "factory_experience_bool" TO "factory_experience";

ALTER TABLE "candidates" ADD COLUMN "other_company_selection" TEXT;

-- Salary: net + gross estimate
ALTER TABLE "candidates" ADD COLUMN "desired_salary_net" INTEGER;
ALTER TABLE "candidates" ADD COLUMN "desired_salary_gross" INTEGER;
UPDATE "candidates" SET
  "desired_salary_net" = "desired_salary",
  "desired_salary_gross" = CASE
    WHEN "desired_salary" IS NOT NULL THEN ROUND("desired_salary"::numeric / 0.78)::integer
    ELSE NULL
  END;
ALTER TABLE "candidates" DROP COLUMN "desired_salary";

-- Commute fields
ALTER TABLE "candidates" ADD COLUMN "commuting_arrangement" "CommutingArrangement";
ALTER TABLE "candidates" ADD COLUMN "commute_means" "CommuteMeans";
ALTER TABLE "candidates" DROP COLUMN "commute_method";
ALTER TABLE "candidates" DROP COLUMN "night_shift";
ALTER TABLE "candidates" ADD COLUMN "heavy_lifting_ok" BOOLEAN;

-- Qualifications array
ALTER TABLE "candidates" ADD COLUMN "qualifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "candidates" SET "qualifications" = ARRAY["qualification"]::TEXT[]
  WHERE "qualification" IS NOT NULL AND "qualification" <> '';
ALTER TABLE "candidates" DROP COLUMN "qualification";

-- Yes/No detail fields
ALTER TABLE "candidates" ADD COLUMN "has_tattoo" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN "tattoo_detail" TEXT;
UPDATE "candidates" SET
  "has_tattoo" = CASE
    WHEN "tattoo" IS NULL OR "tattoo" = 'UNKNOWN' THEN NULL
    WHEN "tattoo" = 'NONE' THEN false
    ELSE true
  END
  WHERE "tattoo" IS NOT NULL;
ALTER TABLE "candidates" DROP COLUMN "tattoo";

ALTER TABLE "candidates" ADD COLUMN "has_medical_treatment" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN "medical_treatment_detail" TEXT;
ALTER TABLE "candidates" ADD COLUMN "has_disability" BOOLEAN;
ALTER TABLE "candidates" ADD COLUMN "disability_detail" TEXT;
UPDATE "candidates" SET
  "has_disability" = CASE WHEN "disability" IS NOT NULL AND "disability" <> '' THEN true ELSE NULL END,
  "disability_detail" = "disability"
  WHERE "disability" IS NOT NULL AND "disability" <> '';
ALTER TABLE "candidates" DROP COLUMN "disability";

-- Drop unused enums
DROP TYPE "CandidateSource";
DROP TYPE "CommuteMethod";
DROP TYPE "ExperienceLevel";
DROP TYPE "TattooStatus";
