import {
  getCommunicationFilterOptions,
  getCommunicationsForUser,
} from "@/lib/actions/communications";
import { parseCommunicationFilters } from "@/lib/communications/filters";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CommunicationFilters } from "@/components/communications/communication-filters";
import { CommunicationList } from "@/components/communications/communication-list";
import { CommunicationLogModal } from "@/components/communications/communication-log-modal";

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseCommunicationFilters(params);

  const [communications, filterOptions] = await Promise.all([
    getCommunicationsForUser(filters),
    getCommunicationFilterOptions(),
  ]);

  return (
    <>
      <DashboardHeader title="連絡履歴" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {CANDIDATE_DISPLAY.communicationsScope}
          </p>
          <CommunicationLogModal candidates={filterOptions.candidates} />
        </div>

        <CommunicationFilters filters={filters} options={filterOptions} />
        <CommunicationList communications={communications} />
      </main>
    </>
  );
}
