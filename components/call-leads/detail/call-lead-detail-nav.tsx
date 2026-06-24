"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CALL_LEAD_DETAIL_TABS,
  type CallLeadDetailTabId,
} from "@/lib/constants/call-lead-labels";
import { cn } from "@/lib/utils";

export function CallLeadDetailNav({ activeTab }: { activeTab: CallLeadDetailTabId }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(tab: CallLeadDetailTabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
      {CALL_LEAD_DETAIL_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={hrefFor(tab.id)}
          className={cn(
            "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
