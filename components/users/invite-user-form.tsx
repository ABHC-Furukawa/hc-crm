"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import {
  inviteUserAction,
  type InviteUserActionState,
} from "@/lib/actions/users";
import { USER_ROLE_LABELS } from "@/lib/auth/rbac";
import type { AssignableUser } from "@/lib/users/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: InviteUserActionState = {};

type InviteUserFormProps = {
  managers: AssignableUser[];
  canAssignDevelop: boolean;
};

export function InviteUserForm({
  managers,
  canAssignDevelop,
}: InviteUserFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(inviteUserAction, initialState);
  const [role, setRole] = useState<UserRole>(UserRole.ADVISOR);

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
    <Card>
      <CardHeader>
        <CardTitle>メンバー招待</CardTitle>
        <CardDescription>
          招待メールを送信します。受信者がリンクからパスワードを設定すると利用開始できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-600 sm:col-span-2">
              招待メールを送信しました
            </p>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              required
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">姓 *</Label>
            <Input id="lastName" name="lastName" required autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">名</Label>
            <Input id="firstName" name="firstName" autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">ロール *</Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
            >
              <SelectTrigger id="role">
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
            <input type="hidden" name="role" value={role} />
          </div>

          {role === UserRole.ADVISOR && (
            <div className="space-y-2">
              <Label htmlFor="managerId">所属マネージャー *</Label>
              <Select name="managerId" required>
                <SelectTrigger id="managerId">
                  <SelectValue placeholder="マネージャーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "送信中…" : "招待メールを送信"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
