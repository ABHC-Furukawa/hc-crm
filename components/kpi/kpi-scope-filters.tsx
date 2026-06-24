"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonthLabel, shiftYearMonth } from "@/lib/kpi/dates";
import type { AssignableUser } from "@/lib/users/queries";

type KpiScopeFiltersProps = {
  yearMonth: string;
  scope: "personal" | "team";
  scopeUserId: string | null;
  canSelectUser: boolean;
  assignableUsers: AssignableUser[];
};

export function KpiScopeFilters({
  yearMonth,
  scope,
  scopeUserId,
  canSelectUser,
  assignableUsers,
}: KpiScopeFiltersProps) {
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
    router.push(`/kpi?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="前月"
          onClick={() =>
            navigate({ yearMonth: shiftYearMonth(yearMonth, -1) })
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
            navigate({ yearMonth: shiftYearMonth(yearMonth, 1) })
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

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

      <Button variant="outline" size="sm" asChild className="ml-auto">
        <Link href={`/kpi/goals?yearMonth=${yearMonth}`}>月次目標設定</Link>
      </Button>
    </div>
  );
}
