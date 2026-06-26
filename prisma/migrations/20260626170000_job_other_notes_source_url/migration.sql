-- AlterTable
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "other_notes" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "source_url" TEXT;
