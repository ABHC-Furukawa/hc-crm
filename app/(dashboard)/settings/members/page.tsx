import { canAssignDevelopRole, canManageUsers } from "@/lib/auth/rbac";
import { requireTenantContext } from "@/lib/tenant/context";
import { getManagersForTenant, getUsersForTenant } from "@/lib/users/queries";
import { InviteUserForm } from "@/components/users/invite-user-form";
import { UserTable } from "@/components/users/user-table";

export default async function SettingsMembersPage() {
  const { user, tenantId } = await requireTenantContext();

  if (!canManageUsers(user.role)) {
    return null;
  }

  const [users, managers] = await Promise.all([
    getUsersForTenant(tenantId),
    getManagersForTenant(tenantId),
  ]);

  const canAssignDevelop = canAssignDevelopRole(user.role);

  return (
    <div className="space-y-6">
      <InviteUserForm
        managers={managers}
        canAssignDevelop={canAssignDevelop}
      />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">登録メンバー</h2>
        <p className="text-sm text-muted-foreground">
          この組織（tenant）に所属するユーザーの一覧です
        </p>
        <UserTable
          users={users}
          managers={managers}
          canAssignDevelop={canAssignDevelop}
          canEditHierarchy
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
