import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FunnelBottleneck } from "@/lib/analytics/constants";

type BottleneckCardProps = {
  bottleneck: FunnelBottleneck | null;
  overallConversionRate: number | null;
};

function formatCvr(rate: number | null): string {
  if (rate === null) return "—";
  return `${rate.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
}

export function BottleneckCard({
  bottleneck,
  overallConversionRate,
}: BottleneckCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          ボトルネック分析
        </CardTitle>
        <CardDescription>
          隣接ステージ間 CVR の最小区間を表示（期間イベント型）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {bottleneck ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground">最も歩留まりが悪い工程</p>
            <p className="mt-1 text-lg font-semibold">
              {bottleneck.pair.fromLabel} → {bottleneck.pair.toLabel}
            </p>
            <p className="mt-1 text-2xl font-bold text-destructive tabular-nums">
              {formatCvr(bottleneck.pair.conversionRate)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {bottleneck.pair.fromCount.toLocaleString("ja-JP")} 件 →{" "}
              {bottleneck.pair.toCount.toLocaleString("ja-JP")} 件
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            比較可能な CVR データがありません
          </p>
        )}

        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">応募 → 入社（全体 CVR）</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatCvr(overallConversionRate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
