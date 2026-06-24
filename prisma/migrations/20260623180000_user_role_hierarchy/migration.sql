-- Phase R: DEVELOP role + manager hierarchy (Option A)

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DEVELOP';

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "manager_id" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_manager_id_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_manager_id_fkey"
      FOREIGN KEY ("manager_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "users_manager_id_idx" ON "users"("manager_id");
