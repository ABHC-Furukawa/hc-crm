"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResumePdfActions({ resumeId }: { resumeId: string }) {
  const previewUrl = `/api/resumes/${resumeId}/pdf`;
  const downloadUrl = `/api/resumes/${resumeId}/pdf?download=1`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={downloadUrl} target="_blank" rel="noopener noreferrer">
          <Download className="mr-2 h-4 w-4" />
          PDFダウンロード
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={previewUrl} target="_blank" rel="noopener noreferrer">
          <FileText className="mr-2 h-4 w-4" />
          PDFを別タブで開く
        </a>
      </Button>
    </div>
  );
}

export function ResumePdfFrame({ resumeId }: { resumeId: string }) {
  const previewUrl = `/api/resumes/${resumeId}/pdf#toolbar=1`;

  return (
    <div className="overflow-hidden rounded-lg border bg-muted/20">
      <iframe
        title="履歴書 PDF プレビュー"
        src={previewUrl}
        className="h-[min(80vh,1120px)] w-full bg-white"
      />
    </div>
  );
}
