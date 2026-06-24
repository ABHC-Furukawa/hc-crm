"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTenantWithAdminAction,
  type TenantActionState,
} from "@/lib/actions/tenant";
import { slugifyTenantName } from "@/lib/tenant/slug";
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

export function CreateTenantForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createTenantWithAdminAction,
    initialState
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (state.success) {
      router.push("/settings/tenants");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>新規テナント</CardTitle>
        <CardDescription>
          組織と初期管理者（ADMIN）を作成し、招待メールを送信します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          {state.error && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-600 sm:col-span-2">
              テナントを作成し、管理者へ招待メールを送信しました
            </p>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">組織名 *</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={100}
              onChange={(event) => {
                if (!slugTouched) {
                  setSlug(slugifyTenantName(event.target.value));
                }
              }}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="slug">slug *</Label>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className="font-mono text-sm"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            />
            <p className="text-xs text-muted-foreground">
              半角英小文字・数字・ハイフン（例: acme-corp）
            </p>
            {state.fieldErrors?.slug && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.slug[0]}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="adminEmail">管理者メール *</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              autoComplete="off"
              required
            />
            {state.fieldErrors?.adminEmail && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.adminEmail[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminLastName">管理者 姓 *</Label>
            <Input id="adminLastName" name="adminLastName" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminFirstName">管理者 名</Label>
            <Input id="adminFirstName" name="adminFirstName" />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "作成中…" : "テナントを作成して招待"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
