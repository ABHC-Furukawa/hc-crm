import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <AuthShell>
      <AcceptInviteForm />
    </AuthShell>
  );
}
