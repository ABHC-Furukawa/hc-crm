import { UserRole, type User } from "@prisma/client";
import {
  LAST_SEEN_TOUCH_INTERVAL_MS,
  resolveCaPresenceStatus,
  type CaPresenceStatus,
} from "@/lib/auth/presence-constants";
import { canViewCaPresence } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

export type { CaPresenceStatus } from "@/lib/auth/presence-constants";
export {
  CA_PRESENCE_ONLINE_WINDOW_MS,
  LAST_SEEN_TOUCH_INTERVAL_MS,
  resolveCaPresenceStatus,
} from "@/lib/auth/presence-constants";

export type CaPresenceRow = {
  id: string;
  name: string;
  email: string;
  managerName: string | null;
  lastSeenAt: string | null;
  status: CaPresenceStatus;
};

export async function touchLastSeenIfStale(
  userId: string,
  lastSeenAt: Date | null
): Promise<void> {
  const now = new Date();
  if (
    lastSeenAt &&
    now.getTime() - lastSeenAt.getTime() < LAST_SEEN_TOUCH_INTERVAL_MS
  ) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: now },
  });
}

export async function touchLastSeenNow(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });
}

export async function getCaPresenceForViewer(
  viewer: User,
  tenantId: string
): Promise<CaPresenceRow[]> {
  if (!canViewCaPresence(viewer.role)) {
    return [];
  }

  const where = {
    tenantId,
    isActive: true,
    pendingInvite: false,
    role: UserRole.ADVISOR,
    ...(viewer.role === UserRole.MANAGER ? { managerId: viewer.id } : {}),
  };

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      lastSeenAt: true,
      manager: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const now = new Date();
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    managerName: user.manager?.name ?? null,
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    status: resolveCaPresenceStatus(user.lastSeenAt, now),
  }));
}
