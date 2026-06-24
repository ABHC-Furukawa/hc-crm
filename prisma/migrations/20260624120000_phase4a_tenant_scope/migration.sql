-- Phase 4a: Candidate / Company / Tag に tenantId を追加し CRM コアをテナント分離

-- Default tenant（lib/tenant/constants.ts と一致）
-- a0000000-0000-4000-a000-000000000001

-- ── Candidate ──
ALTER TABLE "candidates" ADD COLUMN "tenant_id" UUID;

UPDATE "candidates" c
SET "tenant_id" = u."tenant_id"
FROM "candidate_assignments" ca
JOIN "users" u ON u."id" = ca."user_id"
WHERE ca."candidate_id" = c."id"
  AND ca."unassigned_at" IS NULL
  AND c."tenant_id" IS NULL
  AND u."tenant_id" IS NOT NULL;

UPDATE "candidates" c
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE c."created_by_id" = u."id"
  AND c."tenant_id" IS NULL
  AND u."tenant_id" IS NOT NULL;

UPDATE "candidates"
SET "tenant_id" = 'a0000000-0000-4000-a000-000000000001'
WHERE "tenant_id" IS NULL;

ALTER TABLE "candidates" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "candidates_tenant_id_idx" ON "candidates"("tenant_id");
CREATE INDEX "candidates_tenant_id_status_idx" ON "candidates"("tenant_id", "status");

DROP INDEX IF EXISTS "idx_candidates_phone_active";
CREATE UNIQUE INDEX "idx_candidates_phone_active"
  ON "candidates" ("tenant_id", "phone")
  WHERE "deleted_at" IS NULL;

-- ── Company ──
ALTER TABLE "companies" ADD COLUMN "tenant_id" UUID;

UPDATE "companies" c
SET "tenant_id" = u."tenant_id"
FROM "users" u
WHERE c."account_manager_id" = u."id"
  AND c."tenant_id" IS NULL
  AND u."tenant_id" IS NOT NULL;

UPDATE "companies"
SET "tenant_id" = 'a0000000-0000-4000-a000-000000000001'
WHERE "tenant_id" IS NULL;

ALTER TABLE "companies" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "companies_name_key";
CREATE UNIQUE INDEX "companies_tenant_id_name_key" ON "companies"("tenant_id", "name");
CREATE INDEX "companies_tenant_id_idx" ON "companies"("tenant_id");

-- ── Tag ──
ALTER TABLE "tags" ADD COLUMN "tenant_id" UUID;

UPDATE "tags"
SET "tenant_id" = 'a0000000-0000-4000-a000-000000000001'
WHERE "tenant_id" IS NULL;

ALTER TABLE "tags" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "tags_name_key";
CREATE UNIQUE INDEX "tags_tenant_id_name_key" ON "tags"("tenant_id", "name");
CREATE INDEX "tags_tenant_id_idx" ON "tags"("tenant_id");

-- ── User.tenantId NOT NULL ──
UPDATE "users"
SET "tenant_id" = 'a0000000-0000-4000-a000-000000000001'
WHERE "tenant_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL;
