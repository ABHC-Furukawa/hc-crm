import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getResumePickerCandidates } from "@/lib/actions/resumes";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { ResumeNewForm } from "@/components/resumes/resume-new-form";
import { ResumeWorkflowSteps } from "@/components/resumes/resume-list-filters";
import { Button } from "@/components/ui/button";

export default async function ResumeNewPage() {
  const candidates = await getResumePickerCandidates();

  return (
    <>
      <DashboardHeader title="履歴書 — 新規作成" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/resumes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Link>
        </Button>

        <ResumeWorkflowSteps current="create" />

        <div className="mx-auto max-w-xl">
          <ResumeNewForm candidates={candidates} />
        </div>
      </main>
    </>
  );
}
