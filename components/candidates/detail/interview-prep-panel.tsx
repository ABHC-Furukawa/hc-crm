"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { CandidateDetail } from "@/types/candidate";
import type { InterviewPrepBundle } from "@/lib/actions/interview-prep";
import {
  updateInterviewPrepChecklistAction,
  updateInterviewPrepDisplayJobCaseAction,
  updateInterviewPrepMemoAction,
  updateInterviewPrepUrlAction,
  updateInterviewQuestionAnswerAction,
} from "@/lib/actions/interview-prep";
import {
  INTERVIEW_PREP_CHECKLIST_ITEMS,
  type InterviewPrepChecklistKey,
} from "@/lib/constants/interview-prep-defaults";
import { formatDispatchCompanyLabel } from "@/lib/constants/dispatch-companies";
import { CANDIDATE_STATUS_LABELS } from "@/lib/validators/candidate";
import { formatDate, fullName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  candidate: CandidateDetail;
  preparation: InterviewPrepBundle;
  templateBody: string;
  dayOfBody: string;
  resumeMotivation: string | null;
  hasResume: boolean;
  canEditTemplate: boolean;
};

function isResignationQuestion(title: string): boolean {
  return title.includes("退職理由");
}

function DlRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{value || "—"}</dd>
    </div>
  );
}

function TemplateBody({ body }: { body: string }) {
  return (
    <div className="space-y-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
      {body}
    </div>
  );
}

export function InterviewPrepPanel({
  candidate,
  preparation,
  templateBody,
  dayOfBody,
  resumeMotivation,
  hasResume,
  canEditTemplate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [interviewUrl, setInterviewUrl] = useState(preparation.interviewUrl ?? "");
  const [memo, setMemo] = useState(preparation.memo ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      preparation.questions.map((q) => [q.id, q.answerMemo ?? ""])
    )
  );
  const [message, setMessage] = useState<string | null>(null);

  const jobCases = candidate.jobCases;
  const displayCase =
    preparation.displayJobCase ??
    jobCases.find((jc) => jc.id === preparation.displayJobCaseId) ??
    null;

  const caNames = candidate.assignments
    .map((a) => a.user.name)
    .filter(Boolean)
    .join("、");

  function refresh() {
    router.refresh();
  }

  function toggleChecklist(key: InterviewPrepChecklistKey, checked: boolean) {
    startTransition(async () => {
      await updateInterviewPrepChecklistAction(candidate.id, key, checked);
      refresh();
    });
  }

  function saveUrl() {
    startTransition(async () => {
      await updateInterviewPrepUrlAction(candidate.id, interviewUrl);
      setMessage("面接URLを保存しました");
      refresh();
    });
  }

  function changeJobCase(jobCaseId: string) {
    startTransition(async () => {
      await updateInterviewPrepDisplayJobCaseAction(
        candidate.id,
        jobCaseId || null
      );
      refresh();
    });
  }

  function saveAnswer(questionId: string) {
    startTransition(async () => {
      await updateInterviewQuestionAnswerAction(
        candidate.id,
        questionId,
        answers[questionId] ?? ""
      );
      setMessage("回答メモを保存しました");
      refresh();
    });
  }

  function saveMemo() {
    startTransition(async () => {
      await updateInterviewPrepMemoAction(candidate.id, memo);
      setMessage("面接メモを保存しました");
      refresh();
    });
  }

  const jobName =
    displayCase?.entryJobName ||
    displayCase?.job?.jobTitle ||
    "—";
  const location = displayCase?.job?.location || "—";
  const referralFee =
    displayCase?.referralFee != null
      ? `${displayCase.referralFee} 万円`
      : displayCase?.job?.referralFee
        ? String(displayCase.job.referralFee)
        : "—";

  return (
    <div className={`space-y-4 ${isPending ? "opacity-80" : ""}`}>
      {message && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{message}</p>
      )}

      {jobCases.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">表示する案件</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={preparation.displayJobCaseId ?? ""}
              onChange={(e) => changeJobCase(e.target.value)}
              disabled={isPending}
            >
              <option value="">未選択</option>
              {jobCases.map((jc) => (
                <option key={jc.id} value={jc.id}>
                  {jc.entryJobName || jc.job?.jobTitle || "案件（名称未設定）"}
                  {jc.closedAt ? "（クローズ）" : ""}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">① 求職者概要</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <DlRow
              label="氏名"
              value={fullName(candidate.lastName, candidate.firstName)}
            />
            <DlRow label="年齢" value={candidate.age != null ? `${candidate.age}歳` : "—"} />
            <DlRow label="電話番号" value={candidate.phone} />
            <DlRow label="担当CA" value={caNames || "—"} />
            <DlRow
              label="現在ステータス"
              value={CANDIDATE_STATUS_LABELS[candidate.status]}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">② 案件情報</CardTitle>
          <CardDescription>案件タブの情報を表示（面接URLのみここで編集）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              案件が未登録です。案件タブから追加してください。
            </p>
          ) : (
            <dl className="space-y-2">
              <DlRow label="案件名" value={jobName} />
              <DlRow
                label="派遣会社"
                value={formatDispatchCompanyLabel(
                  displayCase?.dispatchCompanyKey,
                  displayCase?.dispatchCompanyOther
                )}
              />
              <DlRow label="勤務地" value={location} />
              <DlRow label="紹介料" value={referralFee} />
              <DlRow
                label="面接日時"
                value={
                  displayCase?.interviewAt
                    ? formatDate(displayCase.interviewAt)
                    : "—"
                }
              />
            </dl>
          )}
          <div className="space-y-2">
            <Label htmlFor="interviewUrl">面接URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="interviewUrl"
                value={interviewUrl}
                onChange={(e) => setInterviewUrl(e.target.value)}
                placeholder="https://..."
                disabled={isPending}
              />
              <Button type="button" onClick={saveUrl} disabled={isPending}>
                保存
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">③ 面接準備チェックリスト</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {INTERVIEW_PREP_CHECKLIST_ITEMS.map((item) => (
              <li key={item.key}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted/60">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={Boolean(preparation[item.key])}
                    disabled={isPending}
                    onChange={(e) => toggleChecklist(item.key, e.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">④ 環境・身だしなみの準備</CardTitle>
              <CardDescription>求職者への説明用（固定テンプレート）</CardDescription>
            </div>
            {canEditTemplate && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/interview-prep">テンプレート編集</Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TemplateBody body={templateBody} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">⑤ 想定質問</CardTitle>
          <CardDescription>各質問の回答メモを求職者ごとに保存</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preparation.questions.map((q, index) => {
            const resignationLinked = isResignationQuestion(q.title);
            return (
              <div key={q.id} className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-semibold">
                  {index + 1}. {q.title}
                </p>
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {q.guidance}
                </p>
                {resignationLinked && (
                  <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <p className="mb-1 text-xs text-muted-foreground">
                      求職者情報から自動連携（転職理由）
                    </p>
                    <p className="whitespace-pre-wrap font-medium">
                      {candidate.resignationReason?.trim() || "—"}
                    </p>
                  </div>
                )}
                <Textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  placeholder={
                    resignationLinked
                      ? "言い換え・回答メモ"
                      : "回答メモ"
                  }
                  rows={3}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => saveAnswer(q.id)}
                  disabled={isPending}
                >
                  メモを保存
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">⑥ 面接当日の心得・お約束</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateBody body={dayOfBody} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">⑦ 求職者情報との自動連携</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <DlRow label="転職理由" value={candidate.resignationReason} />
            <DlRow label="志望理由" value={resumeMotivation} />
            <DlRow label="希望勤務地" value={candidate.desiredArea} />
            <DlRow label="入社可能日" value={candidate.availableDate} />
            <DlRow
              label="履歴書"
              value={
                hasResume ? (
                  <Link
                    href={`/candidates/${candidate.id}?tab=resume`}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    履歴書タブを開く
                  </Link>
                ) : (
                  "未作成"
                )
              }
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">⑧ 面接メモ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="面接前後のメモ"
            rows={4}
            disabled={isPending}
          />
          <Button type="button" onClick={saveMemo} disabled={isPending}>
            メモを保存
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
