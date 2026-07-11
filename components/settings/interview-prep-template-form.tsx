"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateInterviewPrepTemplateAction,
} from "@/lib/actions/interview-prep";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: { error?: string; success?: boolean } = {};

export function InterviewPrepTemplateForm({
  bodyMarkdown,
}: {
  bodyMarkdown: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateInterviewPrepTemplateAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>面接対策テンプレート</CardTitle>
        <CardDescription>
          求職者詳細の「④ 環境・身だしなみの準備」に表示される固定文です。管理者のみ編集できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-600">テンプレートを保存しました</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="bodyMarkdown">本文</Label>
            <Textarea
              id="bodyMarkdown"
              name="bodyMarkdown"
              defaultValue={bodyMarkdown}
              rows={24}
              required
              className="font-mono text-sm"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
