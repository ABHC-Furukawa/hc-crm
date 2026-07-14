import { Suspense } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { getJobsForUser } from "@/lib/actions/jobs";
import { canExportJobsCsv } from "@/lib/auth/rbac";
import { parseJobFilters } from "@/lib/jobs/filters";
import { requireTenantContext } from "@/lib/tenant/context";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { JobCsvDownloadButton } from "@/components/jobs/job-csv-download-button";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobPagination } from "@/components/jobs/job-pagination";
import { JobTable } from "@/components/jobs/job-table";
import { JobsMapOpenButton } from "@/components/jobs/jobs-map-open-button";
import { Button } from "@/components/ui/button";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseJobFilters(params);
  const [{ user }, result] = await Promise.all([
    requireTenantContext(),
    getJobsForUser(params),
  ]);
  const canExport = canExportJobsCsv(user.role);

  return (
    <>
      <DashboardHeader title="案件管理" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {result.total} 件の案件
            {result.totalPages > 1 && ` · ${result.page} / ${result.totalPages} ページ`}
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canExport && <JobCsvDownloadButton />}
            <Suspense
              fallback={
                <Button variant="outline" className="w-full sm:w-auto" disabled>
                  マップで見る
                </Button>
              }
            >
              <JobsMapOpenButton />
            </Suspense>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/jobs/sync">
                <RefreshCw className="mr-2 h-4 w-4" />
                シート同期
              </Link>
            </Button>
          </div>
        </div>

        <JobFilters filters={filters} />
        <JobTable jobs={result.items} />
        <JobPagination
          filters={filters}
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
        />
      </main>
    </>
  );
}
