import Link from "next/link";
import { Users, ListTodo, ArrowRight } from "lucide-react";
import { getDashboardStats } from "@/lib/actions/candidates";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CandidateStatusBadge } from "@/components/candidates/candidate-status-badge";
import { KpiDashboardWidget } from "@/components/kpi/kpi-dashboard-widget";
import { ExternalAppsCard } from "@/components/dashboard/external-apps-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CANDIDATE_STATUS_LABELS } from "@/lib/validators/candidate";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { fullName, formatDateTime, formatDate } from "@/lib/utils";
import type { CandidateStatus } from "@prisma/client";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <>
      <DashboardHeader title="TOP" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/candidates" className="block transition-opacity hover:opacity-90">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{CANDIDATE_DISPLAY.assigned}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">一覧を見る →</p>
              </CardContent>
            </Card>
          </Link>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">未完了タスク</CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{stats.openTasks}</p>
              {stats.openTaskItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">未完了タスクはありません</p>
              ) : (
                <ul className="divide-y border-t pt-2">
                  {stats.openTaskItems.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/candidates/${task.candidate.id}?tab=tasks`}
                        className="-mx-1 block rounded-md px-1 py-2 transition-colors hover:bg-muted/60"
                      >
                        <p className="truncate text-sm font-medium text-primary">
                          {task.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fullName(task.candidate.lastName, task.candidate.firstName)}
                          {task.dueAt
                            ? ` · 期限 ${formatDate(task.dueAt)}`
                            : " · 期限未設定"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">ステータス内訳</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.byStatus.map((item) => (
                  <span key={item.status} className="text-sm text-muted-foreground">
                    {CANDIDATE_STATUS_LABELS[item.status as CandidateStatus]}:{" "}
                    <strong className="text-foreground">{item._count}</strong>
                  </span>
                ))}
                {stats.byStatus.length === 0 && (
                  <span className="text-sm text-muted-foreground">データなし</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <KpiDashboardWidget />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{CANDIDATE_DISPLAY.recentUpdated}</CardTitle>
                <CardDescription>直近5件</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/candidates">
                  すべて見る
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">{CANDIDATE_DISPLAY.emptyDashboard}</p>
              ) : (
                <ul className="divide-y">
                  {stats.recentCandidates.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/candidates/${c.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-primary">
                            {fullName(c.lastName, c.firstName)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.phone} · 更新 {formatDateTime(c.updatedAt)}
                          </p>
                        </div>
                        <CandidateStatusBadge status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <ExternalAppsCard />
        </div>
      </main>
    </>
  );
}
