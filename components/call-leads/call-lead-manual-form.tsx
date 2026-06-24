"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  importCallLeadManualAction,
  type CallLeadImportActionState,
} from "@/lib/actions/call-lead-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CallLeadImportActionState = {};

export function CallLeadManualForm() {
  const [state, formAction, pending] = useActionState(
    importCallLeadManualAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">氏名 *</Label>
          <Input id="name" name="name" required placeholder="山田 太郎" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" name="email" type="email" placeholder="example@mail.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">電話番号</Label>
          <Input id="phone" name="phone" placeholder="090-1234-5678" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">年齢</Label>
          <Input id="age" name="age" type="number" min={0} max={150} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="applicationArea">応募地</Label>
          <Input id="applicationArea" name="applicationArea" placeholder="愛知県 豊田市" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appliedAt">応募日時</Label>
          <Input id="appliedAt" name="appliedAt" type="datetime-local" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "登録中…" : "登録する"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/call-leads">キャンセル</Link>
        </Button>
      </div>
    </form>
  );
}
