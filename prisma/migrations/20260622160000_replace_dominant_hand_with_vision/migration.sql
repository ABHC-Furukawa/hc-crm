-- CreateEnum
CREATE TYPE "VisionCorrection" AS ENUM ('NAKED_EYE', 'GLASSES', 'CONTACT', 'UNKNOWN');

-- AlterTable (dominant_hand existed only on legacy dev DBs, not in init migration)
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "dominant_hand";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "vision_correction" "VisionCorrection";
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "vision_right" DOUBLE PRECISION;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "vision_left" DOUBLE PRECISION;

-- DropEnum
DROP TYPE IF EXISTS "DominantHand";
