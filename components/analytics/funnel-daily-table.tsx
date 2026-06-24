import {
  FUNNEL_STAGE_IDS,
  FUNNEL_STAGE_LABELS,
} from "@/lib/analytics/constants";
import type { FunnelDailyRow } from "@/lib/analytics/funnel-metrics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type FunnelDailyTableProps = {
  rows: FunnelDailyRow[];
};

export function FunnelDailyTable({ rows }: FunnelDailyTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">表示するデータがありません</p>
    );
  }

  const hasActivity = rows.some((row) =>
    row.stages.some((stage) => stage.count > 0)
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px] sticky left-0 bg-background">
              日付
            </TableHead>
            {FUNNEL_STAGE_IDS.map((stageId) => (
              <TableHead key={stageId} className="text-right whitespace-nowrap">
                {FUNNEL_STAGE_LABELS[stageId]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasActivity ? (
            <TableRow>
              <TableCell
                colSpan={FUNNEL_STAGE_IDS.length + 1}
                className="text-center text-muted-foreground"
              >
                この期間の行動量データはまだありません
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const countByStage = new Map(
                row.stages.map((stage) => [stage.stageId, stage.count])
              );
              return (
                <TableRow key={row.date.toISOString()}>
                  <TableCell className="sticky left-0 bg-background">
                    {formatDate(row.date)}
                  </TableCell>
                  {FUNNEL_STAGE_IDS.map((stageId) => (
                    <TableCell
                      key={stageId}
                      className="text-right tabular-nums"
                    >
                      {(countByStage.get(stageId) ?? 0).toLocaleString("ja-JP")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
