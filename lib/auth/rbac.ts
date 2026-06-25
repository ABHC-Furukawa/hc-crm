import { UserRole } from "@prisma/client";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  DEVELOP: "開発者",
  ADMIN: "管理者",
  MANAGER: "マネージャー",
  ADVISOR: "CA",
};

/** 自 tenant 内の全データを閲覧可能 */
export function canViewTenantMetrics(role: UserRole): boolean {
  return role === UserRole.DEVELOP || role === UserRole.ADMIN;
}

/** 管下チームの数値を閲覧可能 */
export function canViewTeamMetrics(role: UserRole): boolean {
  return (
    role === UserRole.DEVELOP ||
    role === UserRole.ADMIN ||
    role === UserRole.MANAGER
  );
}

/** CA の稼働状況（最終操作）を閲覧可能 */
export function canViewCaPresence(role: UserRole): boolean {
  return canViewTeamMetrics(role);
}

/** KPI / Analytics で担当者切替可能 */
export function canSelectScopeUser(role: UserRole): boolean {
  return canViewTeamMetrics(role);
}

/** tenant 全体のチーム目標（userId null）を設定可能 */
export function canManageTenantTeamGoals(role: UserRole): boolean {
  return role === UserRole.DEVELOP || role === UserRole.ADMIN;
}

/** /analytics 経営ダッシュボード（売上サマリー）を閲覧可能 */
export function canViewExecutiveDashboard(role: UserRole): boolean {
  return canViewTeamMetrics(role);
}

/** 自 tenant 内の全候補者を閲覧可能 */
export function canViewTenantCandidates(role: UserRole): boolean {
  return role === UserRole.DEVELOP || role === UserRole.ADMIN;
}

/** 管下メンバー担当の候補者を閲覧可能 */
export function canViewTeamCandidates(role: UserRole): boolean {
  return role === UserRole.MANAGER;
}

export function canManageUsers(role: UserRole): boolean {
  return role === UserRole.DEVELOP || role === UserRole.ADMIN;
}

/** 自 tenant の組織設定（名称など）を編集可能 */
export function canManageTenantSettings(role: UserRole): boolean {
  return role === UserRole.DEVELOP || role === UserRole.ADMIN;
}

/** DEVELOP のみ — テナント作成・一覧 */
export function canManageAllTenants(role: UserRole): boolean {
  return role === UserRole.DEVELOP;
}

/** DEVELOP のみ — テナント監査ログ閲覧 */
export function canViewTenantAuditLogs(role: UserRole): boolean {
  return role === UserRole.DEVELOP;
}

/** @deprecated canViewTenantCandidates / canViewTeamCandidates を使用 */
export function canViewAllCandidates(role: UserRole): boolean {
  return canViewTenantCandidates(role);
}

export function hasRole(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}

export function assertRole(role: UserRole, allowed: UserRole[]): void {
  if (!hasRole(role, allowed)) {
    throw new Error("この操作を行う権限がありません");
  }
}

/** ユーザー作成時に DEVELOP を選べるロール */
export function canAssignDevelopRole(role: UserRole): boolean {
  return role === UserRole.DEVELOP;
}

/** DEVELOP のみ — 全 tenant を参照・切替可能（Phase 4 連携） */
export function canCrossTenantAccess(role: UserRole): boolean {
  return role === UserRole.DEVELOP;
}
