import Link from "next/link";
import { Plus } from "lucide-react";
import { getResumeListForUser } from "@/lib/actions/resumes";
import { parseResumeFilters } from "@/lib/resumes/filters";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import {
  ResumeListFilters,
  ResumeWorkflowSteps,
} from "@/components/resumes/resume-list-filters";
import { ResumeTable } from "@/components/resumes/resume-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ResumesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseResumeFilters(params);
  const resumes = await getResumeListForUser(params);

  return (
    <>
      <DashboardHeader title="履歴書作成" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">作成の流れ</CardTitle>
            <CardDescription>
              候補者から作成 → 内容を編集 → 完成にする → PDF を出力
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeWorkflowSteps current="create" />
          </CardContent>
        </Card>

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

        <ResumeListFilters filters={filters} />
        <ResumeTable resumes={resumes} />
      </main>
    </>
  );
}
