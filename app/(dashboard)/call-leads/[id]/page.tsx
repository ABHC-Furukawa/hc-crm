import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { getCallLeadById } from "@/lib/actions/call-leads";
import { getCallLeadActivitiesForDetail } from "@/lib/actions/call-lead-activities";
import {
  isCallLeadDetailTab,
  type CallLeadDetailTabId,
} from "@/lib/constants/call-lead-labels";
import { requireTenantContext } from "@/lib/tenant/context";
import { getActiveUsersForAssignment } from "@/lib/users/queries";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CallLeadSummaryCard } from "@/components/call-leads/detail/call-lead-summary-card";
import { CallLeadDetailNav } from "@/components/call-leads/detail/call-lead-detail-nav";
import { CallLeadProfilePanel } from "@/components/call-leads/detail/call-lead-profile-panel";
import { CallLeadCallsPanel } from "@/components/call-leads/detail/call-lead-calls-panel";
import { CallLeadActivityPanel } from "@/components/call-leads/detail/call-lead-activity-panel";
import { CallLeadNotesPanel } from "@/components/call-leads/detail/call-lead-notes-panel";
import { CallLeadFollowUpPanel } from "@/components/call-leads/detail/call-lead-followup-panel";
import { Button } from "@/components/ui/button";

export default async function CallLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const activeTab: CallLeadDetailTabId = isCallLeadDetailTab(sp.tab) ? sp.tab : "profile";

  const callLead = await getCallLeadById(id);
  if (!callLead) notFound();

  const { tenantId } = await requireTenantContext();

  const [activities, assignableUsers] = await Promise.all([
    activeTab === "activity" ? getCallLeadActivitiesForDetail(id) : Promise.resolve([]),
    activeTab === "profile"
      ? getActiveUsersForAssignment(tenantId)
      : Promise.resolve([]),
  ]);

  return (
    <>
      <DashboardHeader title={callLead.name} />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/call-leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            架電リストに戻る
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <CallLeadSummaryCard callLead={callLead} />

          <div className="min-w-0 space-y-4">
            <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-muted" />}>
              <CallLeadDetailNav activeTab={activeTab} />
            </Suspense>

            {activeTab === "profile" && (
              <CallLeadProfilePanel
                callLead={callLead}
                assignableUsers={assignableUsers}
                canAssign
              />
            )}
            {activeTab === "calls" && <CallLeadCallsPanel callLead={callLead} />}
            {activeTab === "activity" && (
              <CallLeadActivityPanel activities={activities} />
            )}
            {activeTab === "notes" && <CallLeadNotesPanel callLead={callLead} />}
            {activeTab === "followup" && <CallLeadFollowUpPanel callLead={callLead} />}
          </div>
        </div>
      </main>
    </>
  );
}
