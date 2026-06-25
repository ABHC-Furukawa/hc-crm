"use client";

import { useTransition } from "react";
import { updateTenantPlanAction } from "@/lib/actions/tenant";
import {
  TENANT_PLAN_OPTIONS,
  isTenantPlanValue,
  type TenantPlanValue,
} from "@/lib/tenant/plan-options";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TenantPlanSelect({
  tenantId,
  plan,
}: {
  tenantId: string;
  plan: string;
}) {
  const [pending, startTransition] = useTransition();
  const selectedPlan: TenantPlanValue = isTenantPlanValue(plan) ? plan : "FREE";

  return (
    <Select
      value={selectedPlan}
      disabled={pending}
      onValueChange={(value) => {
        if (!isTenantPlanValue(value)) return;
        startTransition(() => {
          void updateTenantPlanAction(tenantId, value);
        });
      }}
    >
      <SelectTrigger className="h-8 w-[9.5rem] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TENANT_PLAN_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
