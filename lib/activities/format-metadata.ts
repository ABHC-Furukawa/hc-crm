import type { ActivityAction, ActivityEntityType } from "@prisma/client";
import { CANDIDATE_STATUS_LABELS } from "@/lib/validators/candidate";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
} from "@/lib/constants/labels";

export function formatActivityMetadata(
  action: ActivityAction,
  metadata: unknown
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const data = metadata as Record<string, unknown>;

  if (action === "STATUS_CHANGED" && "from" in data && "to" in data) {
    const from = String(data.from);
    const to = String(data.to);
    const fromLabel =
      from in CANDIDATE_STATUS_LABELS
        ? CANDIDATE_STATUS_LABELS[from as keyof typeof CANDIDATE_STATUS_LABELS]
        : from;
    const toLabel =
      to in CANDIDATE_STATUS_LABELS
        ? CANDIDATE_STATUS_LABELS[to as keyof typeof CANDIDATE_STATUS_LABELS]
        : to;
    return `${fromLabel} → ${toLabel}`;
  }

  if ("section" in data && data.section === "jobCase") {
    return "案件情報を更新";
  }

  if ("title" in data && typeof data.title === "string") {
    return data.title;
  }

  if ("channel" in data) {
    const parts = [data.channel, data.direction].filter(Boolean).map(String);
    return parts.join(" · ");
  }

  if ("source" in data) {
    return `流入: ${String(data.source)}`;
  }

  if ("status" in data) {
    return `ステータス: ${String(data.status)}`;
  }

  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ");
}

export function activityFilterHref(
  candidateId: string,
  filters: { action?: ActivityAction; entityType?: ActivityEntityType; page?: number }
): string {
  const params = new URLSearchParams({ tab: "activity" });
  if (filters.action) params.set("action", filters.action);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  return `/candidates/${candidateId}?${params.toString()}`;
}
