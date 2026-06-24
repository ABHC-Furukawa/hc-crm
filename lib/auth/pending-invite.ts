import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export function hasPendingInviteFromAuth(
  authUser: SupabaseAuthUser
): boolean {
  return authUser.user_metadata?.pendingInvite === true;
}

export async function getPendingInviteByAuthId(
  authId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { authId },
    select: { pendingInvite: true },
  });
  return user?.pendingInvite ?? false;
}

export async function completePendingInvite(authId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { authId, pendingInvite: true },
    data: { pendingInvite: false },
  });
}
