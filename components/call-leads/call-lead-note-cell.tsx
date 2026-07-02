"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { CallLeadStatus } from "@prisma/client";
import type { CallLeadListItem } from "@/lib/call-leads/queries";
import {
  saveCallLeadNoteAction,
  type CallLeadNoteActionState,
} from "@/lib/actions/call-lead-notes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function truncate(text: string, max = 60) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export function CallLeadNoteCell({
  callLeadId,
  notes,
  noteCount,
  status,
  className,
  compact,
}: {
  callLeadId: string;
  notes: CallLeadListItem["notes"];
  noteCount: number;
  status: CallLeadStatus;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const readOnly = status === "CONVERTED";
  const latest = notes[0];
  const [open, setOpen] = useState(false);
  const truncateLen = compact ? 24 : 60;

  const [state, formAction, pending] = useActionState(
    saveCallLeadNoteAction.bind(null, callLeadId),
    {} as CallLeadNoteActionState
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <>
      <div className={cn("group flex items-start gap-1", className)}>
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 text-left",
            compact ? "text-[10px] leading-tight" : "text-sm",
            !readOnly && "hover:text-primary"
          )}
          onClick={() => !readOnly && setOpen(true)}
          disabled={readOnly}
          title={latest?.content ?? (readOnly ? undefined : "クリックして編集")}
        >
          {latest ? (
            <>
              <span className={cn("text-foreground", compact ? "line-clamp-1" : "line-clamp-2")}>
                {truncate(latest.content, truncateLen)}
              </span>
              {noteCount > 1 && !compact && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  他 {noteCount - 1} 件
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">
              {readOnly ? "—" : "メモを追加"}
            </span>
          )}
        </button>
        {!readOnly && !compact && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
            onClick={() => setOpen(true)}
            title="メモを編集"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">編集</span>
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{latest ? "メモを編集" : "メモを追加"}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            {latest && <input type="hidden" name="noteId" value={latest.id} />}
            <Textarea
              name="content"
              key={`${latest?.id ?? "new"}-${open}`}
              defaultValue={latest?.content ?? ""}
              rows={5}
              required
              placeholder="架電メモなど…"
              autoFocus
            />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            {noteCount > 1 && (
              <p className="text-xs text-muted-foreground">
                一覧では最新メモのみ編集できます。
                <Link
                  href={`/call-leads/${callLeadId}?tab=notes`}
                  className="ml-1 text-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  すべて見る
                </Link>
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "保存中…" : "保存"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
