"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FunnelStageCount } from "@/lib/analytics/constants";

type FunnelChartProps = {
  stages: FunnelStageCount[];
};

type ChartRow = {
  label: string;
  count: number;
  fill: string;
};

const STAGE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.92)",
  "hsl(var(--primary) / 0.84)",
  "hsl(var(--primary) / 0.76)",
  "hsl(var(--primary) / 0.68)",
  "hsl(var(--primary) / 0.60)",
  "hsl(var(--primary) / 0.52)",
  "hsl(var(--primary) / 0.44)",
];

function toChartRows(stages: FunnelStageCount[]): ChartRow[] {
  return stages.map((stage, index) => ({
    label: stage.label,
    count: stage.count,
    fill: STAGE_COLORS[index] ?? STAGE_COLORS[STAGE_COLORS.length - 1],
  }));
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{row.label}</p>
      <p className="tabular-nums text-muted-foreground">
        {row.count.toLocaleString("ja-JP")} 件
      </p>
    </div>
  );
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const data = toChartRows(stages);
  const maxCount = Math.max(...data.map((row) => row.count), 1);

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, maxCount]}
            tickFormatter={(value) => value.toLocaleString("ja-JP")}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={108}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
            {data.map((row) => (
              <Cell key={row.label} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
