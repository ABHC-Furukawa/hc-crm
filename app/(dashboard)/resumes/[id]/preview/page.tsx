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
            <ResumePdfActions resumeId={id} />
            <Button asChild>
              <Link href={`/resumes/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>PDF プレビュー</CardTitle>
            <CardDescription>
              A4・JIS風テンプレートの PDF です。ダウンロードすると出力履歴に記録されます。
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

        <Card>
          <CardHeader>
            <CardTitle>HTML プレビュー</CardTitle>
            <CardDescription>編集内容の簡易確認用です</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto bg-muted/30 p-4 sm:p-6">
            <ResumePreviewDocument
              resume={resume}
              jsonFields={jsonFields}
              photoDisplayUrl={photoDisplayUrl}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
