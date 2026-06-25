import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCaPresenceForViewer } from "@/lib/auth/presence";
import { canViewCaPresence } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CaPresencePanel } from "@/components/team-status/ca-presence-panel";

function scopeLabelForRole(role: UserRole): string {
  switch (role) {
    case UserRole.MANAGER:
      return "管下 CA";
    case UserRole.ADMIN:
      return "組織内の全 CA";
    case UserRole.DEVELOP:
      return "参照中テナントの全 CA";
    default:
      return "CA";
  }
}

export default async function TeamStatusPage() {
  const { user, tenantId } = await requireTenantContext();

  if (!canViewCaPresence(user.role)) {
    redirect("/dashboard");
  }

  const rows = await getCaPresenceForViewer(user, tenantId);

  return (
    <>
      <DashboardHeader title="CA 稼働状況" />
      <main className="flex-1 p-4 sm:p-6">
        <CaPresencePanel
          rows={rows}
          viewerRole={user.role}
          scopeLabel={scopeLabelForRole(user.role)}
          generatedAt={new Date().toISOString()}
        />
      </main>
    </>
  );
}
