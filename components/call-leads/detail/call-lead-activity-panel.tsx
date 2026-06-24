import type { CallLeadActivityItem } from "@/lib/call-leads/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CALL_LEAD_ACTIVITY_ACTION_LABELS,
  CALL_LEAD_ENTITY_TYPE_LABELS,
} from "@/lib/constants/call-lead-labels";
import { formatDateTime } from "@/lib/utils";

export function CallLeadActivityPanel({
  activities,
}: {
  activities: CallLeadActivityItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">活動履歴 ({activities.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">活動履歴はまだありません</p>
        ) : (
          <ul className="space-y-4">
            {activities.map((item) => (
              <li key={item.id} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">
                      {CALL_LEAD_ACTIVITY_ACTION_LABELS[item.action]}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {formatDateTime(item.occurredAt)}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.user?.name ?? "システム"} ·{" "}
                    {CALL_LEAD_ENTITY_TYPE_LABELS[item.entityType]}
                  </p>
                  {item.metadata != null && typeof item.metadata === "object" && (
                    <pre className="mt-2 max-h-24 overflow-auto rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
