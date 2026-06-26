import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserRole } from "@prisma/client";
import { getJobSyncStatus } from "@/lib/actions/job-sync";
import { requireTenantContext } from "@/lib/tenant/context";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import {
  JobImportLogList,
  JobSyncPanel,
  JobSyncStatusTable,
} from "@/components/jobs/job-sync-panel";
import { Button } from "@/components/ui/button";

export default async function JobsSyncPage() {
  const { user } = await requireTenantContext();
  const { status, logs, configs } = await getJobSyncStatus();

  const canSync =
    user.role === UserRole.ADMIN ||
    user.role === UserRole.DEVELOP ||
    user.role === UserRole.MANAGER;

  return (
    <>
      <DashboardHeader title="スプレッドシート同期" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            案件一覧へ戻る
          </Link>
        </Button>

        {status.spreadsheetId && (
          <p className="text-sm text-muted-foreground">
            Spreadsheet ID: {status.spreadsheetId}
          </p>
        )}

        <JobSyncPanel
          configs={configs}
          configured={status.configured}
          canSync={canSync}
        />
        <JobSyncStatusTable companies={status.companies} />
        <JobImportLogList logs={logs} />
      </main>
    </>
  );
}
