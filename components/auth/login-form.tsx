"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";
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

export function LoginForm() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const authError = searchParams.get("error") === "auth_callback";

  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">CA CRM</CardTitle>
        <CardDescription>人材紹介CRMにログイン</CardDescription>
      </CardHeader>
      <CardContent>
        {resetSuccess && (
          <p className="mb-4 text-sm text-emerald-600">
            パスワードを更新しました。新しいパスワードでログインしてください。
          </p>
        )}
        {authError && (
          <p className="mb-4 text-sm text-destructive">
            認証リンクが無効です。再度お試しください。
          </p>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              パスワードを忘れた方
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
