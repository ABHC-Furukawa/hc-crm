"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RESUME_EDUCATION_EVENTS,
  RESUME_WORK_EVENTS,
} from "@/lib/resumes/constants";
import type {
  ResumeEducationEntry,
  ResumeLicenseEntry,
  ResumeWorkHistoryEntry,
} from "@/lib/resumes/types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function YearMonthFields({
  year,
  month,
  onYearChange,
  onMonthChange,
}: {
  year: number | "";
  month: number | "";
  onYearChange: (value: number | "") => void;
  onMonthChange: (value: number | "") => void;
}) {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        min={1900}
        max={2100}
        placeholder="年"
        value={year}
        onChange={(e) =>
          onYearChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className="w-24"
      />
      <Input
        type="number"
        min={1}
        max={12}
        placeholder="月"
        value={month}
        onChange={(e) =>
          onMonthChange(e.target.value === "" ? "" : Number(e.target.value))
        }
        className="w-20"
      />
    </div>
  );
}

export function ResumeEducationFields({
  entries,
  onChange,
}: {
  entries: ResumeEducationEntry[];
  onChange: (entries: ResumeEducationEntry[]) => void;
}) {
  function update(index: number, patch: Partial<ResumeEducationEntry>) {
    onChange(entries.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([
      ...entries,
      { year: new Date().getFullYear(), month: 4, school: "", event: "入学" },
    ]);
  }

  function removeRow(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">学歴がありません。「行を追加」で入力してください。</p>
      )}
      {entries.map((row, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_1fr_auto_auto]"
        >
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">年月</Label>
            <YearMonthFields
              year={row.year}
              month={row.month}
              onYearChange={(year) =>
                update(index, { year: year === "" ? row.year : year })
              }
              onMonthChange={(month) =>
                update(index, { month: month === "" ? row.month : month })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">学校名</Label>
            <Input
              value={row.school}
              onChange={(e) => update(index, { school: e.target.value })}
              placeholder="〇〇高等学校"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">区分</Label>
            <select
              className={selectClass}
              value={row.event}
              onChange={(e) =>
                update(index, { event: e.target.value as ResumeEducationEntry["event"] })
              }
            >
              {RESUME_EDUCATION_EVENTS.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-2 h-4 w-4" />
        行を追加
      </Button>
    </div>
  );
}

export function ResumeWorkHistoryFields({
  entries,
  onChange,
}: {
  entries: ResumeWorkHistoryEntry[];
  onChange: (entries: ResumeWorkHistoryEntry[]) => void;
}) {
  function update(index: number, patch: Partial<ResumeWorkHistoryEntry>) {
    onChange(entries.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([
      ...entries,
      {
        year: new Date().getFullYear(),
        month: 4,
        company: "",
        event: "入社",
        description: "",
      },
    ]);
  }

  function removeRow(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">職歴がありません。「行を追加」で入力してください。</p>
      )}
      {entries.map((row, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-3">
          <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto_auto]">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">年月</Label>
              <YearMonthFields
                year={row.year}
                month={row.month}
                onYearChange={(year) =>
                  update(index, { year: year === "" ? row.year : year })
                }
                onMonthChange={(month) =>
                  update(index, { month: month === "" ? row.month : month })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">会社名</Label>
              <Input
                value={row.company}
                onChange={(e) => update(index, { company: e.target.value })}
                placeholder="〇〇株式会社"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">区分</Label>
              <select
                className={selectClass}
                value={row.event}
                onChange={(e) =>
                  update(index, {
                    event: e.target.value as ResumeWorkHistoryEntry["event"],
                  })
                }
              >
                {RESUME_WORK_EVENTS.map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                title="削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">業務内容（任意）</Label>
            <Input
              value={row.description ?? ""}
              onChange={(e) => update(index, { description: e.target.value })}
              placeholder="担当業務・実績など"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-2 h-4 w-4" />
        行を追加
      </Button>
    </div>
  );
}

export function ResumeLicenseFields({
  entries,
  onChange,
}: {
  entries: ResumeLicenseEntry[];
  onChange: (entries: ResumeLicenseEntry[]) => void;
}) {
  function update(index: number, patch: Partial<ResumeLicenseEntry>) {
    onChange(entries.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    onChange([...entries, { year: null, month: null, name: "" }]);
  }

  function removeRow(index: number) {
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">資格・免許がありません。</p>
      )}
      {entries.map((row, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[auto_1fr_auto]"
        >
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">取得年月（任意）</Label>
            <YearMonthFields
              year={row.year ?? ""}
              month={row.month ?? ""}
              onYearChange={(year) =>
                update(index, { year: year === "" ? null : year })
              }
              onMonthChange={(month) =>
                update(index, { month: month === "" ? null : month })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">資格・免許名</Label>
            <Input
              value={row.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="普通自動車第一種運転免許"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(index)}
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="mr-2 h-4 w-4" />
        行を追加
      </Button>
    </div>
  );
}
