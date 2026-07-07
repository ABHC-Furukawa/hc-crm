-- Improvement requests (developer-only inbox + Slack notifications)
CREATE TYPE "ImprovementRequestPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE "improvement_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "submitted_by_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "ImprovementRequestPriority" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "improvement_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "improvement_requests_tenant_id_created_at_idx" ON "improvement_requests"("tenant_id", "created_at" DESC);
CREATE INDEX "improvement_requests_submitted_by_id_idx" ON "improvement_requests"("submitted_by_id");

ALTER TABLE "improvement_requests" ADD CONSTRAINT "improvement_requests_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "improvement_requests" ADD CONSTRAINT "improvement_requests_submitted_by_id_fkey"
    FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
