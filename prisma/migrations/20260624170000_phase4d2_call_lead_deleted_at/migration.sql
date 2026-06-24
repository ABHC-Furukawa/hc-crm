-- Phase 4d-2: CallLead 退避（ソフトデリート）

ALTER TABLE "call_leads" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "call_leads_tenant_id_deleted_at_idx"
  ON "call_leads"("tenant_id", "deleted_at");
