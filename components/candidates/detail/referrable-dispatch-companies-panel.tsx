"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateReferrableDispatchCompaniesAction } from "@/lib/actions/candidates";
import {
  REFERRABLE_DISPATCH_COMPANY_OPTIONS,
  type ReferrableDispatchCompanyKey,
} from "@/lib/constants/referrable-dispatch-companies";
import { Separator } from "@/components/ui/separator";

export function ReferrableDispatchCompaniesPanel({
  candidateId,
  selectedKeys,
}: {
  candidateId: string;
  selectedKeys: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selected = new Set(selectedKeys);

  function handleToggle(key: ReferrableDispatchCompanyKey, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(key);
    else next.delete(key);

    startTransition(async () => {
      await updateReferrableDispatchCompaniesAction(candidateId, [...next]);
      router.refresh();
    });
  }

  return (
    <>
      <Separator />
      <div className={isPending ? "opacity-70" : undefined}>
        <p className="mb-2 text-sm font-medium">紹介可能派遣会社</p>
        <div className="grid grid-cols-1 gap-1.5">
          {REFERRABLE_DISPATCH_COMPANY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-muted/60"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={selected.has(option.value)}
                disabled={isPending}
                onChange={(e) => handleToggle(option.value, e.target.checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
