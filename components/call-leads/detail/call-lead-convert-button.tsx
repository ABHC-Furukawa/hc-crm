"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import {
  convertCallLeadToCandidateAction,
  type ConvertCallLeadActionState,
} from "@/lib/actions/call-leads";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CallLeadConvertButton({
  callLeadId,
  convertedCandidateId,
  compact = false,
  className,
}: {
  callLeadId: string;
  /** 登録済みの場合はボタン非表示 */
  convertedCandidateId?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(
    convertCallLeadToCandidateAction,
    {} as ConvertCallLeadActionState
  );

  if (convertedCandidateId) {
    return null;
  }

  return (
    <form
      action={formAction}
      className={cn(compact ? "inline-block" : "w-full", className)}
      onSubmit={(event) => {
        if (!window.confirm(CANDIDATE_DISPLAY.convertConfirm)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="callLeadId" value={callLeadId} />
      {state.error && (
        <p
          className={cn(
            "text-destructive",
            compact ? "mb-1 text-xs" : "mb-2 text-sm"
          )}
        >
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        size={compact ? "sm" : "default"}
        variant={compact ? "outline" : "default"}
        className={compact ? "whitespace-nowrap" : "w-full"}
        disabled={pending}
      >
        <UserPlus className={cn("h-4 w-4", compact ? "mr-1" : "mr-2")} />
        {pending ? CANDIDATE_DISPLAY.convertPending : CANDIDATE_DISPLAY.convertAction}
      </Button>
    </form>
  );
}
