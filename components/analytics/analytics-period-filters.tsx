"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANALYTICS_PERIOD_LABELS,
  formatWeekLabel,
  shiftWeek,
  type AnalyticsPeriodType,
} from "@/lib/analytics/period-client";
import { formatMonthLabel, shiftYearMonth } from "@/lib/kpi/dates";
import type { AssignableUser } from "@/lib/users/queries";

type AnalyticsPeriodFiltersProps = {
  period: AnalyticsPeriodType;
  yearMonth: string;
  weekStart: string;
  dateFrom: string;
  dateTo: string;
  scope: "personal" | "team";
  scopeUserId: string | null;
  canSelectUser: boolean;
  assignableUsers: AssignableUser[];
};

export function AnalyticsPeriodFilters({
  period,
  yearMonth,
  weekStart,
  dateFrom,
  dateTo,
  scope,
  scopeUserId,
  canSelectUser,
  assignableUsers,
}: AnalyticsPeriodFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`/analytics?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={period}
        onValueChange={(value) => navigate({ period: value })}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ANALYTICS_PERIOD_LABELS) as AnalyticsPeriodType[]).map(
            (key) => (
              <SelectItem key={key} value={key}>
                {ANALYTICS_PERIOD_LABELS[key]}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>

      {period === "month" && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="前月"
            onClick={() =>
              navigate({
                period: "month",
                yearMonth: shiftYearMonth(yearMonth, -1),
              })
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[7rem] text-center text-sm font-medium">
            {formatMonthLabel(yearMonth)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="翌月"
            onClick={() =>
              navigate({
                period: "month",
                yearMonth: shiftYearMonth(yearMonth, 1),
              })
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {period === "week" && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="前週"
            onClick={() =>
              navigate({ period: "week", weekStart: shiftWeek(weekStart, -1) })
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[11rem] text-center text-sm font-medium">
            {formatWeekLabel(weekStart)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="翌週"
            onClick={() =>
              navigate({ period: "week", weekStart: shiftWeek(weekStart, 1) })
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {period === "day" && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            navigate({
              period: "day",
              from: String(fd.get("from") ?? dateFrom),
              to: String(fd.get("to") ?? dateTo),
            });
          }}
        >
          <Input
            type="date"
            name="from"
            defaultValue={dateFrom}
            className="w-[150px]"
          />
          <span className="text-sm text-muted-foreground">〜</span>
          <Input
            type="date"
            name="to"
            defaultValue={dateTo}
            className="w-[150px]"
          />
          <Button type="submit" variant="outline" size="sm">
            適用
          </Button>
        </form>
      )}

      {canSelectUser && (
        <>
          <Select
            value={scope}
            onValueChange={(value) =>
              navigate({
                scope: value,
                userId: value === "team" ? undefined : scopeUserId ?? undefined,
              })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">個人</SelectItem>
              <SelectItem value="team">チーム</SelectItem>
            </SelectContent>
          </Select>

          {scope === "personal" && assignableUsers.length > 0 && (
            <Select
              value={
                scopeUserId &&
                assignableUsers.some((u) => u.id === scopeUserId)
                  ? scopeUserId
                  : assignableUsers[0]?.id
              }
              onValueChange={(value) =>
                navigate({ scope: "personal", userId: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="担当者" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  );
}
