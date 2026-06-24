-- Phase 4d-3: テナント監査ログ

CREATE TYPE "TenantAuditAction" AS ENUM (
  'LIMIT_BLOCKED',
  'RECORD_EVICTED',
  'EVICT_FALLBACK_BLOCK',
  'PLAN_CHANGED',
  'USER_INVITED'
);

CREATE TABLE "tenant_audit_logs" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "action" "TenantAuditAction" NOT NULL,
  "actor_id" UUID,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tenant_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenant_audit_logs_tenant_id_created_at_idx"
  ON "tenant_audit_logs"("tenant_id", "created_at" DESC);

ALTER TABLE "tenant_audit_logs"
  ADD CONSTRAINT "tenant_audit_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_audit_logs"
  ADD CONSTRAINT "tenant_audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
