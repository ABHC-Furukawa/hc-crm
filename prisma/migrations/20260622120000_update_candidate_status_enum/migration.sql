-- Replace CandidateStatus enum with recruitment workflow statuses

ALTER TYPE "CandidateStatus" RENAME TO "CandidateStatus_old";

CREATE TYPE "CandidateStatus" AS ENUM (
  'HEARING',
  'JOB_PROPOSAL',
  'ENTRY',
  'INTERVIEW_PREP',
  'FIRST_INTERVIEW',
  'FACTORY_TOUR',
  'OFFER_ACCEPTED',
  'JOINED',
  'WITHDRAWN',
  'REJECTED',
  'UNREACHABLE',
  'NOT_REFERRABLE',
  'LOST'
);

ALTER TABLE "candidates"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "CandidateStatus"
    USING (
      CASE "status"::text
        WHEN 'NEW' THEN 'HEARING'
        WHEN 'CONTACTING' THEN 'HEARING'
        WHEN 'INTERVIEWING' THEN 'FIRST_INTERVIEW'
        WHEN 'OFFER' THEN 'OFFER_ACCEPTED'
        WHEN 'PLACED' THEN 'JOINED'
        WHEN 'ON_HOLD' THEN 'HEARING'
        WHEN 'WITHDRAWN' THEN 'WITHDRAWN'
        WHEN 'REJECTED' THEN 'REJECTED'
        ELSE 'HEARING'
      END
    )::"CandidateStatus",
  ALTER COLUMN "status" SET DEFAULT 'HEARING';

DROP TYPE "CandidateStatus_old";
