"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { EmploymentType } from "@prisma/client";
import type { JobFilters } from "@/lib/jobs/filters";
import { hasActiveJobFilters } from "@/lib/jobs/filters";
import { EMPLOYMENT_TYPE_LABELS, JOB_FIELD_LABELS } from "@/lib/jobs/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

const EMPLOYMENT_TYPES = Object.values(EmploymentType);

export function JobFilters({ filters }: { filters: JobFilters }) {
  const hasFilters = hasActiveJobFilters(filters);
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
            <Link href="/jobs">
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
              <div className="space-y-2">
                <Label htmlFor="companyName">{JOB_FIELD_LABELS.companyName}</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="部分一致"
                  defaultValue={filters.companyName ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">{JOB_FIELD_LABELS.jobTitle}</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="部分一致"
                  defaultValue={filters.jobTitle ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{JOB_FIELD_LABELS.location}</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="部分一致"
                  defaultValue={filters.location ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">{JOB_FIELD_LABELS.employmentType}</Label>
                <select
                  id="employmentType"
                  name="employmentType"
                  defaultValue={filters.employmentType ?? ""}
                  className={selectClass}
                >
                  <option value="">すべて</option>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftType">{JOB_FIELD_LABELS.shiftType}</Label>
                <Input
                  id="shiftType"
                  name="shiftType"
                  placeholder="部分一致"
                  defaultValue={filters.shiftType ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">{JOB_FIELD_LABELS.salary}</Label>
                <Input
                  id="salary"
                  name="salary"
                  placeholder="部分一致"
                  defaultValue={filters.salary ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralFee">{JOB_FIELD_LABELS.referralFee}</Label>
                <Input
                  id="referralFee"
                  name="referralFee"
                  placeholder="部分一致"
                  defaultValue={filters.referralFee ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort">並び替え</Label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={filters.sort ?? "updatedAt"}
                  className={selectClass}
                >
                  <option value="updatedAt">更新日時</option>
                  <option value="companyName">{JOB_FIELD_LABELS.companyName}</option>
                  <option value="jobTitle">{JOB_FIELD_LABELS.jobTitle}</option>
                  <option value="location">{JOB_FIELD_LABELS.location}</option>
                  <option value="salary">{JOB_FIELD_LABELS.salary}</option>
                  <option value="referralFee">{JOB_FIELD_LABELS.referralFee}</option>
                  <option value="maxAge">{JOB_FIELD_LABELS.maxAge}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">順序</Label>
                <select
                  id="order"
                  name="order"
                  defaultValue={filters.order ?? "desc"}
                  className={selectClass}
                >
                  <option value="desc">降順</option>
                  <option value="asc">昇順</option>
                </select>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <Button type="submit">検索</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
