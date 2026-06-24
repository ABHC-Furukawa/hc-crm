import Link from "next/link";
import { Plus } from "lucide-react";
import { getCandidatesForUser } from "@/lib/actions/candidates";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { Button } from "@/components/ui/button";

export default async function CandidatesPage() {
  const candidates = await getCandidatesForUser();

  return (
    <>
      <DashboardHeader title={CANDIDATE_DISPLAY.listTitle} />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {CANDIDATE_DISPLAY.countLabel(candidates.length)}
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              新規登録
            </Link>
          </Button>
        </div>
        <CandidateTable candidates={candidates} />
      </main>
    </>
  );
}
