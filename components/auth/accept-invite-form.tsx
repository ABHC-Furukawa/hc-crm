"use client";

import { useActionState } from "react";
import {
  acceptInviteAction,
  type AuthActionState,
} from "@/lib/actions/auth";
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

const initialState: AuthActionState = {};

export function AcceptInviteForm() {
  const [state, formAction, pending] = useActionState(
    acceptInviteAction,
    initialState
  );

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">アカウント設定</CardTitle>
        <CardDescription>
          ログイン用のパスワードを設定してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {state.fieldErrors?.confirmPassword && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "設定中..." : "パスワードを設定して開始"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
