import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getResumeByIdForUser } from "@/lib/actions/resumes";
import { parseResumeJsonFields } from "@/lib/resumes/parse-json";
import { getResumePhotoSignedUrl } from "@/lib/resumes/storage";
import { formatDateTime } from "@/lib/utils";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { ResumePreviewDocument } from "@/components/resumes/resume-preview-document";
import { ResumePdfActions, ResumePdfFrame } from "@/components/resumes/resume-pdf-actions";
import { ResumeBackLink } from "@/components/resumes/resume-nav-links";
import { ResumeWorkflowSteps } from "@/components/resumes/resume-list-filters";
import { ResumeExportHistory } from "@/components/resumes/resume-export-history";
import { ResumeStatusActions } from "@/components/resumes/resume-status-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ResumePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resume = await getResumeByIdForUser(id);
  if (!resume) notFound();

  const jsonFields = parseResumeJsonFields(resume);
  const photoDisplayUrl = await getResumePhotoSignedUrl(resume.photoUrl);
  const lastExport = resume.exportLogs[0] ?? null;

  return (
    <>
      <DashboardHeader title={`履歴書プレビュー — ${resume.fullName}`} />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ResumeBackLink resume={resume} />
          <div className="flex flex-wrap items-center gap-2">
            <ResumeStatusActions resumeId={id} status={resume.status} />
            <ResumePdfActions resumeId={id} />
            <Button asChild>
              <Link href={`/resumes/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </Link>
            </Button>
          </div>
        </div>

        <ResumeWorkflowSteps
          current={resume.status === "READY" ? "export" : "edit"}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>PDF プレビュー</CardTitle>
              <CardDescription>
                A4・JIS風テンプレートです。ダウンロードすると出力履歴に記録されます。
                {lastExport && (
                  <span className="mt-1 block">
                    最終出力: {formatDateTime(lastExport.exportedAt)}
                    {lastExport.exportedBy?.name
                      ? `（${lastExport.exportedBy.name}）`
                      : ""}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumePdfFrame resumeId={id} />
            </CardContent>
          </Card>

          <aside className="space-y-4">
            {resume.status === "DRAFT" && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">完成前の確認</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  内容を確認したら「完成にする」を押してください。完成後に PDF を共有する運用がおすすめです。
                </CardContent>
              </Card>
            )}
            <ResumeExportHistory exportLogs={resume.exportLogs} />
          </aside>
        </div>

        <details className="rounded-lg border bg-card">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
            HTML プレビューを表示（簡易確認用）
          </summary>
          <div className="overflow-x-auto border-t bg-muted/30 p-4 sm:p-6">
            <ResumePreviewDocument
              resume={resume}
              jsonFields={jsonFields}
              photoDisplayUrl={photoDisplayUrl}
            />
          </div>
        </details>
      </main>
    </>
  );
}
