"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  updateUserHierarchyAction,
  type UpdateUserHierarchyActionState,
} from "@/lib/actions/users";
import { USER_ROLE_LABELS } from "@/lib/auth/rbac";
import type { AssignableUser } from "@/lib/users/queries";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: UpdateUserHierarchyActionState = {};

type UserHierarchyEditorProps = {
  userId: string;
  currentRole: UserRole;
  currentManagerId: string | null;
  managers: AssignableUser[];
  canAssignDevelop: boolean;
};

export function UserHierarchyEditor({
  userId,
  currentRole,
  currentManagerId,
  managers,
  canAssignDevelop,
}: UserHierarchyEditorProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [state, formAction, pending] = useActionState(
    updateUserHierarchyAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const roleOptions = [
    UserRole.ADVISOR,
    UserRole.MANAGER,
    UserRole.ADMIN,
    ...(canAssignDevelop ? [UserRole.DEVELOP] : []),
  ];

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="role" value={role} />
      <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {USER_ROLE_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {role === UserRole.ADVISOR && (
        <Select name="managerId" defaultValue={currentManagerId ?? undefined}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="マネージャー" />
          </SelectTrigger>
          <SelectContent>
            {managers
              .filter((manager) => manager.id !== userId)
              .map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        保存
      </Button>
      {state.error && (
        <span className="text-xs text-destructive">{state.error}</span>
      )}
    </form>
  );
}
