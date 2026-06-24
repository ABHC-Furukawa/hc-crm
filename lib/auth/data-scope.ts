import { UserRole, type User } from "@prisma/client";
import {
  canManageTenantTeamGoals,
  canSelectScopeUser,
  canViewTeamMetrics,
} from "@/lib/auth/rbac";
import type { MetricScope } from "@/lib/kpi/metrics";
import {
  getActiveUsersForAssignment,
  type AssignableUser,
} from "@/lib/users/queries";
import { prisma } from "@/lib/prisma";

export type MetricsScopeMode = "personal" | "team";

export type ResolvedMetricsView = {
  scopeMode: MetricsScopeMode;
  scopeUserId: string | null;
  scopeLabel: string;
  metricScope: MetricScope;
  canSelectUser: boolean;
  canManageTeamGoals: boolean;
  visibleUsers: AssignableUser[];
};

export async function getReportUserIds(
  managerId: string,
  tenantId: string
): Promise<string[]> {
  const reports = await prisma.user.findMany({
    where: { managerId, tenantId, isActive: true },
    select: { id: true },
  });
  return reports.map((report) => report.id);
}

export async function getVisibleUserIds(
  viewer: User,
  tenantId: string
): Promise<string[]> {
  switch (viewer.role) {
    case UserRole.DEVELOP:
    case UserRole.ADMIN: {
      const users = await prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: { id: true },
      });
      return users.map((user) => user.id);
    }
    case UserRole.MANAGER: {
      const reportIds = await getReportUserIds(viewer.id, tenantId);
      return [viewer.id, ...reportIds];
    }
    default:
      return [viewer.id];
  }
}

export function canViewUserMetrics(
  viewer: User,
  targetUserId: string,
  visibleUserIds: string[]
): boolean {
  return visibleUserIds.includes(targetUserId);
}

export async function resolveMetricsView(
  viewer: User,
  tenantId: string,
  options?: {
    scope?: MetricsScopeMode;
    userId?: string;
  }
): Promise<ResolvedMetricsView> {
  const visibleUserIds = await getVisibleUserIds(viewer, tenantId);
  const allAssignable = await getActiveUsersForAssignment(tenantId);
  const visibleUsers = allAssignable.filter((user) =>
    visibleUserIds.includes(user.id)
  );

  const canSelect = canSelectScopeUser(viewer.role);
  let scopeMode: MetricsScopeMode =
    viewer.role === UserRole.ADVISOR ? "personal" : (options?.scope ?? "personal");

  if (scopeMode === "team" && !canViewTeamMetrics(viewer.role)) {
    scopeMode = "personal";
  }

  let scopeUserId: string | null;

  if (scopeMode === "team") {
    scopeUserId = null;
  } else if (
    options?.userId &&
    canViewUserMetrics(viewer, options.userId, visibleUserIds)
  ) {
    scopeUserId = options.userId;
  } else {
    scopeUserId = viewer.id;
  }

  let metricScope: MetricScope;
  if (scopeUserId) {
    metricScope = { tenantId, userId: scopeUserId };
  } else if (viewer.role === UserRole.MANAGER) {
    metricScope = { tenantId, userId: null, userIds: visibleUserIds };
  } else {
    metricScope = { tenantId, userId: null };
  }

  let scopeLabel = "個人";
  if (scopeUserId === null) {
    scopeLabel =
      viewer.role === UserRole.MANAGER ? "チーム（管下）" : "チーム";
  } else if (scopeUserId !== viewer.id) {
    const selected = visibleUsers.find((user) => user.id === scopeUserId);
    scopeLabel = selected?.name ?? "個人";
  }

  return {
    scopeMode: scopeUserId === null ? "team" : "personal",
    scopeUserId,
    scopeLabel,
    metricScope,
    canSelectUser: canSelect,
    canManageTeamGoals: canManageTenantTeamGoals(viewer.role),
    visibleUsers,
  };
}
