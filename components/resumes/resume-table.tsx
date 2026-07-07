import Link from "next/link";
import { Download, Eye, Pencil } from "lucide-react";
import type { ResumeListItem } from "@/lib/resumes/queries";
import { ResumeStatusBadge } from "@/components/resumes/resume-status-actions";
import { formatDateTime, fullName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ResumeTable({ resumes }: { resumes: ResumeListItem[] }) {
  if (resumes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        履歴書がありません。「新規作成」から履歴書を作成してください。
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>氏名</TableHead>
            <TableHead>候補者</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>最終更新</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resumes.map((resume) => (
            <TableRow key={resume.id}>
              <TableCell className="font-medium">{resume.fullName}</TableCell>
              <TableCell>
                {resume.candidate ? (
                  <Link
                    href={`/candidates/${resume.candidate.id}`}
                    className="text-primary hover:underline"
                  >
                    {fullName(resume.candidate.lastName, resume.candidate.firstName)}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">未紐づけ</span>
                )}
              </TableCell>
              <TableCell>
                <ResumeStatusBadge status={resume.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(resume.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/resumes/${resume.id}/edit`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      編集
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/resumes/${resume.id}/preview`}>
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      プレビュー
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/api/resumes/${resume.id}/pdf?download=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      PDF
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {resumes.map((resume) => (
          <div key={resume.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{resume.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resume.candidate
                    ? fullName(resume.candidate.lastName, resume.candidate.firstName)
                    : "未紐づけ"}
                </p>
              </div>
              <ResumeStatusBadge status={resume.status} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              更新: {formatDateTime(resume.updatedAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/resumes/${resume.id}/edit`}>編集</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/resumes/${resume.id}/preview`}>プレビュー</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/api/resumes/${resume.id}/pdf?download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PDF
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
