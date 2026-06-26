"use client";

import Link from "next/link";
import type { Job } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { JobGenderBadge } from "@/components/jobs/job-gender-badge";
import { JobShiftTypeBadge } from "@/components/jobs/job-shift-type-badge";
import {
  EMPLOYMENT_TYPE_LABELS,
  formatMaxAge,
  formatSalaryForDisplay,
  JOB_FIELD_LABELS,
} from "@/lib/jobs/labels";
import { cn, formatDateTime } from "@/lib/utils";

const tableHeadClass = "px-3 py-3 whitespace-nowrap";
const tableCellClass = "px-3 py-3 align-middle";

export function JobTable({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        案件が見つかりません。各タブから紹介料40万円以上の案件を同期してください。
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.companyName}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.jobTitle}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.location}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.salary}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.employmentType}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.shiftType}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.gender}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.maxAge}</TableHead>
              <TableHead className={tableHeadClass}>{JOB_FIELD_LABELS.referralFee}</TableHead>
              <TableHead className={tableHeadClass}>更新日時</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="hover:bg-muted/40">
                <TableCell className={tableCellClass}>{job.companyName}</TableCell>
                <TableCell className={tableCellClass}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {job.jobTitle}
                  </Link>
                </TableCell>
                <TableCell className={tableCellClass}>{job.location ?? "—"}</TableCell>
                <TableCell className={cn(tableCellClass, "whitespace-nowrap")}>
                  {formatSalaryForDisplay(job.salary)}
                </TableCell>
                <TableCell className={tableCellClass}>
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
                </TableCell>
                <TableCell className={tableCellClass}>
                  <JobShiftTypeBadge shiftType={job.shiftType} />
                </TableCell>
                <TableCell className={tableCellClass}>
                  <JobGenderBadge gender={job.gender} />
                </TableCell>
                <TableCell className={cn(tableCellClass, "whitespace-nowrap")}>
                  {formatMaxAge(job.maxAge)}
                </TableCell>
                <TableCell className={cn(tableCellClass, "whitespace-nowrap")}>
                  {job.referralFee ?? "—"}
                </TableCell>
                <TableCell className={cn(tableCellClass, "whitespace-nowrap text-muted-foreground")}>
                  {formatDateTime(job.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 lg:hidden">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block rounded-lg border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-medium leading-snug">{job.jobTitle}</p>
              <p className="text-sm text-muted-foreground">
                {JOB_FIELD_LABELS.companyName}: {job.companyName}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <JobShiftTypeBadge shiftType={job.shiftType} />
              <JobGenderBadge gender={job.gender} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
              <div className="space-y-1">
                <dt className="text-muted-foreground">{JOB_FIELD_LABELS.maxAge}</dt>
                <dd>{formatMaxAge(job.maxAge)}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">{JOB_FIELD_LABELS.salary}</dt>
                <dd>{formatSalaryForDisplay(job.salary)}</dd>
              </div>
              <div className="col-span-2 space-y-1">
                <dt className="text-muted-foreground">{JOB_FIELD_LABELS.location}</dt>
                <dd>{job.location ?? "—"}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </>
  );
}
