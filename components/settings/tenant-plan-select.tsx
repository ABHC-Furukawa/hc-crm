"use client";

import { useTransition } from "react";
import { TenantPlan } from "@prisma/client";
import { updateTenantPlanAction } from "@/lib/actions/tenant";
import { TENANT_PLAN_OPTIONS } from "@/lib/tenant/plan-config";
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
  plan: TenantPlan;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={plan}
      disabled={pending}
      onValueChange={(value) => {
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
