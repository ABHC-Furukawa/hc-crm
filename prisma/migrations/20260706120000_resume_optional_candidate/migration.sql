-- Allow resumes without a linked candidate (standalone creation from sidebar)
ALTER TABLE "resumes" DROP CONSTRAINT "resumes_candidate_id_fkey";
ALTER TABLE "resumes" ALTER COLUMN "candidate_id" DROP NOT NULL;
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
