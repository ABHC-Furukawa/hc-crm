"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { CallLeadDetail } from "@/lib/call-leads/queries";
import {
  updateCallLeadFollowUpAction,
  type CallLeadActionState,
} from "@/lib/actions/call-leads";
import { toDateInputValue } from "@/lib/validators/call-lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function CallLeadFollowUpPanel({ callLead }: { callLead: CallLeadDetail }) {
  const router = useRouter();
  const readOnly = callLead.status === "CONVERTED";

  const [state, formAction, pending] = useActionState(
    updateCallLeadFollowUpAction.bind(null, callLead.id),
    {} as CallLeadActionState
  );

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">FollowUp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">次回架電日: </span>
            {callLead.nextCallDate ? formatDate(callLead.nextCallDate) : "—"}
          </p>
          <p className="whitespace-pre-wrap">
            <span className="text-muted-foreground">メモ: </span>
            {callLead.nextCallMemo ?? "—"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">FollowUp</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="space-y-4"
          onSubmit={() => setTimeout(() => router.refresh(), 0)}
        >
          <div className="space-y-2">
            <Label htmlFor="nextCallDate">次回架電日</Label>
            <Input
              id="nextCallDate"
              name="nextCallDate"
              type="date"
              defaultValue={toDateInputValue(callLead.nextCallDate)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextCallMemo">次回架電メモ</Label>
            <Textarea
              id="nextCallMemo"
              name="nextCallMemo"
              rows={5}
              defaultValue={callLead.nextCallMemo ?? ""}
              placeholder="次回のトークポイント、時間帯の希望など"
            />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-emerald-600">保存しました</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
