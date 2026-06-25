"use client";

import { useActionState, type ReactNode } from "react";
import { KpiMetricType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  KPI_AMOUNT_METRICS,
  KPI_METRIC_UNITS,
  KPI_PIPELINE_COUNT_METRICS,
  KPI_PIPELINE_PERIOD_AGGREGATION_HINT,
  KPI_TRANSITION_AGGREGATION_HINT,
  KPI_TRANSITION_COUNT_METRICS,
  getGoalMetricLabel,
} from "@/lib/kpi/constants";
import {
  upsertKpiGoalsBulkAction,
  type KpiGoalActionState,
} from "@/lib/actions/kpi";

type KpiGoalsBulkFormProps = {
  yearMonth: string;
  scope: "personal" | "team";
  title: string;
  initialValues?: Partial<Record<KpiMetricType, number>>;
};

const initialState: KpiGoalActionState = {};

function GoalField({
  metricType,
  unitSuffix,
  defaultValue,
}: {
  metricType: KpiMetricType;
  unitSuffix: string;
  defaultValue?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`target_${metricType}`} className="text-sm leading-snug">
        {getGoalMetricLabel(metricType)}
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          ({unitSuffix})
        </span>
      </Label>
      <Input
        id={`target_${metricType}`}
        name={`target_${metricType}`}
        type="number"
        min={0}
        step={1}
        defaultValue={defaultValue ?? ""}
        placeholder="未設定"
      />
    </div>
  );
}

function GoalSection({
  heading,
  hint,
  children,
}: {
  heading: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">{heading}</h4>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

export function KpiGoalsBulkForm({
  yearMonth,
  scope,
  title,
  initialValues = {},
}: KpiGoalsBulkFormProps) {
  const [state, formAction, pending] = useActionState(
    upsertKpiGoalsBulkAction,
    initialState
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-lg border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">
          入力した項目のみ保存されます（空欄はスキップ）
        </p>
      </div>

      <input type="hidden" name="yearMonth" value={yearMonth} />
      <input type="hidden" name="scope" value={scope} />

      <GoalSection
        heading="月次活動（遷移）"
        hint={KPI_TRANSITION_AGGREGATION_HINT}
      >
        {KPI_TRANSITION_COUNT_METRICS.map((metricType) => (
          <GoalField
            key={metricType}
            metricType={metricType}
            unitSuffix={KPI_METRIC_UNITS[metricType]}
            defaultValue={initialValues[metricType]}
          />
        ))}
      </GoalSection>

      <GoalSection
        heading="進行中パイプライン"
        hint={KPI_PIPELINE_PERIOD_AGGREGATION_HINT}
      >
        {KPI_PIPELINE_COUNT_METRICS.map((metricType) => (
          <GoalField
            key={metricType}
            metricType={metricType}
            unitSuffix={KPI_METRIC_UNITS[metricType]}
            defaultValue={initialValues[metricType]}
          />
        ))}
      </GoalSection>

      <GoalSection heading="金額面" hint={KPI_PIPELINE_PERIOD_AGGREGATION_HINT}>
        {KPI_AMOUNT_METRICS.map((metricType) => (
          <GoalField
            key={metricType}
            metricType={metricType}
            unitSuffix="万円"
            defaultValue={initialValues[metricType]}
          />
        ))}
      </GoalSection>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : "目標を一括保存"}
        </Button>
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.success && (
          <p className="text-sm text-green-600">目標を保存しました</p>
        )}
      </div>
    </form>
  );
}
