# Phase 0 — 基盤整備 ✅ 完了

**目的:** 大規模改修前の土台を固める（ドキュメント同期、RBAC、クエリ集約、Activity 強化）

**状態:** 完了（2026-06-22）

---

## 実施内容

### 1. ドキュメント同期
- [x] `docs/database-design.md` — CandidateStatus 13段階、`CandidateJobCase`、RBAC、Supabase 接続プール
- [x] `docs/er-diagram.md` — `CandidateJobCase` リレーション追加

### 2. RBAC（単組織版）
- [x] `lib/auth/rbac.ts` — `canViewAllCandidates`, `USER_ROLE_LABELS`
- [x] `lib/auth/access.ts` — `candidateAccessFilter`, `assertCandidateAccess`, `AccessDeniedError`
- [x] 全 candidate 系 Server Action で共通利用
- [x] ヘッダーにロール表示（`components/layout/user-nav.tsx`）

| ロール | 候補者アクセス |
|--------|--------------|
| ADMIN / MANAGER | 全候補者 |
| ADVISOR | 担当割当のみ（`CandidateAssignment.unassignedAt IS NULL`） |

### 3. クエリ定義の集約
- [x] `lib/candidates/queries.ts` — `candidateDetailInclude`, `candidateListInclude`, `activityInclude`
- [x] `types/candidate.ts` — re-export のみ（後方互換）
- [x] `getCandidateById` / `getCandidatesForUser` の include 重複解消

### 4. Activity 専用 read + UI
- [x] `lib/actions/activities.ts` — ページネーション（20件/ページ）
- [x] `lib/validators/activity.ts` — クエリ検証
- [x] `lib/activities/format-metadata.ts` — metadata 表示
- [x] Activity タブ — フィルタ + 前後ページネーション
- [x] Activity を `candidateDetailInclude` から分離（タブ表示時のみ別クエリ）

---

## 追加・変更ファイル

```
lib/auth/rbac.ts          (新規)
lib/auth/access.ts        (新規)
lib/candidates/queries.ts (新規)
lib/actions/activities.ts (新規)
lib/validators/activity.ts (新規)
lib/activities/format-metadata.ts (新規)
lib/actions/candidates.ts (RBAC + queries 利用)
lib/actions/tasks.ts      (assertCandidateAccess 共通化)
lib/actions/notes.ts
lib/actions/communications.ts
lib/actions/job-case.ts
components/candidates/detail/activity-timeline-panel.tsx (刷新)
components/layout/user-nav.tsx (ロール表示)
app/(dashboard)/candidates/[id]/page.tsx (Activity 別取得)
types/candidate.ts        (re-export)
docs/database-design.md
docs/er-diagram.md
```

---

## 次 Phase へ

→ [phase-1.md](./phase-1.md)
