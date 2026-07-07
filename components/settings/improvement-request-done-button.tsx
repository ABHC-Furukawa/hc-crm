"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { markImprovementRequestDoneAction } from "@/lib/actions/improvement-requests";
import { Button } from "@/components/ui/button";

export function ImprovementRequestDoneButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDone() {
    startTransition(async () => {
      await markImprovementRequestDoneAction(requestId);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={handleDone}
    >
      <Check className="mr-1 h-4 w-4" />
      {pending ? "処理中..." : "Done"}
    </Button>
  );
}
