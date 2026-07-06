import Link from "next/link";
import { Plus } from "lucide-react";
import { getResumeListForUser } from "@/lib/actions/resumes";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { ResumeTable } from "@/components/resumes/resume-table";
import { Button } from "@/components/ui/button";

export default async function ResumesPage() {
  const resumes = await getResumeListForUser();

  return (
    <>
      <DashboardHeader title="履歴書作成" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {resumes.length} 件の履歴書
          </p>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/resumes/new">
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Link>
          </Button>
        </div>
        <ResumeTable resumes={resumes} />
      </main>
    </>
  );
}
