import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            ログインに戻る
          </Link>
        </p>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
