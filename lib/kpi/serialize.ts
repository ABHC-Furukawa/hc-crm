import type { KpiGoal, KpiMetricType } from "@prisma/client";

/** Client Component に渡せる KPI 目標（Prisma Decimal / Date を除去） */
export type KpiGoalRow = {
  id: string;
  metricType: KpiMetricType;
  targetValue: number;
};

export function serializeKpiGoal(goal: KpiGoal): KpiGoalRow {
  return {
    id: goal.id,
    metricType: goal.metricType,
    targetValue: Number(goal.targetValue),
  };
}

export function serializeKpiGoals(goals: KpiGoal[]): KpiGoalRow[] {
  return goals.map(serializeKpiGoal);
}

export function kpiGoalsToInitialValues(
  goals: KpiGoalRow[]
): Partial<Record<KpiMetricType, number>> {
  return Object.fromEntries(goals.map((g) => [g.metricType, g.targetValue])) as Partial<
    Record<KpiMetricType, number>
  >;
}
