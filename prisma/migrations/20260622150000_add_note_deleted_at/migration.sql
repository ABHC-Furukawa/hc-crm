-- AlterTable
ALTER TABLE "notes" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "notes_deleted_at_idx" ON "notes"("deleted_at");
