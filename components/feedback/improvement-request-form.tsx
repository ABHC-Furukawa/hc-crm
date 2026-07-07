"use client";

import { useActionState } from "react";
import {
  submitImprovementRequestAction,
  type ImprovementRequestActionState,
} from "@/lib/actions/improvement-requests";
import {
  IMPROVEMENT_REQUEST_PRIORITY_LABELS,
  IMPROVEMENT_REQUEST_PRIORITY_OPTIONS,
} from "@/lib/constants/improvement-request";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ImprovementRequestActionState = {};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

export function ImprovementRequestForm() {
  const [state, formAction, pending] = useActionState(
    submitImprovementRequestAction,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">改善・要望を投稿</CardTitle>
      </CardHeader>
      <CardContent>
        {state.success && (
          <p className="mb-4 text-sm text-emerald-600">
            投稿ありがとうございます。開発者が確認します。
          </p>
        )}
        {state.error && (
          <p className="mb-4 text-sm text-destructive">{state.error}</p>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              name="name"
              placeholder="改善項目の名前"
              required
              maxLength={120}
            />
            {state.fieldErrors?.name?.[0] && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">優先度</Label>
            <select id="priority" name="priority" required className={selectClass}>
              <option value="">選択してください</option>
              {IMPROVEMENT_REQUEST_PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {IMPROVEMENT_REQUEST_PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
            {state.fieldErrors?.priority?.[0] && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.priority[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">改善項目</Label>
            <Textarea
              id="description"
              name="description"
              rows={6}
              placeholder="改善してほしい内容や要望を具体的に記述してください"
              required
              maxLength={5000}
            />
            {state.fieldErrors?.description?.[0] && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "投稿中..." : "投稿する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
