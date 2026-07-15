# HC OS — Row Level Security (RLS) 設計書

> **最終更新:** 2026-07-15（Phase 3 完了）  
> **対象:** Supabase PostgreSQL `public` スキーマ + Storage

## アーキテクチャ概要

```
ブラウザ ── Supabase Auth (JWT) ──► ログインのみ
                │
Next.js Server ── Prisma (postgres ロール) ──► PostgreSQL（RLS バイパス）
                │
                └── service_role ──► Storage アップロード / 管理 API
```

| 経路 | ロール | RLS |
|------|--------|-----|
| Prisma（`DATABASE_URL`） | `postgres` | バイパス（テーブルオーナー） |
| PostgREST / Supabase Client（DB） | `authenticated` / `anon` | **適用** |
| Storage API（サーバー） | `service_role` | バイパス |
| Storage API（クライアント直接） | `authenticated` | **ポリシー適用** |

**重要:** CRM の通常操作はすべて Prisma 経由。RLS は PostgREST や anon キーによる**直接 DB/Storage アクセス**を防ぐ第2防御線。

## 認証マッピング

| 項目 | 値 |
|------|-----|
| Supabase Auth UID | `auth.uid()::text` |
| アプリユーザー | `users.auth_id` |
| テナント | `users.tenant_id` |
| ロール | `DEVELOP` / `ADMIN` / `MANAGER` / `ADVISOR` |

### 既知の制約

- **DEVELOP の Cookie テナント切替**（`ca-crm-develop-tenant-id`）は RLS では再現不可。DB 層では DEVELOP は全テナントアクセス可。
- **FORCE ROW LEVEL SECURITY** は未適用。Prisma（`postgres` ロール）への影響を避けるため意図的に延期。

## マイグレーション履歴

| Phase | マイグレーション | 内容 |
|-------|-----------------|------|
| 1 | `20260715100000_enable_rls_phase1` | コア 8 テーブル + ヘルパー 9 関数 |
| 2 | `20260715110000_enable_rls_phase2` | 残り 31 テーブル + ヘルパー 9 関数 |
| 3 | `20260715120000_enable_rls_phase3` | Storage ポリシー + スキーマ権限 + 監査ビュー |

## ヘルパー関数一覧

### ユーザー / テナント

| 関数 | 用途 |
|------|------|
| `app_user_id()` | 現在ユーザーの `users.id` |
| `app_user_tenant_id()` | 現在ユーザーの `tenant_id` |
| `app_user_role()` | ロール文字列 |
| `app_user_is_active()` | アクティブユーザーか |
| `app_is_develop()` | DEVELOP か |
| `app_is_admin_or_develop()` | ADMIN または DEVELOP |
| `app_tenant_match(tenant_id)` | テナント一致（DEVELOP は全可） |

### アクセス制御

| 関数 | 用途 |
|------|------|
| `app_can_access_candidate(id)` | `lib/auth/access.ts` の `candidateAccessFilter` 相当 |
| `app_can_access_resume(id)` | `lib/resumes/queries.ts` の `resumeAccessWhere` 相当 |
| `app_can_read_user(id)` | ユーザー参照権 |
| `app_can_access_call_lead(id)` | 架電リスト（テナント内全ロール） |
| `app_can_access_communication(id)` | 候補者経由 |
| `app_can_access_interview_prep(id)` | 候補者経由 |
| `app_can_view_user_metrics(id)` | KPI 個人スコープ |
| `app_can_view_team_metrics(tenant_id)` | KPI チームスコープ |
| `app_can_read_kpi_goal_row(tenant_id, user_id)` | KPI 目標行 |
| `app_can_read_improvement_request(id)` | 投稿者 or DEVELOP |
| `app_can_access_import_tenant(tenant_id)` | インポートログ（ADMIN/DEVELOP） |
| `app_can_read_resume_photo_storage(bucket, path)` | Storage パス検証 |

## ロール × スコープ早見表

| リソース | ADVISOR | MANAGER | ADMIN | DEVELOP |
|---------|---------|---------|-------|---------|
| 候補者 | 担当のみ | 担当 + 部下担当 | テナント全体 | 全テナント |
| 架電リスト | テナント全体 | テナント全体 | テナント全体 | 全テナント |
| 案件 | テナント全体 | テナント全体 | テナント全体 | 全テナント |
| 履歴書 | 担当候補者 + 自分作成 | + 部下スコープ | テナント全体 | 全テナント |
| KPI 目標 | 自分のみ | 自分 + 部下 + チーム | テナント全体 | 全テナント |
| 改善提案 | 自分の投稿 | 自分の投稿 | 自分の投稿 | 全件 |
| 監査ログ | 不可 | 不可 | 不可 | 可 |
| インポートログ | 不可 | 不可 | 可 | 可 |

## Storage ポリシー

### `resume-photos` バケット

| 項目 | 値 |
|------|-----|
| Public | `false` |
| 最大サイズ | 2 MB |
| MIME | `image/jpeg`, `image/png`, `image/webp` |
| パス | `{tenantId}/{candidateId\|standalone}/{resumeId}/photo.{ext}` |

| 操作 | `authenticated` | `service_role` |
|------|-----------------|----------------|
| SELECT | テナント + 履歴書アクセス権あり | バイパス |
| INSERT/UPDATE/DELETE | 拒否（ポリシーなし） | サーバー経由 |

アップロードは `lib/resumes/storage.ts` → `createAdminClient()`（service_role）で実行。

### 将来: `resume-exports`

Phase 5 以降で PDF キャッシュバケットを追加する際は、同様に Storage ポリシーを設計すること。

## スキーマ権限（Phase 3）

| ロール | `public` スキーマ |
|--------|------------------|
| `anon` | **USAGE 含めすべて REVOKE** |
| `authenticated` | USAGE + CRUD + 関数 EXECUTE（RLS で実制御） |
| `postgres` / `service_role` | 変更なし（バイパス） |

## 新テーブル追加時チェックリスト

1. Prisma マイグレーションでテーブル作成
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. `authenticated` 向け SELECT/INSERT/UPDATE/DELETE ポリシー追加
4. 既存ヘルパー関数で判定できるか確認（なければ追加）
5. `app_rls_status` ビューで `rls_enabled = true` を確認
6. Security Advisor で警告がないか確認

## 検証クエリ

```sql
-- RLS 未設定テーブルの検出
SELECT table_name, rls_enabled, rls_forced
FROM public.app_rls_status
WHERE rls_enabled = false;

-- ポリシー数
SELECT schemaname, tablename, count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Storage ポリシー
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
```

## 関連ファイル

| ファイル | 内容 |
|---------|------|
| `lib/auth/access.ts` | 候補者アクセス（アプリ層） |
| `lib/auth/data-scope.ts` | KPI スコープ（アプリ層） |
| `lib/auth/rbac.ts` | ロール定義 |
| `lib/resumes/storage.ts` | 履歴書写真 Storage |
| `prisma/migrations/20260715100000_enable_rls_phase1/` | Phase 1 SQL |
| `prisma/migrations/20260715110000_enable_rls_phase2/` | Phase 2 SQL |
| `prisma/migrations/20260715120000_enable_rls_phase3/` | Phase 3 SQL |
