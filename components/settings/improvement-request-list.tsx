import type { listImprovementRequestsForDeveloper } from "@/lib/improvement-requests/queries";
import { USER_ROLE_LABELS } from "@/lib/auth/rbac";
import {
  IMPROVEMENT_REQUEST_PRIORITY_LABELS,
  IMPROVEMENT_REQUEST_PRIORITY_STYLES,
} from "@/lib/constants/improvement-request";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RequestItem = Awaited<
  ReturnType<typeof listImprovementRequestsForDeveloper>
>[number];

function formatDateTime(value: Date): string {
  return value.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export function ImprovementRequestList({ requests }: { requests: RequestItem[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          まだ投稿はありません。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle className="text-base">{request.name}</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  IMPROVEMENT_REQUEST_PRIORITY_STYLES[request.priority]
                )}
              >
                優先度: {IMPROVEMENT_REQUEST_PRIORITY_LABELS[request.priority]}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>投稿者: {request.submittedBy.name}</span>
              <span>{request.submittedBy.email}</span>
              <span>ロール: {USER_ROLE_LABELS[request.submittedBy.role]}</span>
              <span>テナント: {request.tenant.name}</span>
              <span>{formatDateTime(request.createdAt)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {request.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
