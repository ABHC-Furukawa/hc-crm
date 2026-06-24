import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canManageAllTenants, canViewTenantAuditLogs } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { getTenantPlanLabel } from "@/lib/tenant/plan-config";
import {
  getTenantDetail,
  listTenantAuditLogs,
} from "@/lib/tenant/queries";
import { TenantAuditLogTable } from "@/components/settings/tenant-audit-log-table";
import { TenantPlanSelect } from "@/components/settings/tenant-plan-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireTenantContext();
  const { id } = await params;

  if (!canManageAllTenants(user.role)) {
    redirect("/settings/tenant");
  }

  const tenant = await getTenantDetail(id);
  if (!tenant) {
    notFound();
  }

  const auditLogs = canViewTenantAuditLogs(user.role)
    ? await listTenantAuditLogs(id)
    : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/settings/tenants">
          <ArrowLeft className="mr-2 h-4 w-4" />
          テナント一覧
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{tenant.name}</CardTitle>
            <Badge variant="secondary">{getTenantPlanLabel(tenant.plan)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">slug</dt>
              <dd className="font-mono">{tenant.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">作成日</dt>
              <dd>{tenant.createdAt.toLocaleDateString("ja-JP")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="mb-2 text-muted-foreground">プラン</dt>
              <dd>
                <TenantPlanSelect tenantId={tenant.id} plan={tenant.plan} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canViewTenantAuditLogs(user.role) && (
        <TenantAuditLogTable logs={auditLogs} />
      )}
    </div>
  );
}
