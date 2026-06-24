import { redirect } from "next/navigation";
import { canManageTenantSettings } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { SettingsNav } from "@/components/settings/settings-nav";
import { DashboardHeader } from "@/components/layout/dashboard-shell";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireTenantContext();

  if (!canManageTenantSettings(user.role)) {
    redirect("/dashboard");
  }

  return (
    <>
      <DashboardHeader title="設定" />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <SettingsNav role={user.role} />
        {children}
      </main>
    </>
  );
}
