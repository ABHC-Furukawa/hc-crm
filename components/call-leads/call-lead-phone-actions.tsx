"use client";

import { useState, useTransition } from "react";
import { Copy, Phone } from "lucide-react";
import type { CallLeadStatus } from "@prisma/client";
import { initiateCallAction } from "@/lib/actions/call-attempts";
import { isCallLeadGrayedOut } from "@/lib/constants/call-lead-labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  callLeadId: string;
  phone: string | null;
  status: CallLeadStatus;
  compact?: boolean;
};

export function CallLeadPhoneActions({ callLeadId, phone, status, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dialDisabled =
    !phone ||
    isCallLeadGrayedOut(status) ||
    status === "CONVERTED" ||
    pending;

  function handleDial() {
    setError(null);
    startTransition(async () => {
      const result = await initiateCallAction(callLeadId);
      if (result.success) {
        if (result.dialUri) {
          window.location.href = result.dialUri;
        }
      } else {
        setError(result.error);
      }
    });
  }

  async function handleCopy() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("コピーに失敗しました");
    }
  }

  if (!phone) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className={cn("flex flex-col gap-1", compact && "items-end")}>
      <div className="flex items-center gap-1">
        <span className={cn("text-sm", compact && "max-w-[120px] truncate")}>{phone}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleCopy}
          title="電話番号をコピー"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="sr-only">コピー</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDial}
          disabled={dialDisabled}
          title="発信"
        >
          <Phone className="h-3.5 w-3.5" />
          <span className="sr-only">発信</span>
        </Button>
      </div>
      {copied && <span className="text-xs text-muted-foreground">コピーしました</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
