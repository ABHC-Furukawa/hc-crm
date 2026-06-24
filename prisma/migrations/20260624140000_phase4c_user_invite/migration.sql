-- Phase 4c: メール招待フロー用フラグ
ALTER TABLE "users" ADD COLUMN "pending_invite" BOOLEAN NOT NULL DEFAULT false;
