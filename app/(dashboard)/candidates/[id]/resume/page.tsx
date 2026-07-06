import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCandidateById } from "@/lib/actions/candidates";
import { getResumeSummaryForCandidate } from "@/lib/actions/resumes";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { ResumeSummaryPanel } from "@/components/resumes/resume-summary-panel";
import { Button } from "@/components/ui/button";
import { fullName } from "@/lib/utils";

export default async function CandidateResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  const resume = await getResumeSummaryForCandidate(id);
  const name = fullName(candidate.lastName, candidate.firstName);

  return (
    <>
      <DashboardHeader title={`${name} — 履歴書`} />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/candidates/${id}?tab=resume`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            候補者詳細に戻る
          </Link>
        </Button>

        <ResumeSummaryPanel
          candidateId={id}
          candidateName={name}
          resume={resume}
        />
      </main>
    </>
  );
}
