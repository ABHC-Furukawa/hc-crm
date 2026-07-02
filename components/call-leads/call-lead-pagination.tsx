import Link from "next/link";
import type { CallLeadFilters } from "@/lib/call-leads/filters";
import {
  CALL_LEAD_PAGE_SIZES,
} from "@/lib/call-leads/import/constants";
import { buildCallLeadListHref } from "@/lib/call-leads/list-url";
import { Button } from "@/components/ui/button";

export function CallLeadPagination({
  filters,
  page,
  pageSize,
  totalPages,
  total,
}: {
  filters: CallLeadFilters;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total} 件中 {start}–{end} 件
        {totalPages > 1 && ` · ${page} / ${totalPages} ページ`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>表示件数</span>
          {CALL_LEAD_PAGE_SIZES.map((size) => (
            <Button
              key={size}
              variant={pageSize === size ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={buildCallLeadListHref(filters, 1, size)}>{size}</Link>
            </Button>
          ))}
        </div>
        {totalPages > 1 && (
          <>
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildCallLeadListHref(filters, page - 1, pageSize)}>
                  前へ
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildCallLeadListHref(filters, page + 1, pageSize)}>
                  次へ
                </Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
