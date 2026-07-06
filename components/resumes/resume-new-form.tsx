"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createResumeAction, type ResumeActionState } from "@/lib/actions/resumes";
import { fullName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type ResumePickerCandidate = {
  id: string;
  lastName: string;
  firstName: string;
  furigana: string | null;
  resumes: { id: string }[];
};

export function ResumeNewForm({
  candidates,
}: {
  candidates: ResumePickerCandidate[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createResumeAction,
    {} as ResumeActionState
  );

  const availableCandidates = candidates.filter((c) => c.resumes.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規履歴書</CardTitle>
        <CardDescription>
          候補者なしでも作成できます。候補者を選ぶとプロフィールが初期値として入りますが、作成後はすべて自由に編集できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">氏名</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="山田 太郎"
            />
            <p className="text-xs text-muted-foreground">
              候補者を選んだ場合はプロフィールの氏名が優先されます（上書き入力も可能）
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidateId">候補者（任意）</Label>
            <select id="candidateId" name="candidateId" className={selectClass} defaultValue="">
              <option value="">候補者なしで作成</option>
              {availableCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {fullName(candidate.lastName, candidate.firstName)}
                  {candidate.furigana ? `（${candidate.furigana}）` : ""}
                </option>
              ))}
            </select>
            {availableCandidates.length === 0 && candidates.length > 0 && (
              <p className="text-xs text-muted-foreground">
                履歴書未作成の候補者がいません。候補者なしで作成するか、既存履歴書を編集してください。
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "作成中…" : "作成して編集へ"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/resumes")}>
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
