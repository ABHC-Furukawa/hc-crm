import { TenantAuditAction } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatTenantAuditSummary,
  TENANT_AUDIT_ACTION_LABELS,
} from "@/lib/tenant/audit";

export type TenantAuditLogItem = {
  id: string;
  action: TenantAuditAction;
  metadata: unknown;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    email: string;
  } | null;
};

function actionBadgeVariant(
  action: TenantAuditAction
): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case TenantAuditAction.LIMIT_BLOCKED:
    case TenantAuditAction.EVICT_FALLBACK_BLOCK:
      return "destructive";
    case TenantAuditAction.RECORD_EVICTED:
      return "secondary";
    default:
      return "outline";
  }
}

export function TenantAuditLogTable({
  logs,
}: {
  logs: TenantAuditLogItem[];
}) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>監査ログ</CardTitle>
          <CardDescription>
            上限ブロック・退避・プラン変更・招待などの記録
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            監査ログはまだありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>監査ログ</CardTitle>
        <CardDescription>
          上限ブロック・退避・プラン変更・招待など（最新 {logs.length} 件）
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        <div className="rounded-b-lg border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>操作者</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {log.createdAt.toLocaleString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionBadgeVariant(log.action)}>
                      {TENANT_AUDIT_ACTION_LABELS[log.action]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md text-sm">
                    {formatTenantAuditSummary(log.action, log.metadata)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.actor?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
