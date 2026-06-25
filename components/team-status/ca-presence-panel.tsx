"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import type { CaPresenceRow } from "@/lib/auth/presence";
import { CA_PRESENCE_ONLINE_WINDOW_MS } from "@/lib/auth/presence-constants";
import { USER_ROLE_LABELS } from "@/lib/auth/rbac";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
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

const REFRESH_INTERVAL_MS = 60_000;
const ONLINE_MINUTES = CA_PRESENCE_ONLINE_WINDOW_MS / 60_000;

function PresenceBadge({ status }: { status: CaPresenceRow["status"] }) {
  if (status === "online") {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        オンライン
      </Badge>
    );
  }

  if (status === "offline") {
    return <Badge variant="secondary">オフライン</Badge>;
  }

  return <Badge variant="outline">未記録</Badge>;
}

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "—";
  return formatRelativeTime(lastSeenAt);
}

type CaPresencePanelProps = {
  rows: CaPresenceRow[];
  viewerRole: UserRole;
  scopeLabel: string;
  generatedAt: string;
};

export function CaPresencePanel({
  rows,
  viewerRole,
  scopeLabel,
  generatedAt,
}: CaPresencePanelProps) {
  const router = useRouter();
  const onlineCount = rows.filter((row) => row.status === "online").length;
  const showManagerColumn =
    viewerRole === UserRole.ADMIN || viewerRole === UserRole.DEVELOP;

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">オンライン</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{onlineCount}</p>
            <p className="text-xs text-muted-foreground">
              {ONLINE_MINUTES} 分以内に操作あり
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">対象 CA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rows.length}</p>
            <p className="text-xs text-muted-foreground">{scopeLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">最終更新</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{formatDateTime(generatedAt)}</p>
            <p className="text-xs text-muted-foreground">60 秒ごとに自動更新</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CA 一覧</CardTitle>
          <CardDescription>
            CRM 操作から {ONLINE_MINUTES}{" "}
            分以内をオンラインと表示します（{USER_ROLE_LABELS.ADVISOR} のみ）
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              表示対象の CA がいません。
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    <TableHead>メール</TableHead>
                    {showManagerColumn ? <TableHead>所属マネージャー</TableHead> : null}
                    <TableHead>状態</TableHead>
                    <TableHead>最終操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.email}
                      </TableCell>
                      {showManagerColumn ? (
                        <TableCell>{row.managerName ?? "—"}</TableCell>
                      ) : null}
                      <TableCell>
                        <PresenceBadge status={row.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatLastSeen(row.lastSeenAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
