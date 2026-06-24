import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRecentImportLogs } from "@/lib/actions/call-lead-import";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CallLeadImportForm } from "@/components/call-leads/call-lead-import-form";
import { ImportLogList } from "@/components/call-leads/import-log-list";
import { Button } from "@/components/ui/button";

export default async function CallLeadsImportPage() {
  const logs = await getRecentImportLogs();

  return (
    <>
      <DashboardHeader title="架電リスト CSV 取込" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/call-leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            架電リストへ戻る
          </Link>
        </Button>

        <CallLeadImportForm />
        <ImportLogList logs={logs} />
      </main>
    </>
  );
}
