"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CandidateJobCase } from "@prisma/client";
import type { CandidateDetail } from "@/types/candidate";
import { upsertJobCaseAction } from "@/lib/actions/job-case";
import { CandidateStatusSelector } from "@/components/candidates/candidate-status-selector";
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
import {
  toDateInputValue,
  toDateTimeLocalValue,
} from "@/lib/validators/job-case";
import { formatDate, formatDateTime } from "@/lib/utils";

export function JobCasePanel({ candidate }: { candidate: CandidateDetail }) {
  const jobCase = candidate.jobCase;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>案件情報</CardTitle>
              <CardDescription>エントリーから入社までの進捗を管理します</CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium text-muted-foreground">ステータス</span>
              <CandidateStatusSelector
                candidateId={candidate.id}
                status={candidate.status}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <JobCaseForm
            key={jobCase?.updatedAt?.toISOString() ?? "new"}
            candidateId={candidate.id}
            jobCase={jobCase}
          />
        </CardContent>
      </Card>

      {jobCase && <JobCaseSummary jobCase={jobCase} />}
    </div>
  );
}

function JobCaseForm({
  candidateId,
  jobCase,
}: {
  candidateId: string;
  jobCase: CandidateJobCase | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    upsertJobCaseAction.bind(null, candidateId),
    {}
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state.success, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="エントリー案件名"
          name="entryJobName"
          defaultValue={jobCase?.entryJobName ?? ""}
          className="sm:col-span-2"
        />
        <Field
          label="派遣会社名"
          name="dispatchCompanyName"
          defaultValue={jobCase?.dispatchCompanyName ?? ""}
        />
        <Field
          label="紹介料（万円）"
          name="referralFee"
          type="number"
          min={0}
          defaultValue={jobCase?.referralFee?.toString() ?? ""}
        />
        <Field
          label="面談対策日/時間"
          name="interviewPrepAt"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(jobCase?.interviewPrepAt)}
        />
        <Field
          label="面接日/時間"
          name="interviewAt"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(jobCase?.interviewAt)}
        />
        <Field
          label="工場見学日"
          name="factoryTourAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.factoryTourAt)}
        />
        <Field
          label="内定承諾日"
          name="offerAcceptedAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.offerAcceptedAt)}
        />
        <Field
          label="入社予定日"
          name="scheduledJoinAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.scheduledJoinAt)}
          className="sm:col-span-2"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">保存しました</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : "案件情報を保存"}
        </Button>
      </div>
    </form>
  );
}

function JobCaseSummary({ jobCase }: { jobCase: CandidateJobCase }) {
  const items = [
    { label: "面談対策", value: jobCase.interviewPrepAt ? formatDateTime(jobCase.interviewPrepAt) : null },
    { label: "面接", value: jobCase.interviewAt ? formatDateTime(jobCase.interviewAt) : null },
    { label: "工場見学", value: jobCase.factoryTourAt ? formatDate(jobCase.factoryTourAt) : null },
    { label: "内定承諾", value: jobCase.offerAcceptedAt ? formatDate(jobCase.offerAcceptedAt) : null },
    { label: "入社予定", value: jobCase.scheduledJoinAt ? formatDate(jobCase.scheduledJoinAt) : null },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">スケジュール概要</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  className,
  ...props
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        {...props}
      />
    </div>
  );
}
