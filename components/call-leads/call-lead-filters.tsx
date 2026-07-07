"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { CallLeadStatus, ImportSourceType } from "@prisma/client";
import type { CallLeadFilters } from "@/lib/call-leads/filters";
import { hasActiveCallLeadFilters } from "@/lib/call-leads/filters";
import type { AssignableUser } from "@/lib/users/queries";
import { formatUserSurname } from "@/lib/users/display";
import {
  JAPAN_PREFECTURES,
  JAPAN_REGIONS,
} from "@/lib/constants/japan-areas";
import {
  CALL_LEAD_STATUS_LABELS,
  IMPORT_SOURCE_TYPE_LABELS,
} from "@/lib/constants/call-lead-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FILTER_STATUSES: CallLeadStatus[] = [
  CallLeadStatus.BLANK,
  CallLeadStatus.HEARING,
  CallLeadStatus.NO_ANSWER,
  CallLeadStatus.DUPLICATE,
  CallLeadStatus.OUT_OF_SCOPE,
  CallLeadStatus.CONVERTED,
];

const FILTER_SOURCE_TYPES: ImportSourceType[] = [
  ImportSourceType.CSV,
  ImportSourceType.GOOGLE_SHEET,
  ImportSourceType.MANUAL,
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

export function CallLeadFilters({
  filters,
  advisors,
  showAdvisorFilter,
}: {
  filters: CallLeadFilters;
  advisors: AssignableUser[];
  showAdvisorFilter: boolean;
}) {
  const hasFilters = hasActiveCallLeadFilters(filters);
  const [open, setOpen] = useState(hasFilters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {open ? "フィルタを閉じる" : "フィルタ"}
          {hasFilters && !open && (
            <Badge variant="secondary" className="ml-2">
              適用中
            </Badge>
          )}
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/call-leads">
              <X className="mr-1 h-4 w-4" />
              条件をクリア
            </Link>
          </Button>
        )}
      </div>

      {open && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">絞り込み条件</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="q">キーワード</Label>
                <Input
                  id="q"
                  name="q"
                  placeholder="氏名・メール・電話・応募地・Note"
                  defaultValue={filters.q ?? ""}
                />
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-4">
                <Label>ステータス</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {FILTER_STATUSES.map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="status"
                        value={status}
                        defaultChecked={filters.statuses?.includes(status)}
                        className="h-4 w-4 rounded border-input"
                      />
                      {CALL_LEAD_STATUS_LABELS[status]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceType">取込元</Label>
                <select
                  id="sourceType"
                  name="sourceType"
                  defaultValue={filters.sourceType ?? ""}
                  className={selectClass}
                >
                  <option value="">すべて</option>
                  {FILTER_SOURCE_TYPES.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {IMPORT_SOURCE_TYPE_LABELS[sourceType]}
                    </option>
                  ))}
                </select>
              </div>

              {showAdvisorFilter && (
                <div className="space-y-2">
                  <Label htmlFor="assignedUserId">担当者</Label>
                  <select
                    id="assignedUserId"
                    name="assignedUserId"
                    defaultValue={filters.assignedUserId ?? ""}
                    className={selectClass}
                  >
                    <option value="">すべて</option>
                    {advisors.map((advisor) => (
                      <option key={advisor.id} value={advisor.id}>
                        {formatUserSurname(advisor)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ageMin">年齢（以上）</Label>
                <Input
                  id="ageMin"
                  name="ageMin"
                  type="number"
                  min={0}
                  max={150}
                  placeholder="例: 18"
                  defaultValue={filters.ageMin ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageMax">年齢（以下）</Label>
                <Input
                  id="ageMax"
                  name="ageMax"
                  type="number"
                  min={0}
                  max={150}
                  placeholder="例: 54"
                  defaultValue={filters.ageMax ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">地方</Label>
                <select
                  id="region"
                  name="region"
                  defaultValue={filters.region ?? ""}
                  className={selectClass}
                >
                  <option value="">すべて</option>
                  {JAPAN_REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <select
                  id="prefecture"
                  name="prefecture"
                  defaultValue={filters.prefecture ?? ""}
                  className={selectClass}
                >
                  <option value="">すべて</option>
                  {JAPAN_PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="applicationArea">応募地（部分一致）</Label>
                <Input
                  id="applicationArea"
                  name="applicationArea"
                  placeholder="例: 豊田市、四日市"
                  defaultValue={filters.applicationArea ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextCallFrom">次回架電（開始）</Label>
                <Input
                  id="nextCallFrom"
                  name="nextCallFrom"
                  type="date"
                  defaultValue={filters.nextCallFrom ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextCallTo">次回架電（終了）</Label>
                <Input
                  id="nextCallTo"
                  name="nextCallTo"
                  type="date"
                  defaultValue={filters.nextCallTo ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hasNote">Note</Label>
                <select
                  id="hasNote"
                  name="hasNote"
                  defaultValue={
                    filters.hasNote === true
                      ? "true"
                      : filters.hasNote === false
                        ? "false"
                        : ""
                  }
                  className={selectClass}
                >
                  <option value="">すべて</option>
                  <option value="true">あり</option>
                  <option value="false">なし</option>
                </select>
              </div>

              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                <Button type="submit">絞り込む</Button>
                {hasFilters && (
                  <Button type="button" variant="outline" asChild>
                    <Link href="/call-leads">クリア</Link>
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
