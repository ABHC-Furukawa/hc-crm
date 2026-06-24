import type { UserRole } from "@prisma/client";
import { USER_ROLE_LABELS } from "@/lib/auth/rbac";
import { formatUserSurname } from "@/lib/users/display";
import type { AssignableUser } from "@/lib/users/queries";
import { formatDateTime } from "@/lib/utils";
import { UserHierarchyEditor } from "@/components/users/user-hierarchy-editor";
import { UserStatusActions } from "@/components/users/user-status-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  email: string;
  name: string;
  lastName: string;
  firstName: string | null;
  role: UserRole;
  managerId: string | null;
  isActive: boolean;
  pendingInvite: boolean;
  createdAt: Date;
  manager: {
    id: string;
    name: string;
    lastName: string;
    firstName: string | null;
  } | null;
};

type UserTableProps = {
  users: UserRow[];
  managers: AssignableUser[];
  canAssignDevelop: boolean;
  canEditHierarchy: boolean;
  currentUserId: string;
};

export function UserTable({
  users,
  managers,
  canAssignDevelop,
  canEditHierarchy,
  currentUserId,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        登録ユーザーがいません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>表示名（苗字）</TableHead>
            <TableHead>氏名</TableHead>
            <TableHead>メール</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>所属マネージャー</TableHead>
            <TableHead>状態</TableHead>
            <TableHead>作成日</TableHead>
            {canEditHierarchy && <TableHead>ロール編集</TableHead>}
            {canEditHierarchy && <TableHead>操作</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{formatUserSurname(user)}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{USER_ROLE_LABELS[user.role]}</TableCell>
              <TableCell>{user.manager?.name ?? "—"}</TableCell>
              <TableCell>
                {user.pendingInvite ? (
                  <Badge variant="outline">招待中</Badge>
                ) : (
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "有効" : "無効"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(user.createdAt)}
              </TableCell>
              {canEditHierarchy && (
                <TableCell>
                  <UserHierarchyEditor
                    userId={user.id}
                    currentRole={user.role}
                    currentManagerId={user.managerId}
                    managers={managers}
                    canAssignDevelop={canAssignDevelop}
                  />
                </TableCell>
              )}
              {canEditHierarchy && (
                <TableCell>
                  <UserStatusActions
                    userId={user.id}
                    email={user.email}
                    isActive={user.isActive}
                    pendingInvite={user.pendingInvite}
                    isSelf={user.id === currentUserId}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
