import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FunnelStageCount } from "@/lib/analytics/constants";

type FunnelStagesTableProps = {
  stages: FunnelStageCount[];
};

export function FunnelStagesTable({ stages }: FunnelStagesTableProps) {
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">ステージ</TableHead>
            <TableHead className="text-right">件数</TableHead>
            <TableHead className="min-w-[200px]">構成比</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((stage) => (
            <TableRow key={stage.stageId}>
              <TableCell className="font-medium">{stage.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {stage.count.toLocaleString("ja-JP")}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.round((stage.count / maxCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
