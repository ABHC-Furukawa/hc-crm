"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { CandidateDetail } from "@/types/candidate";
import type { CommunicationListItem } from "@/lib/communications/queries";
import {
  deleteCommunicationAction,
  updateCommunicationLogAction,
} from "@/lib/actions/communications";
import { CommunicationLogFormFields } from "@/components/candidates/detail/communication-log-form-fields";
import { toDateTimeLocalValue } from "@/lib/validators/job-case";
import {
  AI_SUMMARY_STATUS_LABELS,
  CALL_STATUS_LABELS,
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_DIRECTION_LABELS,
  COMMUNICATION_STATUS_LABELS,
  formatDuration,
  PBX_PROVIDER_LABELS,
  RECORDING_STATUS_LABELS,
  TRANSCRIPT_STATUS_LABELS,
} from "@/lib/constants/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, fullName } from "@/lib/utils";
import {
  Phone,
  Mail,
  MessageCircle,
  MessagesSquare,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import type { CommunicationChannel } from "@prisma/client";

type Comm = CandidateDetail["communications"][number] | CommunicationListItem;

const CHANNEL_ICONS: Record<CommunicationChannel, React.ComponentType<{ className?: string }>> = {
  CALL: Phone,
  EMAIL: Mail,
  SMS: MessageCircle,
  LINE: MessagesSquare,
  MEETING: Calendar,
  OTHER: MoreHorizontal,
};

export function CommunicationItem({
  communication,
  candidateId,
  showCandidateLink = false,
}: {
  communication: Comm;
  candidateId: string;
  showCandidateLink?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const Icon = CHANNEL_ICONS[communication.channel];
  const { call, emailMessage, lineMessage } = communication;
  const candidate =
    "candidate" in communication && communication.candidate
      ? communication.candidate
      : null;

  if (editing) {
    return (
      <article className="rounded-lg border p-4">
        <CommunicationEditForm
          communication={communication}
          candidateId={candidateId}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </article>
    );
  }

  return (
    <article className="rounded-lg border p-4">
      {showCandidateLink && candidate && (
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b pb-3">
          <Link
            href={`/candidates/${candidate.id}?tab=communications`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {fullName(candidate.lastName, candidate.firstName)}
          </Link>
          {candidate.assignments.length > 0 && (
            <span className="text-xs text-muted-foreground">
              担当: {candidate.assignments.map((a) => a.user.name).join("、")}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {COMMUNICATION_CHANNEL_LABELS[communication.channel]}
              </span>
              <Badge variant="outline">
                {COMMUNICATION_DIRECTION_LABELS[communication.direction]}
              </Badge>
              <Badge variant="secondary">
                {COMMUNICATION_STATUS_LABELS[communication.status]}
              </Badge>
            </div>

            {communication.subject && (
              <p className="text-sm font-medium">{communication.subject}</p>
            )}
            {communication.body && (
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                {communication.body}
              </p>
            )}

            {call && <CallExtension call={call} />}

            {emailMessage && (
              <p className="text-xs text-muted-foreground">
                From: {emailMessage.fromAddress}
                {emailMessage.messageId && ` · ${emailMessage.messageId.slice(0, 20)}…`}
              </p>
            )}

            {lineMessage && (
              <p className="text-xs text-muted-foreground">
                LINE · {lineMessage.messageType}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right text-xs text-muted-foreground">
            <p>{formatDateTime(communication.occurredAt)}</p>
            <p>{communication.user?.name ?? "—"}</p>
          </div>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-3 w-3" />
              編集
            </Button>
            <form action={deleteCommunicationAction.bind(null, communication.id, candidateId)}>
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
      </div>
    </article>
  );
}

function CommunicationEditForm({
  communication,
  candidateId,
  onCancel,
  onSaved,
}: {
  communication: Comm;
  candidateId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateCommunicationLogAction.bind(null, communication.id, candidateId),
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
      <p className="text-sm font-medium">連絡履歴を編集</p>
      <CommunicationLogFormFields
        defaultValues={{
          channel: communication.channel,
          direction: communication.direction,
          subject: communication.subject ?? "",
          body: communication.body ?? "",
          status: communication.status,
          occurredAt: toDateTimeLocalValue(communication.occurredAt),
          callStatus: communication.call?.callStatus,
          durationSeconds: communication.call?.durationSeconds?.toString() ?? "",
        }}
      />
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

function CallExtension({ call }: { call: NonNullable<Comm["call"]> }) {
  return (
    <div className="mt-2 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
        通話詳細
      </p>
      <dl className="grid gap-1.5 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">プロバイダ</dt>
          <dd>{PBX_PROVIDER_LABELS[call.provider]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">ステータス</dt>
          <dd>{CALL_STATUS_LABELS[call.callStatus]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">通話時間</dt>
          <dd>{formatDuration(call.durationSeconds)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">発信元 → 着信先</dt>
          <dd className="font-mono text-xs">
            {call.fromNumber} → {call.toNumber}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">応答CA</dt>
          <dd>{call.answeredBy?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">録音</dt>
          <dd>
            {RECORDING_STATUS_LABELS[call.recordingStatus]}
            {call.recordingUrl && (
              <>
                {" · "}
                <a
                  href={call.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  再生
                </a>
              </>
            )}
          </dd>
        </div>
        {(call.startedAt || call.answeredAt || call.endedAt) && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">タイムライン</dt>
            <dd className="text-xs">
              {call.startedAt && `開始 ${formatDateTime(call.startedAt)}`}
              {call.answeredAt && ` · 応答 ${formatDateTime(call.answeredAt)}`}
              {call.endedAt && ` · 終了 ${formatDateTime(call.endedAt)}`}
            </dd>
          </div>
        )}
        {call.externalCallId && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">PBX ID</dt>
            <dd className="font-mono text-xs">
              {call.provider} / {call.externalCallId}
            </dd>
          </div>
        )}
        {call.transcriptStatus !== "NONE" && (
          <div>
            <dt className="text-xs text-muted-foreground">文字起こし</dt>
            <dd>{TRANSCRIPT_STATUS_LABELS[call.transcriptStatus]}</dd>
          </div>
        )}
        {call.aiSummaryStatus !== "NONE" && (
          <div>
            <dt className="text-xs text-muted-foreground">AI要約</dt>
            <dd>{AI_SUMMARY_STATUS_LABELS[call.aiSummaryStatus]}</dd>
          </div>
        )}
      </dl>
      {call.transcript && (
        <div className="mt-2 border-t border-primary/20 pt-2">
          <p className="text-xs font-medium text-muted-foreground">文字起こし</p>
          <p className="mt-1 line-clamp-4 text-sm">{call.transcript}</p>
        </div>
      )}
      {call.aiSummary && (
        <div className="mt-2 border-t border-primary/20 pt-2">
          <p className="text-xs font-medium text-muted-foreground">AI要約</p>
          <p className="mt-1 line-clamp-4 text-sm">{call.aiSummary}</p>
        </div>
      )}
      {!call.externalCallId && (
        <p className="mt-2 text-xs text-muted-foreground">
          ※ PBX連携時は external_call_id / 録音 / AI要約が自動反映されます
        </p>
      )}
    </div>
  );
}
