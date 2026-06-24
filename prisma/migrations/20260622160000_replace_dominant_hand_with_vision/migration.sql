-- CreateEnum
CREATE TYPE "VisionCorrection" AS ENUM ('NAKED_EYE', 'GLASSES', 'CONTACT', 'UNKNOWN');

-- AlterTable
ALTER TABLE "candidates" DROP COLUMN "dominant_hand";
ALTER TABLE "candidates" ADD COLUMN "vision_correction" "VisionCorrection";
ALTER TABLE "candidates" ADD COLUMN "vision_right" DOUBLE PRECISION;
ALTER TABLE "candidates" ADD COLUMN "vision_left" DOUBLE PRECISION;

-- DropEnum
DROP TYPE "DominantHand";
