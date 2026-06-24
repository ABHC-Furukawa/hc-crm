import { KpiMetricType } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  KPI_DAILY_TABLE_METRICS,
  getMetricLabel,
  formatMetricValue,
} from "@/lib/kpi/constants";
import { formatDate } from "@/lib/utils";
import type { DailyMetricRow } from "@/lib/kpi/metrics";

type KpiDailyTableProps = {
  rows: DailyMetricRow[];
  highlightMetrics?: KpiMetricType[];
};

export function KpiDailyTable({
  rows,
  highlightMetrics = [...KPI_DAILY_TABLE_METRICS],
}: KpiDailyTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">表示するデータがありません</p>
    );
  }

  const hasActivity = rows.some((row) =>
    highlightMetrics.some((m) => (row.values[m] ?? 0) > 0)
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">日付</TableHead>
            {highlightMetrics.map((metric) => (
              <TableHead key={metric} className="text-right">
                {getMetricLabel(metric, "daily")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasActivity ? (
            <TableRow>
              <TableCell
                colSpan={highlightMetrics.length + 1}
                className="text-center text-muted-foreground"
              >
                この期間の行動量データはまだありません
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.date.toISOString()}>
                <TableCell>{formatDate(row.date)}</TableCell>
                {highlightMetrics.map((metric) => (
                  <TableCell key={metric} className="text-right tabular-nums">
                    {formatMetricValue(metric, row.values[metric] ?? 0)}名
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
