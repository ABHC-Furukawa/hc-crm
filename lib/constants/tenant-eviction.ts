import {
  ApplicationStatus,
  CallLeadStatus,
  CandidateStatus,
} from "@prisma/client";

/** 退避不可 — 求職者化済み・ヒアリング中 */
export const PROTECTED_CALL_LEAD_STATUSES: CallLeadStatus[] = [
  CallLeadStatus.CONVERTED,
  CallLeadStatus.HEARING,
];

/** 退避不可 — 終端（成功）+ 進行中ファネル */
export const PROTECTED_CANDIDATE_STATUSES: CandidateStatus[] = [
  CandidateStatus.HEARING,
  CandidateStatus.JOB_PROPOSAL,
  CandidateStatus.ENTRY,
  CandidateStatus.INTERVIEW_PREP,
  CandidateStatus.FIRST_INTERVIEW,
  CandidateStatus.FACTORY_TOUR,
  CandidateStatus.OFFER_ACCEPTED,
  CandidateStatus.JOINED,
];

/** 進行中 Application — 保有する Candidate は退避不可 */
export const PROTECTED_APPLICATION_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.DRAFT,
  ApplicationStatus.APPLIED,
  ApplicationStatus.SCREENING,
  ApplicationStatus.INTERVIEW_1,
  ApplicationStatus.INTERVIEW_2,
  ApplicationStatus.INTERVIEW_FINAL,
  ApplicationStatus.OFFER,
];

/** 終了 Application — 退避候補になり得る */
export const TERMINAL_APPLICATION_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.ACCEPTED,
  ApplicationStatus.REJECTED_BY_COMPANY,
  ApplicationStatus.REJECTED_BY_CANDIDATE,
  ApplicationStatus.WITHDRAWN,
];
