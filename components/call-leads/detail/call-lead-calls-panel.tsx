"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { CallAttempt, User } from "@prisma/client";
import type { CallLeadDetail } from "@/lib/call-leads/queries";
import {
  recordCallAttemptResultAction,
  type CallAttemptActionState,
} from "@/lib/actions/call-attempts";
import { CallLeadPhoneActions } from "@/components/call-leads/call-lead-phone-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CALL_ATTEMPT_RESULT_LABELS,
  CALL_ATTEMPT_STATUS_LABELS,
} from "@/lib/constants/call-lead-labels";
import { formatDateTime } from "@/lib/utils";
import { formatDuration as formatDurationLabel } from "@/lib/constants/labels";

type AttemptRow = CallAttempt & {
  calledBy: Pick<User, "id" | "name">;
};

function ResultForm({
  attempt,
  callLeadId,
}: {
  attempt: AttemptRow;
  callLeadId: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    recordCallAttemptResultAction.bind(null, attempt.id, callLeadId),
    {} as CallAttemptActionState
  );

  return (
    <form
      action={formAction}
      className="mt-3 space-y-3 rounded-md border bg-muted/30 p-3"
      onSubmit={() => setTimeout(() => router.refresh(), 0)}
    >
      <p className="text-xs font-medium text-muted-foreground">架電結果を記録</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`result-${attempt.id}`}>結果</Label>
          <select
            id={`result-${attempt.id}`}
            name="result"
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">選択</option>
            {Object.entries(CALL_ATTEMPT_RESULT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`duration-${attempt.id}`}>通話時間（秒）</Label>
          <Input id={`duration-${attempt.id}`} name="duration" type="number" min={0} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`memo-${attempt.id}`}>メモ</Label>
        <Textarea id={`memo-${attempt.id}`} name="memo" rows={2} />
      </div>
      <input type="hidden" name="callStatus" value="COMPLETED" />
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state.success && <p className="text-xs text-emerald-600">記録しました</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "保存中…" : "結果を保存"}
      </Button>
    </form>
  );
}

export function CallLeadCallsPanel({ callLead }: { callLead: CallLeadDetail }) {
  const attempts = callLead.callAttempts as AttemptRow[];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">発信</CardTitle>
        </CardHeader>
        <CardContent>
          <CallLeadPhoneActions
            callLeadId={callLead.id}
            phone={callLead.phone}
            status={callLead.status}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">架電履歴 ({attempts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">架電履歴はまだありません</p>
          ) : (
            <ul className="space-y-4">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatDateTime(attempt.calledAt)}</p>
                      <p className="text-sm text-muted-foreground">
                        {attempt.calledBy.name} · {attempt.provider}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {attempt.result ? (
                        <span className="font-medium">
                          {CALL_ATTEMPT_RESULT_LABELS[attempt.result]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {CALL_ATTEMPT_STATUS_LABELS[attempt.callStatus]}
                        </span>
                      )}
                      {attempt.duration != null && attempt.duration > 0 && (
                        <p className="text-muted-foreground">
                          {formatDurationLabel(attempt.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                  {attempt.memo && (
                    <p className="mt-2 text-sm whitespace-pre-wrap">{attempt.memo}</p>
                  )}
                  {!attempt.result && callLead.status !== "CONVERTED" && (
                    <ResultForm attempt={attempt} callLeadId={callLead.id} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
