"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import { completePendingInvite } from "@/lib/auth/pending-invite";
import { getSiteUrl } from "@/lib/utils/site-url";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    throw new Error("ログアウトに失敗しました");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const redirectTo = `${getSiteUrl()}/auth/callback?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    return { error: "パスワードリセットメールの送信に失敗しました" };
  }

  return {
    success: true,
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "セッションが無効です。メールのリンクから再度お試しください。",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "パスワードの更新に失敗しました" };
  }

  await supabase.auth.signOut();
  revalidatePath("/login");
  redirect("/login?reset=success");
}

export async function acceptInviteAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.errors[0]?.message ?? "入力内容を確認してください",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "セッションが無効です。招待メールのリンクから再度お試しください。",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { pendingInvite: false },
  });

  if (error) {
    return { error: "パスワードの設定に失敗しました" };
  }

  await completePendingInvite(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
