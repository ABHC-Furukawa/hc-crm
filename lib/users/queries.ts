import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const assignableUserSelect = {
  id: true,
  name: true,
  lastName: true,
  firstName: true,
} as const;

export type AssignableUser = {
  id: string;
  name: string;
  lastName: string;
  firstName: string | null;
};

/** CRM にログイン可能なアクティブユーザー（同一テナント） */
export async function getActiveUsersForAssignment(
  tenantId: string
): Promise<AssignableUser[]> {
  return prisma.user.findMany({
    where: { isActive: true, tenantId },
    select: assignableUserSelect,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getUsersForTenant(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      lastName: true,
      firstName: true,
      role: true,
      managerId: true,
      isActive: true,
      pendingInvite: true,
      createdAt: true,
      manager: {
        select: { id: true, name: true, lastName: true, firstName: true },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getManagersForTenant(tenantId: string) {
  return prisma.user.findMany({
    where: {
      tenantId,
      isActive: true,
      role: { in: [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOP] },
    },
    select: assignableUserSelect,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}
