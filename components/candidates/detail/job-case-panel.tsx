"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CandidateJobCase } from "@prisma/client";
import type { CandidateDetail } from "@/types/candidate";
import {
  closeJobCaseAction,
  syncJobCaseKpiInclusionAction,
  upsertJobCaseAction,
} from "@/lib/actions/job-case";
import {
  JobCaseJobPicker,
  type JobCaseLinkSelection,
} from "@/components/candidates/detail/job-case-job-picker";
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
  DISPATCH_COMPANY_OPTIONS,
  formatDispatchCompanyLabel,
} from "@/lib/constants/dispatch-companies";
import { toDateInputValue } from "@/lib/validators/job-case";
import { cn, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

type JobCaseWithJob = CandidateJobCase & {
  job: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string | null;
    referralFee: string | null;
    sourceCompany: string;
  } | null;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function JobCasePanel({ candidate }: { candidate: CandidateDetail }) {
  const jobCases = candidate.jobCases;
  const [showNewForm, setShowNewForm] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>案件情報</CardTitle>
              <CardDescription>
                エントリーから入社までの進捗を管理します。ATS 案件マスタから選択して紐づけることもできます。
              </CardDescription>
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
        <CardContent className="space-y-6">
          {jobCases.length >= 2 && (
            <JobCaseKpiInclusionForm
              candidateId={candidate.id}
              jobCases={jobCases}
            />
          )}

          {jobCases.length === 0 && !showNewForm && (
            <p className="text-sm text-muted-foreground">
              案件が未登録です。「案件を追加」から登録してください。
            </p>
          )}

          {jobCases.map((jobCase, index) => (
            <JobCaseCard
              key={jobCase.id}
              candidateId={candidate.id}
              jobCase={jobCase}
              index={index}
            />
          ))}

          {showNewForm && (
            <JobCaseCard
              candidateId={candidate.id}
              jobCase={null}
              index={jobCases.length}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {!showNewForm && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                案件を追加
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JobCaseKpiInclusionForm({
  candidateId,
  jobCases,
}: {
  candidateId: string;
  jobCases: JobCaseWithJob[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    syncJobCaseKpiInclusionAction.bind(null, candidateId),
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
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">KPI 反映</CardTitle>
        <CardDescription>
          チェックを入れた案件の紹介料が KPI の金額に反映されます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-3">
            {jobCases.map((jobCase) => {
              const label =
                jobCase.entryJobName?.trim() ||
                jobCase.job?.jobTitle?.trim() ||
                formatDispatchCompanyLabel(
                  jobCase.dispatchCompanyKey,
                  jobCase.dispatchCompanyOther
                ) ||
                "案件";
              const closedSuffix = jobCase.closedAt ? "（クローズ）" : "";
              return (
                <label
                  key={jobCase.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border bg-background px-3 py-2",
                    jobCase.closedAt && "opacity-70"
                  )}
                >
                  <input
                    type="checkbox"
                    name="includeInKpi"
                    value={jobCase.id}
                    defaultChecked={jobCase.includeInKpi}
                    className="mt-1 h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm leading-relaxed">
                    <span className="font-medium">
                      {label}
                      {closedSuffix}
                    </span>
                    {jobCase.referralFee != null && (
                      <span className="text-muted-foreground">
                        {" "}
                        — 紹介料 {jobCase.referralFee} 万円
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-green-600">KPI 反映を更新しました</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "反映中..." : "データ反映"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function JobCaseCard({
  candidateId,
  jobCase,
  index,
  onCancel,
}: {
  candidateId: string;
  jobCase: JobCaseWithJob | null;
  index: number;
  onCancel?: () => void;
}) {
  const isClosed = Boolean(jobCase?.closedAt);
  const title =
    jobCase?.entryJobName?.trim() ||
    jobCase?.job?.jobTitle?.trim() ||
    (jobCase ? `案件 ${index + 1}` : "新規案件");

  return (
    <Card
      className={cn(
        isClosed && "border-muted bg-muted/40 opacity-70"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {isClosed && (
              <CardDescription className="mt-1 text-muted-foreground">
                クローズ
                {jobCase?.closedReason
                  ? `（${jobCase.closedReason}）`
                  : "（不採用など）"}
                {jobCase?.closedAt
                  ? ` — ${formatDate(jobCase.closedAt)}`
                  : null}
              </CardDescription>
            )}
            {!isClosed && jobCase && (
              <CardDescription className="mt-1">
                派遣会社:{" "}
                {formatDispatchCompanyLabel(
                  jobCase.dispatchCompanyKey,
                  jobCase.dispatchCompanyOther
                )}
              </CardDescription>
            )}
          </div>
          {!isClosed && jobCase && (
            <CloseJobCaseButton candidateId={candidateId} jobCaseId={jobCase.id} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <JobCaseForm
          candidateId={candidateId}
          jobCase={jobCase}
          disabled={isClosed}
          onCancel={onCancel}
        />
        {jobCase && !isClosed && <JobCaseSummary jobCase={jobCase} />}
      </CardContent>
    </Card>
  );
}

function CloseJobCaseButton({
  candidateId,
  jobCaseId,
}: {
  candidateId: string;
  jobCaseId: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    closeJobCaseAction.bind(null, candidateId, jobCaseId),
    {}
  );
  const wasPending = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      setOpen(false);
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state.success, router]);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        クローズ
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex min-w-[220px] flex-col gap-2">
      <Input
        name="closedReason"
        placeholder="理由（例: 不採用）"
        className="h-8 text-sm"
      />
      <Button type="submit" variant="destructive" size="sm" disabled={pending}>
        {pending ? "..." : "確定"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(false)}
      >
        取消
      </Button>
      {state.error && (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}

function JobCaseForm({
  candidateId,
  jobCase,
  disabled = false,
  onCancel,
}: {
  candidateId: string;
  jobCase: JobCaseWithJob | null;
  disabled?: boolean;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    upsertJobCaseAction.bind(null, candidateId),
    {}
  );
  const wasPending = useRef(false);

  const [entryJobName, setEntryJobName] = useState(jobCase?.entryJobName ?? "");
  const [dispatchKey, setDispatchKey] = useState(jobCase?.dispatchCompanyKey ?? "");
  const [dispatchOther, setDispatchOther] = useState(
    jobCase?.dispatchCompanyOther ?? ""
  );
  const [referralFee, setReferralFee] = useState(
    jobCase?.referralFee?.toString() ?? ""
  );

  const handleJobLink = (selection: JobCaseLinkSelection | null) => {
    if (!selection) return;
    setEntryJobName(selection.entryJobName);
    setDispatchKey(selection.dispatchCompanyKey);
    setDispatchOther(selection.dispatchCompanyOther);
    setReferralFee(selection.referralFee);
  };

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      onCancel?.();
      router.refresh();
    }
    wasPending.current = pending;
  }, [pending, state.success, router, onCancel]);

  return (
    <form action={formAction} className="space-y-6">
      {jobCase && <input type="hidden" name="jobCaseId" value={jobCase.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <JobCaseJobPicker
          disabled={disabled}
          initialJob={jobCase?.job ?? null}
          onSelect={handleJobLink}
        />
        <Field
          label="エントリー案件名"
          name="entryJobName"
          value={entryJobName}
          onChange={(event) => setEntryJobName(event.target.value)}
          className="sm:col-span-2"
          disabled={disabled}
        />
        <DispatchCompanyField
          dispatchKey={dispatchKey}
          dispatchOther={dispatchOther}
          onDispatchKeyChange={setDispatchKey}
          onDispatchOtherChange={setDispatchOther}
          disabled={disabled}
        />
        <Field
          label="紹介料（万円）"
          name="referralFee"
          type="number"
          min={0}
          value={referralFee}
          onChange={(event) => setReferralFee(event.target.value)}
          disabled={disabled}
        />
        <Field
          label="面談対策日"
          name="interviewPrepAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.interviewPrepAt)}
          disabled={disabled}
        />
        <Field
          label="面接日"
          name="interviewAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.interviewAt)}
          disabled={disabled}
        />
        <Field
          label="工場見学日"
          name="factoryTourAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.factoryTourAt)}
          disabled={disabled}
        />
        <Field
          label="内定承諾日"
          name="offerAcceptedAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.offerAcceptedAt)}
          disabled={disabled}
        />
        <Field
          label="入社予定日"
          name="scheduledJoinAt"
          type="date"
          defaultValue={toDateInputValue(jobCase?.scheduledJoinAt)}
          className="sm:col-span-2"
          disabled={disabled}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && !disabled && (
        <p className="text-sm text-green-600">保存しました</p>
      )}

      {!disabled && (
        <div className="flex flex-wrap justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "保存中..." : jobCase ? "案件情報を保存" : "案件を登録"}
          </Button>
        </div>
      )}
    </form>
  );
}

function DispatchCompanyField({
  dispatchKey,
  dispatchOther,
  onDispatchKeyChange,
  onDispatchOtherChange,
  disabled,
}: {
  dispatchKey: string;
  dispatchOther: string;
  onDispatchKeyChange: (value: string) => void;
  onDispatchOtherChange: (value: string) => void;
  disabled?: boolean;
}) {
  const showOther = dispatchKey === "OTHER";

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="dispatchCompanyKey">派遣会社名</Label>
        <select
          id="dispatchCompanyKey"
          name="dispatchCompanyKey"
          value={dispatchKey}
          onChange={(event) => onDispatchKeyChange(event.target.value)}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">選択してください</option>
          {DISPATCH_COMPANY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {showOther && (
        <Field
          label="派遣会社名（その他）"
          name="dispatchCompanyOther"
          value={dispatchOther}
          onChange={(event) => onDispatchOtherChange(event.target.value)}
          placeholder="会社名を入力"
          disabled={disabled}
        />
      )}
    </>
  );
}

function JobCaseSummary({ jobCase }: { jobCase: JobCaseWithJob }) {
  const items = [
    {
      label: "面談対策",
      value: jobCase.interviewPrepAt ? formatDate(jobCase.interviewPrepAt) : null,
    },
    {
      label: "面接",
      value: jobCase.interviewAt ? formatDate(jobCase.interviewAt) : null,
    },
    {
      label: "工場見学",
      value: jobCase.factoryTourAt ? formatDate(jobCase.factoryTourAt) : null,
    },
    {
      label: "内定承諾",
      value: jobCase.offerAcceptedAt ? formatDate(jobCase.offerAcceptedAt) : null,
    },
    {
      label: "入社予定",
      value: jobCase.scheduledJoinAt ? formatDate(jobCase.scheduledJoinAt) : null,
    },
  ].filter((item) => item.value);

  if (items.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-medium">スケジュール概要</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  defaultValue,
  onChange,
  type = "text",
  className,
  disabled,
  ...props
}: {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  type?: string;
  className?: string;
  disabled?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange">) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}
