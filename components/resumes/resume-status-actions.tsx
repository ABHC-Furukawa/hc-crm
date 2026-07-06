"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { ResumeStatus } from "@prisma/client";
import {
  markResumeDraftAction,
  markResumeReadyAction,
} from "@/lib/actions/resumes";
import { RESUME_STATUS_LABELS } from "@/lib/resumes/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ResumeStatusBadge({ status }: { status: ResumeStatus }) {
  return (
    <Badge variant={status === "READY" ? "default" : "secondary"}>
      {RESUME_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ResumeStatusActions({
  resumeId,
  status,
}: {
  resumeId: string;
  status: ResumeStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleMarkReady() {
    startTransition(async () => {
      const result = await markResumeReadyAction(resumeId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleMarkDraft() {
    startTransition(async () => {
      const result = await markResumeDraftAction(resumeId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ResumeStatusBadge status={status} />
      {status === "DRAFT" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleMarkReady}
          disabled={pending}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {pending ? "更新中…" : "完成にする"}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleMarkDraft}
          disabled={pending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {pending ? "更新中…" : "下書きに戻す"}
        </Button>
      )}
    </div>
  );
}
