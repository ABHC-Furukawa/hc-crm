"use client";

import Link from "next/link";
import type { ResumeListItem } from "@/lib/resumes/queries";
import { RESUME_STATUS_LABELS } from "@/lib/resumes/constants";
import { formatDateTime, fullName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
    <div className="overflow-x-auto rounded-lg border">
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
                <Badge variant={resume.status === "READY" ? "default" : "secondary"}>
                  {RESUME_STATUS_LABELS[resume.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(resume.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/resumes/${resume.id}/edit`}
                    className="text-sm text-primary hover:underline"
                  >
                    編集
                  </Link>
                  <Link
                    href={`/resumes/${resume.id}/preview`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    プレビュー
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
