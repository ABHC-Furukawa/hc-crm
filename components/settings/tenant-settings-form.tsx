"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  updateTenantAction,
  type TenantActionState,
} from "@/lib/actions/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: TenantActionState = {};

type TenantSettingsFormProps = {
  tenant: {
    name: string;
    slug: string;
  };
  readOnlySlug?: boolean;
};

export function TenantSettingsForm({
  tenant,
  readOnlySlug = true,
}: TenantSettingsFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateTenantAction,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>組織情報</CardTitle>
        <CardDescription>
          組織名を変更できます。slug は識別子のため変更できません。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid max-w-lg gap-4">
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-600">組織情報を更新しました</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">組織名 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={tenant.name}
              required
              maxLength={100}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">slug</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={tenant.slug}
              readOnly={readOnlySlug}
              disabled={readOnlySlug}
              className="font-mono text-sm"
            />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "保存中…" : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
