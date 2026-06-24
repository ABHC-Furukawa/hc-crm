"use client";

import { useTransition } from "react";
import { setDevelopTenantAction } from "@/lib/actions/tenant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TenantOption = {
  id: string;
  name: string;
  slug: string;
};

export function DevelopTenantSwitcher({
  tenants,
  currentTenantId,
  homeTenantId,
}: {
  tenants: TenantOption[];
  currentTenantId: string;
  homeTenantId: string;
}) {
  const [pending, startTransition] = useTransition();

  if (tenants.length === 0) return null;

  return (
    <Select
      value={currentTenantId}
      disabled={pending || tenants.length <= 1}
      onValueChange={(value) => {
        startTransition(() => {
          void setDevelopTenantAction(value === homeTenantId ? null : value);
        });
      }}
    >
      <SelectTrigger className="h-8 w-[min(12rem,40vw)] text-xs">
        <SelectValue placeholder="テナント" />
      </SelectTrigger>
      <SelectContent>
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name}
            {tenant.id === homeTenantId ? "（所属）" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
