import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { FunnelConversionPair } from "@/lib/analytics/constants";

type FunnelCvrTableProps = {
  conversions: FunnelConversionPair[];
  bottleneckFromStageId?: string;
  bottleneckToStageId?: string;
};

function formatCvr(rate: number | null): string {
  if (rate === null) return "—";
  return `${rate.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
}

export function FunnelCvrTable({
  conversions,
  bottleneckFromStageId,
  bottleneckToStageId,
}: FunnelCvrTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>区間</TableHead>
            <TableHead className="text-right">上流</TableHead>
            <TableHead className="text-right">下流</TableHead>
            <TableHead className="text-right">CVR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversions.map((pair) => {
            const isBottleneck =
              pair.fromStageId === bottleneckFromStageId &&
              pair.toStageId === bottleneckToStageId;

            return (
              <TableRow
                key={`${pair.fromStageId}-${pair.toStageId}`}
                className={cn(isBottleneck && "bg-destructive/5")}
              >
                <TableCell className="font-medium">
                  {pair.fromLabel} → {pair.toLabel}
                  {isBottleneck && (
                    <span className="ml-2 text-xs text-destructive">ボトルネック</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pair.fromCount.toLocaleString("ja-JP")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {pair.toCount.toLocaleString("ja-JP")}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums font-medium",
                    isBottleneck && "text-destructive"
                  )}
                >
                  {formatCvr(pair.conversionRate)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
