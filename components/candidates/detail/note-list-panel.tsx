"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Pin, Pencil, Trash2 } from "lucide-react";
import type { CandidateDetail } from "@/types/candidate";
import {
  createNoteAction,
  deleteNoteAction,
  toggleNotePinAction,
  updateNoteAction,
} from "@/lib/actions/notes";
import { NOTE_TYPE_LABELS } from "@/lib/constants/labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { NoteType } from "@prisma/client";

export function NoteListPanel({ candidate }: { candidate: CandidateDetail }) {
  const [state, formAction, pending] = useActionState(
    createNoteAction.bind(null, candidate.id),
    {}
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>メモを追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">種別</Label>
              <select
                id="type"
                name="type"
                defaultValue={NoteType.GENERAL}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm sm:max-w-xs"
              >
                {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">内容</Label>
              <Textarea id="content" name="content" required rows={4} placeholder="面談メモ、所感など..." />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : "メモを保存"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>メモ一覧 ({candidate.notes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">メモはまだありません</p>
          ) : (
            <ul className="space-y-4">
              {candidate.notes.map((note) => (
                <NoteItem key={note.id} note={note} candidateId={candidate.id} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NoteItem({
  note,
  candidateId,
}: {
  note: CandidateDetail["notes"][number];
  candidateId: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li
        className={`rounded-lg border p-4 ${note.isPinned ? "border-primary/40 bg-primary/5" : ""}`}
      >
        <NoteEditForm
          note={note}
          candidateId={candidateId}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </li>
    );
  }

  return (
    <li
      className={`rounded-lg border p-4 ${note.isPinned ? "border-primary/40 bg-primary/5" : ""}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{NOTE_TYPE_LABELS[note.type]}</Badge>
          {note.isPinned && (
            <Badge variant="secondary" className="gap-1">
              <Pin className="h-3 w-3" /> ピン留め
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="mr-1 h-3 w-3" />
            編集
          </Button>
          <form action={toggleNotePinAction.bind(null, note.id, candidateId)}>
            <Button type="submit" size="sm" variant="ghost">
              {note.isPinned ? "ピン解除" : "ピン留め"}
            </Button>
          </form>
          <form action={deleteNoteAction.bind(null, note.id, candidateId)}>
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              削除
            </Button>
          </form>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm">{note.content}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {note.author.name} · {formatDateTime(note.createdAt)}
        {note.updatedAt > note.createdAt && ` · 更新: ${formatDateTime(note.updatedAt)}`}
      </p>
    </li>
  );
}

function NoteEditForm({
  note,
  candidateId,
  onCancel,
  onSaved,
}: {
  note: CandidateDetail["notes"][number];
  candidateId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateNoteAction.bind(null, note.id, candidateId),
    {}
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onSaved();
    }
    wasPending.current = pending;
  }, [pending, state.error, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`edit-type-${note.id}`}>種別</Label>
        <select
          id={`edit-type-${note.id}`}
          name="type"
          defaultValue={note.type}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm sm:max-w-xs"
        >
          {Object.entries(NOTE_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`edit-content-${note.id}`}>内容</Label>
        <Textarea
          id={`edit-content-${note.id}`}
          name="content"
          required
          rows={4}
          defaultValue={note.content}
        />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "保存中..." : "保存"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
