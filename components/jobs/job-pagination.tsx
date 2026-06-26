import Link from "next/link";
import type { JobFilters } from "@/lib/jobs/filters";
import { JOB_PAGE_SIZE } from "@/lib/jobs/constants";
import { buildJobListHref } from "@/lib/jobs/list-url";
import { Button } from "@/components/ui/button";

export function JobPagination({
  filters,
  page,
  totalPages,
  total,
}: {
  filters: JobFilters;
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * JOB_PAGE_SIZE + 1;
  const end = Math.min(page * JOB_PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total} 件中 {start}–{end} 件 · {page} / {totalPages} ページ
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildJobListHref(filters, page - 1)}>前へ</Link>
          </Button>
        )}
        {page < totalPages && (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildJobListHref(filters, page + 1)}>次へ</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
