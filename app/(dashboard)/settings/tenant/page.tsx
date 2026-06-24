import { notFound } from "next/navigation";
import { requireTenantContext } from "@/lib/tenant/context";
import { getTenantSummary, getTenantUsageSnapshot } from "@/lib/tenant/queries";
import { TenantPlanUsageCard } from "@/components/settings/tenant-plan-usage-card";
import { TenantSettingsForm } from "@/components/settings/tenant-settings-form";

export default async function SettingsTenantPage() {
  const { tenantId } = await requireTenantContext();
  const tenant = await getTenantSummary(tenantId);

  if (!tenant) {
    notFound();
  }

  const usageSnapshot = await getTenantUsageSnapshot(tenantId, tenant.plan);

  return (
    <div className="space-y-6">
      <TenantSettingsForm
        tenant={tenant}
        readOnlySlug
      />
      <TenantPlanUsageCard
        planLabel={usageSnapshot.planLabel}
        usage={usageSnapshot.usage}
        limits={usageSnapshot.limits}
      />
    </div>
  );
}
