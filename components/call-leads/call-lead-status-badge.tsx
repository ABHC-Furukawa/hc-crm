import type { CallLeadStatus } from "@prisma/client";
import {
  CALL_LEAD_STATUS_LABELS,
  CALL_LEAD_STATUS_STYLES,
} from "@/lib/constants/call-lead-labels";
import { cn } from "@/lib/utils";

export function CallLeadStatusBadge({
  status,
  className,
}: {
  status: CallLeadStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        CALL_LEAD_STATUS_STYLES[status],
        className
      )}
    >
      {CALL_LEAD_STATUS_LABELS[status]}
    </span>
  );
}
