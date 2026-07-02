"use client";

import { useRouter } from "next/navigation";
import type { CallLeadStatus } from "@prisma/client";
import { updateCallLeadAssigneeAction } from "@/lib/actions/call-leads";
import type { AssignableUser } from "@/lib/users/queries";
import { formatUserSurname } from "@/lib/users/display";
import { cn } from "@/lib/utils";

const selectClass =
  "cursor-pointer truncate rounded-md border border-input bg-transparent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CallLeadAssigneeSelector({
  callLeadId,
  assignedUserId,
  status,
  assignableUsers,
  compact,
}: {
  callLeadId: string;
  assignedUserId: string | null;
  status: CallLeadStatus;
  assignableUsers: AssignableUser[];
  compact?: boolean;
}) {
  const router = useRouter();
  const readOnly = status === "CONVERTED";
  const sizeClass = compact
    ? "h-6 max-w-[4.5rem] px-1 text-[10px]"
    : "h-8 max-w-[6.5rem] px-2 text-sm";

  const currentUser = assignableUsers.find((u) => u.id === assignedUserId);
  const displayLabel = currentUser
    ? formatUserSurname(currentUser)
    : "未設定";

  if (readOnly) {
    return (
      <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-sm")}>
        {displayLabel}
      </span>
    );
  }

  async function handleChange(formData: FormData) {
    await updateCallLeadAssigneeAction(callLeadId, formData);
    router.refresh();
  }

  return (
    <form action={handleChange}>
      <select
        key={assignedUserId ?? "none"}
        name="assignedUserId"
        defaultValue={assignedUserId ?? ""}
        aria-label="担当者"
        title={currentUser?.name ?? "担当未設定"}
        className={cn(selectClass, sizeClass, !assignedUserId && "text-muted-foreground")}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">未設定</option>
        {assignableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {formatUserSurname(user)}
          </option>
        ))}
      </select>
    </form>
  );
}
