-- AlterTable
ALTER TABLE "candidates" ADD COLUMN "referrable_dispatch_company_keys" TEXT[] DEFAULT ARRAY[]::TEXT[];
