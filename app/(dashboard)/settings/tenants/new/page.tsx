import { redirect } from "next/navigation";
import { canManageAllTenants } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { CreateTenantForm } from "@/components/settings/create-tenant-form";

export default async function SettingsTenantsNewPage() {
  const { user } = await requireTenantContext();

  if (!canManageAllTenants(user.role)) {
    redirect("/settings/tenant");
  }

  return <CreateTenantForm />;
}
