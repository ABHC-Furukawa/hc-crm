-- Phase 2.5 Step 1: Tenant + CallLead 基盤（既存テーブルは users.tenant_id 追加のみ）

-- Default tenant（固定 UUID — lib/tenant/constants.ts と一致）
-- a0000000-0000-4000-a000-000000000001

CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

INSERT INTO "tenants" ("id", "name", "slug", "created_at", "updated_at")
VALUES (
    'a0000000-0000-4000-a000-000000000001',
    'Default',
    'default',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

ALTER TABLE "users" ADD COLUMN "tenant_id" UUID;
UPDATE "users" SET "tenant_id" = 'a0000000-0000-4000-a000-000000000001';
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- Enums
CREATE TYPE "CallLeadStatus" AS ENUM ('BLANK', 'HEARING', 'NO_ANSWER', 'DUPLICATE', 'OUT_OF_SCOPE', 'CONVERTED');
CREATE TYPE "ImportSourceType" AS ENUM ('CSV', 'GOOGLE_SHEET', 'API', 'MANUAL', 'MEDIA', 'AGENCY');
CREATE TYPE "ImportLogStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "CallDialProvider" AS ENUM ('TEL', 'TWILIO', 'AMAZON_CONNECT', 'OTHER');
CREATE TYPE "CallAttemptStatus" AS ENUM ('INITIATED', 'RINGING', 'CONNECTED', 'COMPLETED', 'FAILED', 'MISSED');
CREATE TYPE "CallAttemptResult" AS ENUM ('CONNECTED', 'NO_ANSWER', 'BUSY', 'CALL_BACK', 'REJECTED');
CREATE TYPE "CallLeadActivityAction" AS ENUM (
    'IMPORTED', 'CALL_INITIATED', 'CALL_RESULT_RECORDED', 'HEARING_COMPLETED',
    'CONVERTED_TO_CANDIDATE', 'NOTE_ADDED', 'FOLLOW_UP_SET', 'STATUS_CHANGED', 'UPDATED'
);
CREATE TYPE "CallLeadEntityType" AS ENUM ('CALL_LEAD', 'CALL_ATTEMPT', 'CALL_LEAD_NOTE', 'IMPORT_LOG', 'CANDIDATE');

-- call_leads
CREATE TABLE "call_leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "applied_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "age" INTEGER,
    "application_area" TEXT,
    "assigned_user_id" UUID,
    "status" "CallLeadStatus" NOT NULL DEFAULT 'BLANK',
    "call_count" INTEGER NOT NULL DEFAULT 0,
    "last_called_at" TIMESTAMP(3),
    "next_call_date" DATE,
    "next_call_memo" TEXT,
    "source_type" "ImportSourceType" NOT NULL,
    "source_name" TEXT,
    "source_id" TEXT,
    "imported_at" TIMESTAMP(3),
    "converted_candidate_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "call_leads_tenant_id_status_idx" ON "call_leads"("tenant_id", "status");
CREATE INDEX "call_leads_tenant_id_next_call_date_idx" ON "call_leads"("tenant_id", "next_call_date");
CREATE INDEX "call_leads_tenant_id_applied_at_idx" ON "call_leads"("tenant_id", "applied_at" DESC);
CREATE INDEX "call_leads_tenant_id_email_idx" ON "call_leads"("tenant_id", "email");
CREATE INDEX "call_leads_tenant_id_phone_idx" ON "call_leads"("tenant_id", "phone");
CREATE INDEX "call_leads_tenant_id_assigned_user_id_idx" ON "call_leads"("tenant_id", "assigned_user_id");
CREATE INDEX "call_leads_converted_candidate_id_idx" ON "call_leads"("converted_candidate_id");

ALTER TABLE "call_leads" ADD CONSTRAINT "call_leads_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "call_leads" ADD CONSTRAINT "call_leads_assigned_user_id_fkey"
    FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "call_leads" ADD CONSTRAINT "call_leads_converted_candidate_id_fkey"
    FOREIGN KEY ("converted_candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- call_attempts
CREATE TABLE "call_attempts" (
    "id" UUID NOT NULL,
    "call_lead_id" UUID NOT NULL,
    "called_by_id" UUID NOT NULL,
    "called_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" "CallDialProvider" NOT NULL DEFAULT 'TEL',
    "external_call_id" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "duration" INTEGER,
    "result" "CallAttemptResult",
    "call_status" "CallAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "memo" TEXT,
    "recording_url" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "next_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "call_attempts_call_lead_id_called_at_idx" ON "call_attempts"("call_lead_id", "called_at" DESC);
CREATE INDEX "call_attempts_called_by_id_called_at_idx" ON "call_attempts"("called_by_id", "called_at" DESC);
CREATE INDEX "call_attempts_provider_external_call_id_idx" ON "call_attempts"("provider", "external_call_id");

ALTER TABLE "call_attempts" ADD CONSTRAINT "call_attempts_call_lead_id_fkey"
    FOREIGN KEY ("call_lead_id") REFERENCES "call_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "call_attempts" ADD CONSTRAINT "call_attempts_called_by_id_fkey"
    FOREIGN KEY ("called_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- call_lead_notes
CREATE TABLE "call_lead_notes" (
    "id" UUID NOT NULL,
    "call_lead_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "call_lead_notes_call_lead_id_created_at_idx" ON "call_lead_notes"("call_lead_id", "created_at" DESC);

ALTER TABLE "call_lead_notes" ADD CONSTRAINT "call_lead_notes_call_lead_id_fkey"
    FOREIGN KEY ("call_lead_id") REFERENCES "call_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "call_lead_notes" ADD CONSTRAINT "call_lead_notes_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- import_logs
CREATE TABLE "import_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source_type" "ImportSourceType" NOT NULL,
    "source_name" TEXT,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "duplicate_count" INTEGER NOT NULL DEFAULT 0,
    "out_of_scope_count" INTEGER NOT NULL DEFAULT 0,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ImportLogStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "import_logs_tenant_id_imported_at_idx" ON "import_logs"("tenant_id", "imported_at" DESC);

ALTER TABLE "import_logs" ADD CONSTRAINT "import_logs_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- call_lead_activities
CREATE TABLE "call_lead_activities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "call_lead_id" UUID NOT NULL,
    "user_id" UUID,
    "action" "CallLeadActivityAction" NOT NULL,
    "entity_type" "CallLeadEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_lead_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "call_lead_activities_call_lead_id_occurred_at_idx" ON "call_lead_activities"("call_lead_id", "occurred_at" DESC);
CREATE INDEX "call_lead_activities_tenant_id_occurred_at_idx" ON "call_lead_activities"("tenant_id", "occurred_at" DESC);
CREATE INDEX "call_lead_activities_entity_type_entity_id_idx" ON "call_lead_activities"("entity_type", "entity_id");

ALTER TABLE "call_lead_activities" ADD CONSTRAINT "call_lead_activities_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "call_lead_activities" ADD CONSTRAINT "call_lead_activities_call_lead_id_fkey"
    FOREIGN KEY ("call_lead_id") REFERENCES "call_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "call_lead_activities" ADD CONSTRAINT "call_lead_activities_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
