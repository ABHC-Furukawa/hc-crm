"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
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

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  return (
    <Card className="w-full border-0 shadow-lg sm:border sm:shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">パスワード再設定</CardTitle>
        <CardDescription>
          登録メールアドレスにリセット用リンクを送信します
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <div className="space-y-4 text-center text-sm">
            <p className="text-emerald-600">
              パスワードリセット用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">ログイン画面へ</Link>
            </Button>
          </div>
        ) : (
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
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
              )}
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "送信中..." : "リセットメールを送信"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
