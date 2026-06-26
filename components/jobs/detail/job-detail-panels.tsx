import type { ReactNode } from "react";
import type { Job, RawJob } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobGenderBadge } from "@/components/jobs/job-gender-badge";
import { JobShiftTypeBadge } from "@/components/jobs/job-shift-type-badge";
import { buildShiftTypeDetail } from "@/lib/jobs/normalize/shift-type-detail";
import {
  EMPLOYMENT_TYPE_LABELS,
  formatMaxAge,
  formatSalaryForDisplay,
  formatShiftTypeDetailDisplay,
  formatShiftTypeSummary,
  JOB_FIELD_LABELS,
} from "@/lib/jobs/labels";
import { formatDateTime } from "@/lib/utils";

type JobDetail = Job & {
  rawJob:
    | (Pick<RawJob, "id" | "sheetName" | "rowNumber" | "importedAt"> & {
        rawData?: unknown;
      })
    | null;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-border/50 py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-6">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-relaxed">{value}</dd>
    </div>
  );
}

function resolveShiftTypeDetailText(job: JobDetail): string {
  const stored = job.shiftTypeDetail?.trim();
  if (stored) return formatShiftTypeDetailDisplay(stored, job.shiftType);

  const rawData = job.rawJob?.rawData as Record<string, string> | undefined;
  const fromRaw = buildShiftTypeDetail(rawData);
  return formatShiftTypeDetailDisplay(fromRaw, job.shiftType);
}

export function JobDetailPanels({ job }: { job: JobDetail }) {
  const shiftDetail = resolveShiftTypeDetailText(job);
  const shiftSummary = formatShiftTypeSummary(job.shiftType);
  const showShiftDetail =
    shiftDetail !== "—" && shiftDetail !== shiftSummary;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">案件情報</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow label={JOB_FIELD_LABELS.companyName} value={job.companyName} />
          <DetailRow label={JOB_FIELD_LABELS.jobTitle} value={job.jobTitle} />
          <DetailRow label={JOB_FIELD_LABELS.location} value={job.location ?? "—"} />
          <DetailRow label={JOB_FIELD_LABELS.salary} value={formatSalaryForDisplay(job.salary)} />
          <DetailRow
            label={JOB_FIELD_LABELS.employmentType}
            value={EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          />
          <DetailRow
            label={JOB_FIELD_LABELS.shiftType}
            value={
              <div className="space-y-3">
                <JobShiftTypeBadge shiftType={job.shiftType} />
                {showShiftDetail && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {shiftDetail}
                  </p>
                )}
              </div>
            }
          />
          <DetailRow
            label={JOB_FIELD_LABELS.gender}
            value={<JobGenderBadge gender={job.gender} />}
          />
          <DetailRow
            label={JOB_FIELD_LABELS.maxAge}
            value={formatMaxAge(job.maxAge)}
          />
          <DetailRow label={JOB_FIELD_LABELS.referralFee} value={job.referralFee ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">取込情報</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow label="取込元" value={job.sourceCompany} />
          <DetailRow label="タブ名" value={job.sourceSheet} />
          <DetailRow
            label="取込日時"
            value={
              job.rawJob?.importedAt
                ? formatDateTime(job.rawJob.importedAt)
                : "—"
            }
          />
          {job.rawJob && (
            <DetailRow label="行番号" value={job.rawJob.rowNumber} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">更新履歴</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailRow label="作成日時" value={formatDateTime(job.createdAt)} />
          <DetailRow label="更新日時" value={formatDateTime(job.updatedAt)} />
        </CardContent>
      </Card>
    </div>
  );
}
