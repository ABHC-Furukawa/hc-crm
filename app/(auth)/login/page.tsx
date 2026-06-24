import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
