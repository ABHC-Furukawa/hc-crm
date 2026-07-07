import Link from "next/link";
import { ResumeStatus } from "@prisma/client";
import { X } from "lucide-react";
import type { ResumeFilters } from "@/lib/resumes/filters";
import { hasActiveResumeFilters } from "@/lib/resumes/filters";
import { buildResumeListHref } from "@/lib/resumes/list-url";
import { RESUME_STATUS_LABELS } from "@/lib/resumes/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STATUS_TABS: Array<{ value?: ResumeStatus; label: string }> = [
  { label: "すべて" },
  { value: ResumeStatus.DRAFT, label: RESUME_STATUS_LABELS.DRAFT },
  { value: ResumeStatus.READY, label: RESUME_STATUS_LABELS.READY },
];

export function ResumeListFilters({ filters }: { filters: ResumeFilters }) {
  const hasFilters = hasActiveResumeFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const href = buildResumeListHref({
            q: filters.q,
            status: tab.value,
          });
          const isActive = filters.status === tab.value || (!filters.status && !tab.value);

          return (
            <Button
              key={tab.label}
              asChild
              size="sm"
              variant={isActive ? "default" : "outline"}
            >
              <Link href={href}>{tab.label}</Link>
            </Button>
          );
        })}
        {hasFilters && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/resumes">
              <X className="mr-1 h-4 w-4" />
              クリア
            </Link>
          </Button>
        )}
      </div>

      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {filters.status && (
          <input type="hidden" name="status" value={filters.status} />
        )}
        <div className="flex-1 space-y-2">
          <Label htmlFor="q">氏名で検索</Label>
          <Input
            id="q"
            name="q"
            placeholder="氏名・ふりがな・候補者名"
            defaultValue={filters.q ?? ""}
          />
        </div>
        <Button type="submit" className="sm:mb-0.5">
          検索
        </Button>
      </form>
    </div>
  );
}

export function ResumeWorkflowSteps({
  current,
  className,
}: {
  current: "create" | "edit" | "ready" | "export";
  className?: string;
}) {
  const steps = [
    { id: "create", label: "作成" },
    { id: "edit", label: "編集" },
    { id: "ready", label: "完成" },
    { id: "export", label: "PDF出力" },
  ] as const;

  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step.id} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">→</span>}
            <Badge
              variant={isCurrent ? "default" : isDone ? "secondary" : "outline"}
              className={cn("font-normal", isDone && "opacity-80")}
            >
              {step.label}
            </Badge>
          </li>
        );
      })}
    </ol>
  );
}
