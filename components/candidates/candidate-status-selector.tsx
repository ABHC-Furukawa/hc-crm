"use client";

import { useRouter } from "next/navigation";
import type { CandidateStatus } from "@prisma/client";
import { updateCandidateStatusAction } from "@/lib/actions/candidates";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_ORDER,
  CANDIDATE_STATUS_STYLES,
} from "@/lib/validators/candidate";
import { cn } from "@/lib/utils";

export function CandidateStatusSelector({
  candidateId,
  status,
}: {
  candidateId: string;
  status: CandidateStatus;
}) {
  const router = useRouter();

  async function handleChange(formData: FormData) {
    await updateCandidateStatusAction(candidateId, formData);
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
          CANDIDATE_STATUS_STYLES[status]
        )}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {CANDIDATE_STATUS_ORDER.map((value) => (
          <option key={value} value={value}>
            {CANDIDATE_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
