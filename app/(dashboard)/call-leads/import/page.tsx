import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getGoogleSheetSyncInfo,
  getRecentCallLeadImportLogs,
} from "@/lib/actions/call-lead-import";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import {
  CallLeadGoogleSheetSyncForm,
  CallLeadImportForm,
} from "@/components/call-leads/call-lead-import-form";
import { ImportLogList } from "@/components/call-leads/import-log-list";
import { Button } from "@/components/ui/button";

export default async function CallLeadsImportPage() {
  const [logs, sheetInfo] = await Promise.all([
    getRecentCallLeadImportLogs(),
    getGoogleSheetSyncInfo(),
  ]);

  return (
    <>
      <DashboardHeader title="架電リスト取込" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/call-leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            架電リストへ戻る
          </Link>
        </Button>

        {sheetInfo && (
          <CallLeadGoogleSheetSyncForm
            sheetName={sheetInfo.sheetName}
            configured={sheetInfo.configured}
            initialLimit={sheetInfo.initialLimit}
            fullSyncMode={sheetInfo.fullSyncMode}
          />
        )}
        <CallLeadImportForm />
        <ImportLogList logs={logs} />
      </main>
    </>
  );
}
