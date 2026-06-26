import type { Job } from "@prisma/client";
import type { DispatchCompanyKey } from "@/lib/constants/dispatch-companies";
import { parseReferralFeeYen } from "@/lib/jobs/normalize/utils";

/** Google Sheets タブ companyKey → 候補者案件の派遣会社キー */
export const JOB_SOURCE_TO_DISPATCH_KEY: Record<string, DispatchCompanyKey> = {
  "sogo-career": "SOGO_CAREER",
  "ns-haken": "NS_TECH",
  "ns-seishain": "NS_TECH",
  hirayama: "HIRAYAMA",
  "yokota-enterprise": "YOKOTA",
  "ut-aim": "UT_AIM",
  wic: "WORLD_INTEC",
  "takagi-kogyo": "TAKAKOGYO",
  nikken: "NIKKEN",
  "brexa-next": "BREXA_NEXT",
  "jisha-haken": "ABHC",
};

export function referralFeeStringToManYen(
  value: string | null | undefined
): number | null {
  const yen = parseReferralFeeYen(value ?? null);
  if (yen == null) return null;
  return Math.round(yen / 10_000);
}

export function resolveDispatchFromJob(job: Pick<Job, "sourceCompany" | "companyName">): {
  dispatchCompanyKey: DispatchCompanyKey | "OTHER";
  dispatchCompanyOther: string | null;
} {
  const mapped = JOB_SOURCE_TO_DISPATCH_KEY[job.sourceCompany];
  if (mapped) {
    return { dispatchCompanyKey: mapped, dispatchCompanyOther: null };
  }

  return {
    dispatchCompanyKey: "OTHER",
    dispatchCompanyOther: job.companyName?.trim() || null,
  };
}

export type JobCaseDefaultsFromJob = {
  jobId: string;
  entryJobName: string;
  dispatchCompanyKey: DispatchCompanyKey | "OTHER";
  dispatchCompanyOther: string | null;
  referralFee: number | null;
};

export function buildJobCaseDefaultsFromJob(job: Job): JobCaseDefaultsFromJob {
  const dispatch = resolveDispatchFromJob(job);
  return {
    jobId: job.id,
    entryJobName: job.jobTitle,
    dispatchCompanyKey: dispatch.dispatchCompanyKey,
    dispatchCompanyOther: dispatch.dispatchCompanyOther,
    referralFee: referralFeeStringToManYen(job.referralFee),
  };
}

export type JobPickerItem = Pick<
  Job,
  "id" | "jobTitle" | "companyName" | "location" | "referralFee" | "sourceCompany"
>;

export function formatJobPickerLabel(job: JobPickerItem): string {
  const parts = [job.jobTitle, job.companyName];
  if (job.location?.trim()) parts.push(job.location.trim());
  return parts.join(" / ");
}
