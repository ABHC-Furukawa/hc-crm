import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { canAccessPath, getRoutesForRole } from "@/lib/auth/navigation";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { DevelopTenantBanner } from "@/components/layout/develop-tenant-banner";
import { DevelopTenantSwitcher } from "@/components/layout/develop-tenant-switcher";
import { UserNav } from "@/components/layout/user-nav";
import { requireTenantContext } from "@/lib/tenant/context";
import { getTenantSummary, listAllTenants } from "@/lib/tenant/queries";

export async function DashboardHeader({ title }: { title: string }) {
  const { user, tenantId, homeTenantId, isDevelopTenantOverride } =
    await requireTenantContext();
  const navRoutes = getRoutesForRole(user.role);
  const tenants =
    user.role === UserRole.DEVELOP ? await listAllTenants() : [];
  const activeTenant = await getTenantSummary(tenantId);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <MobileNav navRoutes={navRoutes} />
      <h1 className="flex-1 text-lg font-semibold md:text-xl">{title}</h1>
      {user.role === UserRole.DEVELOP && activeTenant && (
        <DevelopTenantSwitcher
          tenants={tenants}
          currentTenantId={tenantId}
          homeTenantId={homeTenantId}
        />
      )}
      <UserNav name={user.name} email={user.email} role={user.role} />
      {isDevelopTenantOverride && activeTenant ? (
        <span className="sr-only">参照中テナント: {activeTenant.name}</span>
      ) : null}
    </header>
  );
}

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, tenantId, isDevelopTenantOverride } =
    await requireTenantContext();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/dashboard";

  if (!canAccessPath(pathname, user.role)) {
    redirect("/dashboard");
  }

  const navRoutes = getRoutesForRole(user.role);
  const activeTenant = isDevelopTenantOverride
    ? await getTenantSummary(tenantId)
    : null;

  return (
    <div className="flex min-h-screen">
      <AppSidebar navRoutes={navRoutes} />
      <div className="flex flex-1 flex-col">
        {activeTenant ? (
          <DevelopTenantBanner tenantName={activeTenant.name} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
