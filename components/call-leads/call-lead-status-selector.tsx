"use client";

import { useRouter } from "next/navigation";
import type { CallLeadStatus } from "@prisma/client";
import { updateCallLeadStatusAction } from "@/lib/actions/call-leads";
import {
  CALL_LEAD_STATUS_LABELS,
  CALL_LEAD_STATUS_STYLES,
} from "@/lib/constants/call-lead-labels";
import { cn } from "@/lib/utils";

const EDITABLE_STATUSES: CallLeadStatus[] = [
  "BLANK",
  "HEARING",
  "NO_ANSWER",
  "DUPLICATE",
  "OUT_OF_SCOPE",
];

export function CallLeadStatusSelector({
  callLeadId,
  status,
  disabled,
}: {
  callLeadId: string;
  status: CallLeadStatus;
  disabled?: boolean;
}) {
  const router = useRouter();

  if (status === "CONVERTED" || disabled) {
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium",
          CALL_LEAD_STATUS_STYLES[status]
        )}
      >
        {CALL_LEAD_STATUS_LABELS[status]}
      </span>
    );
  }

  async function handleChange(formData: FormData) {
    await updateCallLeadStatusAction(callLeadId, formData);
    router.refresh();
  }

  return (
    <form action={handleChange}>
      <select
        key={status}
        name="status"
        defaultValue={status}
        aria-label="ステータス"
        className={cn(
          "h-7 max-w-[9rem] cursor-pointer truncate rounded-full border px-2.5 text-xs font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          CALL_LEAD_STATUS_STYLES[status]
        )}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {EDITABLE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {CALL_LEAD_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
