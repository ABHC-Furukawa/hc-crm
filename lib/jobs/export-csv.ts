import type { Job } from "@prisma/client";
import {
  EMPLOYMENT_TYPE_LABELS,
  formatMaxAge,
  formatSalaryForDisplay,
  JOB_FIELD_LABELS,
  JOB_GENDER_LABELS,
} from "@/lib/jobs/labels";
import { formatDateTime } from "@/lib/utils";

const CSV_HEADERS = [
  JOB_FIELD_LABELS.companyName,
  JOB_FIELD_LABELS.jobTitle,
  JOB_FIELD_LABELS.location,
  JOB_FIELD_LABELS.salary,
  JOB_FIELD_LABELS.employmentType,
  JOB_FIELD_LABELS.shiftType,
  JOB_FIELD_LABELS.gender,
  JOB_FIELD_LABELS.maxAge,
  JOB_FIELD_LABELS.referralFee,
  JOB_FIELD_LABELS.otherNotes,
  JOB_FIELD_LABELS.sourceUrl,
  "ソース会社",
  "ソースシート",
  "更新日時",
] as const;

export function formatJobCsvExportDate(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date).replace(/-/g, "");
}

export function buildJobListCsvFilename(date = new Date()): string {
  return `案件一覧_40万円以上_${formatJobCsvExportDate(date)}.csv`;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function jobToCsvRow(job: Job): string[] {
  return [
    job.companyName,
    job.jobTitle,
    job.location ?? "",
    formatSalaryForDisplay(job.salary) === "—" ? "" : formatSalaryForDisplay(job.salary),
    EMPLOYMENT_TYPE_LABELS[job.employmentType],
    job.shiftType ?? "",
    JOB_GENDER_LABELS[job.gender],
    formatMaxAge(job.maxAge) === "—" ? "" : formatMaxAge(job.maxAge),
    job.referralFee ?? "",
    job.otherNotes ?? "",
    job.sourceUrl ?? "",
    job.sourceCompany,
    job.sourceSheet,
    formatDateTime(job.updatedAt),
  ];
}

export function buildJobListCsv(jobs: Job[]): string {
  const lines = [
    CSV_HEADERS.map(escapeCsvField).join(","),
    ...jobs.map((job) => jobToCsvRow(job).map(escapeCsvField).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}
