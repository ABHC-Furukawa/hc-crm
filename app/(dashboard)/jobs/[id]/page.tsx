import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getJobById } from "@/lib/actions/jobs";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { JobDetailPanels } from "@/components/jobs/detail/job-detail-panels";
import { JobGenderBadge } from "@/components/jobs/job-gender-badge";
import { JobShiftTypeBadge } from "@/components/jobs/job-shift-type-badge";
import { JOB_FIELD_LABELS } from "@/lib/jobs/labels";
import { Button } from "@/components/ui/button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  return (
    <>
      <DashboardHeader title={job.jobTitle} />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            案件一覧へ戻る
          </Link>
        </Button>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {JOB_FIELD_LABELS.companyName}: {job.companyName}
          </p>
          <h2 className="text-xl font-semibold leading-snug">{job.jobTitle}</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            <JobShiftTypeBadge shiftType={job.shiftType} />
            <JobGenderBadge gender={job.gender} />
          </div>
        </div>

        <JobDetailPanels job={job} />
      </main>
    </>
  );
}
