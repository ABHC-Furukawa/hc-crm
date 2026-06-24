import { z } from "zod";
import { GoalPeriodType, KpiMetricType } from "@prisma/client";
import { KPI_GOAL_METRICS } from "@/lib/kpi/constants";

export const kpiGoalFormSchema = z.object({
  metricType: z.nativeEnum(KpiMetricType),
  periodType: z.nativeEnum(GoalPeriodType).default(GoalPeriodType.MONTHLY),
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM 形式で入力してください"),
  targetValue: z.coerce
    .number({ invalid_type_error: "数値を入力してください" })
    .min(0, "0以上の数値を入力してください"),
  userId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  scope: z.enum(["personal", "team"]).default("personal"),
});

export type KpiGoalFormInput = z.infer<typeof kpiGoalFormSchema>;

export const kpiGoalsBulkSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM 形式で入力してください"),
  scope: z.enum(["personal", "team"]).default("personal"),
  userId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export function parseBulkGoalTargets(
  formData: FormData
): Partial<Record<KpiMetricType, number>> {
  const targets: Partial<Record<KpiMetricType, number>> = {};

  for (const metricType of KPI_GOAL_METRICS) {
    const raw = formData.get(`target_${metricType}`);
    if (raw === null || raw === "") continue;

    const parsed = z.coerce.number().min(0).safeParse(raw);
    if (parsed.success) {
      targets[metricType] = parsed.data;
    }
  }

  return targets;
}

export const kpiDashboardSearchSchema = z.object({
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  scope: z.enum(["personal", "team"]).optional(),
  userId: z.string().uuid().optional(),
});
