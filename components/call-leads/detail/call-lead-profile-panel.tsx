"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { CallLeadDetail } from "@/lib/call-leads/queries";
import type { AssignableUser } from "@/lib/users/queries";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { formatUserSurname } from "@/lib/users/display";
import {
  updateCallLeadAction,
  type CallLeadActionState,
} from "@/lib/actions/call-leads";
import { toDateTimeInputValue } from "@/lib/validators/call-lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  callLead: CallLeadDetail;
  assignableUsers: AssignableUser[];
  canAssign: boolean;
};

export function CallLeadProfilePanel({ callLead, assignableUsers, canAssign }: Props) {
  const router = useRouter();
  const readOnly = callLead.status === "CONVERTED";

  const [state, formAction, pending] = useActionState(
    updateCallLeadAction.bind(null, callLead.id),
    {} as CallLeadActionState
  );

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {CANDIDATE_DISPLAY.convertLeadLockedEdit}
        </CardContent>
      </Card>
    );
  }

  const values = state.values;

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={() => {
            setTimeout(() => router.refresh(), 0);
          }}
        >
          {state.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-600 sm:col-span-2">保存しました</p>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">氏名 *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={values?.name ?? callLead.name}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={values?.email ?? callLead.email ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">電話番号</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={values?.phone ?? callLead.phone ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">年齢</Label>
            <Input
              id="age"
              name="age"
              type="number"
              min={0}
              max={150}
              defaultValue={values?.age ?? callLead.age?.toString() ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationArea">応募地</Label>
            <Input
              id="applicationArea"
              name="applicationArea"
              defaultValue={values?.applicationArea ?? callLead.applicationArea ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appliedAt">応募日時</Label>
            <Input
              id="appliedAt"
              name="appliedAt"
              type="datetime-local"
              defaultValue={
                values?.appliedAt ??
                (callLead.appliedAt ? toDateTimeInputValue(callLead.appliedAt) : "")
              }
            />
          </div>

          {canAssign && (
            <div className="space-y-2">
              <Label htmlFor="assignedUserId">担当者</Label>
              <select
                id="assignedUserId"
                name="assignedUserId"
                defaultValue={
                  values?.assignedUserId ?? callLead.assignedUserId ?? ""
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">未割当</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {formatUserSurname(u)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "保存中…" : "保存"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
