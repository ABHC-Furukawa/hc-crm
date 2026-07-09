import { UserRole } from "@prisma/client";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";

/**
 * アプリ共通のルート定義。
 * サイドバー表示・権限チェックの単一ソースとして利用する。
 * 新規ページ追加時はここに定義を足し、roles で閲覧可能ロールを指定する。
 */
export type AppRouteId =
  | "dashboard"
  | "candidates"
  | "resumes"
  | "call-leads"
  | "jobs"
  | "communications"
  | "kpi"
  | "analytics"
  | "team-status"
  | "candidates-new"
  | "feedback"
  | "settings";

export type AppRouteDefinition = {
  id: AppRouteId;
  href: string;
  label: string;
  /** 未指定 = 全ロールがアクセス可能 */
  roles?: UserRole[];
  matchPrefix?: string;
  exclude?: string;
};

export const APP_ROUTE_DEFINITIONS: AppRouteDefinition[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "TOP",
  },
  {
    id: "candidates",
    href: "/candidates",
    label: CANDIDATE_DISPLAY.listTitle,
    matchPrefix: "/candidates",
    exclude: "/candidates/new",
  },
  {
    id: "resumes",
    href: "/resumes",
    label: "履歴書作成",
    matchPrefix: "/resumes",
  },
  {
    id: "call-leads",
    href: "/call-leads",
    label: "架電リスト",
    matchPrefix: "/call-leads",
  },
  {
    id: "jobs",
    href: "/jobs",
    label: "案件管理",
    matchPrefix: "/jobs",
  },
  {
    id: "communications",
    href: "/communications",
    label: "連絡履歴",
    matchPrefix: "/communications",
  },
  {
    id: "kpi",
    href: "/kpi",
    label: "KPI",
    matchPrefix: "/kpi",
  },
  {
    id: "analytics",
    href: "/analytics",
    label: "ファネル分析",
    matchPrefix: "/analytics",
  },
  {
    id: "team-status",
    href: "/team-status",
    label: "CA 稼働状況",
    roles: [UserRole.MANAGER, UserRole.ADMIN, UserRole.DEVELOP],
    matchPrefix: "/team-status",
  },
  {
    id: "candidates-new",
    href: "/candidates/new",
    label: "新規登録",
    matchPrefix: "/candidates/new",
  },
  {
    id: "feedback",
    href: "/feedback",
    label: "改善提案",
    matchPrefix: "/feedback",
  },
  {
    id: "settings",
    href: "/settings/tenant",
    label: "設定",
    roles: [UserRole.ADMIN, UserRole.DEVELOP],
    matchPrefix: "/settings",
  },
];

export function getRoutesForRole(role: UserRole): AppRouteDefinition[] {
  return APP_ROUTE_DEFINITIONS.filter(
    (route) => !route.roles || route.roles.includes(role)
  );
}

export function findRouteForPath(pathname: string): AppRouteDefinition | null {
  let best: AppRouteDefinition | null = null;
  let bestScore = -1;

  for (const route of APP_ROUTE_DEFINITIONS) {
    if (route.exclude && pathname === route.exclude) continue;

    if (pathname === route.href) {
      return route;
    }

    if (route.matchPrefix && pathname.startsWith(route.matchPrefix)) {
      const score = route.matchPrefix.length;
      if (score > bestScore) {
        best = route;
        bestScore = score;
      }
    }
  }

  return best;
}

export function canAccessPath(pathname: string, role: UserRole): boolean {
  const route = findRouteForPath(pathname);
  if (!route) return true;
  return !route.roles || route.roles.includes(role);
}
