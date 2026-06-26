import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { getJobsForUser } from "@/lib/actions/jobs";
import { parseJobFilters } from "@/lib/jobs/filters";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobPagination } from "@/components/jobs/job-pagination";
import { JobTable } from "@/components/jobs/job-table";
import { Button } from "@/components/ui/button";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseJobFilters(params);
  const result = await getJobsForUser(params);

  return (
    <>
      <DashboardHeader title="案件管理" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {result.total} 件の案件
            {result.totalPages > 1 && ` · ${result.page} / ${result.totalPages} ページ`}
          </p>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/jobs/sync">
              <RefreshCw className="mr-2 h-4 w-4" />
              シート同期
            </Link>
          </Button>
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
