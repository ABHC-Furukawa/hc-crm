import {
  FUNNEL_STAGE_IDS,
  FUNNEL_STAGE_LABELS,
  type FunnelBottleneck,
  type FunnelConversionPair,
  type FunnelStageCount,
} from "@/lib/analytics/constants";

export function computeFunnelConversions(
  stages: FunnelStageCount[]
): FunnelConversionPair[] {
  const countByStage = new Map(stages.map((stage) => [stage.stageId, stage.count]));
  const pairs: FunnelConversionPair[] = [];

  for (let i = 0; i < FUNNEL_STAGE_IDS.length - 1; i += 1) {
    const fromStageId = FUNNEL_STAGE_IDS[i];
    const toStageId = FUNNEL_STAGE_IDS[i + 1];
    const fromCount = countByStage.get(fromStageId) ?? 0;
    const toCount = countByStage.get(toStageId) ?? 0;

    pairs.push({
      fromStageId,
      toStageId,
      fromLabel: FUNNEL_STAGE_LABELS[fromStageId],
      toLabel: FUNNEL_STAGE_LABELS[toStageId],
      fromCount,
      toCount,
      conversionRate:
        fromCount > 0 ? Math.round((toCount / fromCount) * 1000) / 10 : null,
    });
  }

  return pairs;
}

export function findFunnelBottleneck(
  pairs: FunnelConversionPair[]
): FunnelBottleneck | null {
  const eligible = pairs.filter(
    (pair): pair is FunnelConversionPair & { conversionRate: number } =>
      pair.conversionRate !== null && pair.fromCount > 0
  );

  if (eligible.length === 0) return null;

  const worst = eligible.reduce((min, pair) =>
    pair.conversionRate < min.conversionRate ? pair : min
  );

  return { pair: worst, rank: 1 };
}

export function computeOverallConversionRate(
  stages: FunnelStageCount[]
): number | null {
  const first = stages[0]?.count ?? 0;
  const last = stages[stages.length - 1]?.count ?? 0;
  if (first <= 0) return null;
  return Math.round((last / first) * 1000) / 10;
}
