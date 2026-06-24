import Link from "next/link";
import type { ActivityListResult } from "@/lib/actions/activities";
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ENTITY_LABELS,
} from "@/lib/constants/labels";
import {
  activityFilterHref,
  formatActivityMetadata,
} from "@/lib/activities/format-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import {
  UserPlus,
  Pencil,
  Phone,
  MessageSquare,
  StickyNote,
  ListTodo,
  Tag,
  FileText,
  Circle,
} from "lucide-react";
import type { ActivityAction, ActivityEntityType } from "@prisma/client";

const ACTION_ICONS: Partial<
  Record<ActivityAction, React.ComponentType<{ className?: string }>>
> = {
  CREATED: UserPlus,
  UPDATED: Pencil,
  CALL_COMPLETED: Phone,
  COMMUNICATION_LOGGED: MessageSquare,
  NOTE_ADDED: StickyNote,
  TAG_ASSIGNED: Tag,
  TAG_REMOVED: Tag,
  APPLICATION_SUBMITTED: FileText,
  STATUS_CHANGED: ListTodo,
  ASSIGNED: UserPlus,
  UNASSIGNED: UserPlus,
  FILE_UPLOADED: FileText,
  DELETED: Circle,
};

type ActivityTimelinePanelProps = {
  candidateId: string;
  activity: ActivityListResult;
  filters: {
    action?: ActivityAction;
    entityType?: ActivityEntityType;
  };
};

export function ActivityTimelinePanel({
  candidateId,
  activity,
  filters,
}: ActivityTimelinePanelProps) {
  const hasFilters = Boolean(filters.action || filters.entityType);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>アクティビティタイムライン</CardTitle>
          <p className="text-sm text-muted-foreground">{activity.total} 件</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterLink
            href={activityFilterHref(candidateId, {})}
            active={!hasFilters}
            label="すべて"
          />
          <FilterLink
            href={activityFilterHref(candidateId, { action: "STATUS_CHANGED" })}
            active={filters.action === "STATUS_CHANGED"}
            label="ステータス変更"
          />
          <FilterLink
            href={activityFilterHref(candidateId, { action: "COMMUNICATION_LOGGED" })}
            active={filters.action === "COMMUNICATION_LOGGED"}
            label="連絡"
          />
          <FilterLink
            href={activityFilterHref(candidateId, { action: "NOTE_ADDED" })}
            active={filters.action === "NOTE_ADDED"}
            label="メモ"
          />
          <FilterLink
            href={activityFilterHref(candidateId, { entityType: "TASK" })}
            active={filters.entityType === "TASK"}
            label="タスク"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activity.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "条件に一致するアクティビティはありません"
              : "アクティビティはまだありません"}
          </p>
        ) : (
          <ol className="relative space-y-0 border-l border-border pl-6">
            {activity.items.map((item) => {
              const Icon = ACTION_ICONS[item.action] ?? Circle;
              const metadataText = formatActivityMetadata(item.action, item.metadata);

              return (
                <li key={item.id} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </span>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {ACTIVITY_ACTION_LABELS[item.action]}
                        <span className="ml-1 font-normal text-muted-foreground">
                          · {ACTIVITY_ENTITY_LABELS[item.entityType]}
                        </span>
                      </p>
                      {metadataText && (
                        <p className="text-xs text-muted-foreground">{metadataText}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {item.user?.name ?? "システム"}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(item.occurredAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {activity.totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {activity.page} / {activity.totalPages} ページ
            </p>
            <div className="flex gap-2">
              {activity.page > 1 && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={activityFilterHref(candidateId, {
                      ...filters,
                      page: activity.page - 1,
                    })}
                  >
                    前へ
                  </Link>
                </Button>
              )}
              {activity.page < activity.totalPages && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={activityFilterHref(candidateId, {
                      ...filters,
                      page: activity.page + 1,
                    })}
                  >
                    次へ
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
