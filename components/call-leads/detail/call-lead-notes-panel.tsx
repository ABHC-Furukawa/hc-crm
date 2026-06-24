"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { CallLeadDetail } from "@/lib/call-leads/queries";
import {
  createCallLeadNoteAction,
  deleteCallLeadNoteAction,
  type CallLeadNoteActionState,
} from "@/lib/actions/call-lead-notes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export function CallLeadNotesPanel({ callLead }: { callLead: CallLeadDetail }) {
  const readOnly = callLead.status === "CONVERTED";

  return (
    <div className="space-y-6">
      {!readOnly && <NoteCreateForm callLeadId={callLead.id} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes ({callLead.notes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {callLead.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">メモはまだありません</p>
          ) : (
            <ul className="space-y-4">
              {callLead.notes.map((note) => (
                <li key={note.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{note.author.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                    {!readOnly && (
                      <DeleteNoteButton noteId={note.id} callLeadId={callLead.id} />
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{note.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NoteCreateForm({ callLeadId }: { callLeadId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createCallLeadNoteAction.bind(null, callLeadId),
    {} as CallLeadNoteActionState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">メモを追加</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="space-y-4"
          onSubmit={() => setTimeout(() => router.refresh(), 0)}
        >
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea id="content" name="content" required rows={4} placeholder="架電メモなど…" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : "メモを保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteNoteButton({
  noteId,
  callLeadId,
}: {
  noteId: string;
  callLeadId: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={async () => {
        if (!confirm("このメモを削除しますか？")) return;
        await deleteCallLeadNoteAction(noteId, callLeadId);
        router.refresh();
      }}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">削除</span>
    </Button>
  );
}
