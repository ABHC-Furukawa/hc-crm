import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </AuthShell>
  );
}
