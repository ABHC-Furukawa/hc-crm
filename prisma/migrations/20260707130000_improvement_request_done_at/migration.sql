ALTER TABLE "improvement_requests" ADD COLUMN "done_at" TIMESTAMP(3);

CREATE INDEX "improvement_requests_done_at_idx" ON "improvement_requests"("done_at");
