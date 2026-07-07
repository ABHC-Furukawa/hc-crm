import { ImprovementRequestPriority } from "@prisma/client";

export const IMPROVEMENT_REQUEST_PRIORITY_LABELS: Record<
  ImprovementRequestPriority,
  string
> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export const IMPROVEMENT_REQUEST_PRIORITY_STYLES: Record<
  ImprovementRequestPriority,
  string
> = {
  HIGH: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
};

export const IMPROVEMENT_REQUEST_PRIORITY_OPTIONS: ImprovementRequestPriority[] =
  ["HIGH", "MEDIUM", "LOW"];
