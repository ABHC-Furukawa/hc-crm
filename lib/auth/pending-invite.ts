import { prisma } from "@/lib/prisma";

export { hasPendingInviteFromAuth } from "@/lib/auth/pending-invite-auth";

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
