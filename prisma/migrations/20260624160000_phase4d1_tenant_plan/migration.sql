-- Phase 4d-1: テナントプラン基盤

CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
CREATE TYPE "TenantLimitPolicy" AS ENUM ('BLOCK', 'EVICT_OLDEST');

ALTER TABLE "tenants" ADD COLUMN "plan" "TenantPlan" NOT NULL DEFAULT 'FREE';

-- 既存 Default tenant は上限に抵触しないよう PROFESSIONAL に backfill
UPDATE "tenants"
SET "plan" = 'PROFESSIONAL'
WHERE "id" = 'a0000000-0000-4000-a000-000000000001';
