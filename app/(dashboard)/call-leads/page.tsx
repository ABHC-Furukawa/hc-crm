import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { getCallLeadsForUser } from "@/lib/actions/call-leads";
import { parseCallLeadFilters } from "@/lib/call-leads/filters";
import { requireTenantContext } from "@/lib/tenant/context";
import { getActiveUsersForAssignment } from "@/lib/users/queries";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CallLeadFilters } from "@/components/call-leads/call-lead-filters";
import { CallLeadTable } from "@/components/call-leads/call-lead-table";
import { Button } from "@/components/ui/button";

export default async function CallLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseCallLeadFilters(params);
  const { tenantId } = await requireTenantContext();

  const [callLeads, advisors] = await Promise.all([
    getCallLeadsForUser(params),
    getActiveUsersForAssignment(tenantId),
  ]);

  return (
    <>
      <DashboardHeader title="架電リスト" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {callLeads.length} 件の架電リード
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/call-leads/new">
                <Plus className="mr-2 h-4 w-4" />
                新規登録
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/call-leads/import">
                <Upload className="mr-2 h-4 w-4" />
                CSV 取込
              </Link>
            </Button>
          </div>
        </div>

        <CallLeadFilters
          filters={filters}
          advisors={advisors}
          showAdvisorFilter
        />
        <CallLeadTable callLeads={callLeads} assignableUsers={advisors} />
      </main>
    </>
  );
}
