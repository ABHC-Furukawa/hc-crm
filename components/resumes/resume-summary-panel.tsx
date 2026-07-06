"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { createResumeFromCandidateAction, syncResumeFromCandidateAction } from "@/lib/actions/resumes";
import type { ResumeSummaryItem } from "@/lib/resumes/queries";
import {
  RESUME_STATUS_LABELS,
  RESUME_TEMPLATE_LABELS,
} from "@/lib/resumes/constants";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ResumeSummaryPanel({
  candidateId,
  candidateName,
  resume,
  compact,
}: {
  candidateId: string;
  candidateName: string;
  resume: ResumeSummaryItem | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [creating, startCreate] = useTransition();

  function handleCreate() {
    startCreate(async () => {
      await createResumeFromCandidateAction(candidateId);
      router.refresh();
    });
  }

  if (!resume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>履歴書</CardTitle>
          <CardDescription>
            {candidateName} さんの履歴書です。プロフィールから自動反映された項目も、作成後はすべて編集できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreate} disabled={creating}>
            <FileText className="mr-2 h-4 w-4" />
            {creating ? "作成中…" : "履歴書を作成"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>履歴書</CardTitle>
          <CardDescription>
            {RESUME_TEMPLATE_LABELS[resume.templateType]}
          </CardDescription>
        </div>
        <Badge variant={resume.status === "READY" ? "default" : "secondary"}>
          {RESUME_STATUS_LABELS[resume.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">氏名</dt>
            <dd className="font-medium">{resume.fullName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">最終更新</dt>
            <dd>{formatDateTime(resume.updatedAt)}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button asChild size={compact ? "sm" : "default"}>
            <Link href={`/resumes/${resume.id}/edit`}>編集</Link>
          </Button>
          <Button asChild variant="outline" size={compact ? "sm" : "default"}>
            <Link href={`/resumes/${resume.id}/preview`}>プレビュー</Link>
          </Button>
          <Button asChild variant="outline" size={compact ? "sm" : "default"}>
            <Link href={`/api/resumes/${resume.id}/pdf?download=1`} target="_blank" rel="noopener noreferrer">
              PDF
            </Link>
          </Button>
          {!compact && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/candidates/${candidateId}/resume`}>詳細を見る</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResumeSyncButton({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSync() {
    if (!confirm("候補者プロフィールの基本情報で上書きします。よろしいですか？")) {
      return;
    }
    startTransition(async () => {
      const result = await syncResumeFromCandidateAction(resumeId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={pending}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "反映中…" : "候補者から再反映"}
    </Button>
  );
}
