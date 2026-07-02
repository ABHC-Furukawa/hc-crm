-- AlterTable
ALTER TABLE "call_leads" ADD COLUMN "source_sheet" TEXT,
ADD COLUMN "source_row_number" INTEGER,
ADD COLUMN "source_hash" TEXT;

CREATE INDEX "call_leads_tenant_id_source_hash_idx" ON "call_leads"("tenant_id", "source_hash");
CREATE INDEX "call_leads_tenant_id_source_name_source_sheet_source_row_number_idx" ON "call_leads"("tenant_id", "source_name", "source_sheet", "source_row_number");
CREATE INDEX "call_leads_tenant_id_created_at_idx" ON "call_leads"("tenant_id", "created_at" DESC);

-- CreateTable
CREATE TABLE "raw_call_leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source_type" "ImportSourceType" NOT NULL,
    "source_name" TEXT,
    "sheet_name" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "source_hash" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL,
    "call_lead_import_log_id" UUID,
    "call_lead_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_call_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_lead_import_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source_type" "ImportSourceType" NOT NULL,
    "source_name" TEXT,
    "sheet_name" TEXT,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "duplicate_count" INTEGER NOT NULL DEFAULT 0,
    "out_of_scope_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ImportLogStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,

    CONSTRAINT "call_lead_import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "raw_call_leads_tenant_id_source_hash_idx" ON "raw_call_leads"("tenant_id", "source_hash");
CREATE INDEX "raw_call_leads_tenant_id_source_name_sheet_name_row_number_idx" ON "raw_call_leads"("tenant_id", "source_name", "sheet_name", "row_number");
CREATE INDEX "raw_call_leads_tenant_id_imported_at_idx" ON "raw_call_leads"("tenant_id", "imported_at" DESC);
CREATE INDEX "call_lead_import_logs_tenant_id_imported_at_idx" ON "call_lead_import_logs"("tenant_id", "imported_at" DESC);

-- AddForeignKey
ALTER TABLE "raw_call_leads" ADD CONSTRAINT "raw_call_leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "raw_call_leads" ADD CONSTRAINT "raw_call_leads_call_lead_import_log_id_fkey" FOREIGN KEY ("call_lead_import_log_id") REFERENCES "call_lead_import_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "raw_call_leads" ADD CONSTRAINT "raw_call_leads_call_lead_id_fkey" FOREIGN KEY ("call_lead_id") REFERENCES "call_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "call_lead_import_logs" ADD CONSTRAINT "call_lead_import_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
