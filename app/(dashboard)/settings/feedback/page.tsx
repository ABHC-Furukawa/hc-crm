import { redirect } from "next/navigation";
import { canViewImprovementRequests } from "@/lib/auth/rbac";
import { listImprovementRequestsForDeveloper } from "@/lib/improvement-requests/queries";
import { requireTenantContext } from "@/lib/tenant/context";
import { ImprovementRequestList } from "@/components/settings/improvement-request-list";

export default async function SettingsFeedbackPage() {
  const { user } = await requireTenantContext();

  if (!canViewImprovementRequests(user.role)) {
    redirect("/dashboard");
  }

  const requests = await listImprovementRequestsForDeveloper();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        全テナントから投稿された改善・要望提案です。開発者のみ閲覧できます。
      </p>
      <ImprovementRequestList requests={requests} />
    </div>
  );
}
