"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatMetricValue,
  getGoalMetricLabel,
  isAmountMetric,
} from "@/lib/kpi/constants";
import type { KpiGoalRow } from "@/lib/kpi/serialize";
import { deleteKpiGoalAction } from "@/lib/actions/kpi";

type KpiGoalsTableProps = {
  goals: KpiGoalRow[];
  title: string;
  unitSuffix: string;
  emptyMessage: string;
};

export function KpiGoalsTable({
  goals,
  title,
  unitSuffix,
  emptyMessage,
}: KpiGoalsTableProps) {
  const [pending, startTransition] = useTransition();

  function handleDelete(goalId: string) {
    if (!confirm("この目標を削除しますか？")) return;
    startTransition(async () => {
      await deleteKpiGoalAction(goalId);
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-muted-foreground">
        {title}（{unitSuffix}）
      </h3>
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>指標</TableHead>
                <TableHead className="text-right">目標値</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>{getGoalMetricLabel(goal.metricType)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMetricValue(goal.metricType, goal.targetValue)}
                    {isAmountMetric(goal.metricType) ? "万円" : unitSuffix}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      aria-label="削除"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
