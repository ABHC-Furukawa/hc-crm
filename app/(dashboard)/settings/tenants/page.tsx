import { redirect } from "next/navigation";
import { canManageAllTenants } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { listTenantsWithStats } from "@/lib/tenant/queries";
import {
  TenantListHeader,
  TenantListTable,
} from "@/components/settings/tenant-list-table";

export default async function SettingsTenantsPage() {
  const { user } = await requireTenantContext();

  if (!canManageAllTenants(user.role)) {
    redirect("/settings/tenant");
  }

  const tenants = await listTenantsWithStats();

  return (
    <div className="space-y-4">
      <TenantListHeader />
      <TenantListTable tenants={tenants} />
    </div>
  );
}
