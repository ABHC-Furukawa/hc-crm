# Phase 5a — Vercel テスト公開 & 本番運用整備

**更新日:** 2026-06-25  
**プロジェクト:** CA CRM — `C:\Users\user\Desktop\ca-crm`  
**現在地:** Phase 4 完了 + Vercel 本番公開済み + **5a 機能追加（未コミット多数）** → **コミット / Redeploy / Phase 5 へ**

---

## 完了済み（2026-06-25 セッション）

### インフラ・招待 URL

| 項目 | 状態 |
|------|------|
| Vercel 本番 URL | **https://hc-crm.vercel.app**（Production Ready） |
| `NEXT_PUBLIC_SITE_URL` | Vercel に `https://hc-crm.vercel.app` 設定済み（Prod / Preview / Dev） |
| 本番 Redeploy | 実施済み（`NEXT_PUBLIC_*` 反映） |
| `lib/utils/site-url.ts` | Vercel 上で localhost env を無視するガード追加 |
| Supabase Auth URL | **要確認**（Dashboard 手動設定 — 下記チェックリスト） |

### パフォーマンス（コード）

| 項目 | ファイル |
|------|----------|
| React `cache()` | `lib/auth/session.ts`, `lib/tenant/context.ts` |
| Prisma 本番シングルトン | `lib/prisma.ts`（`globalThis`） |

**未実施（インフラ）:** Vercel Region → Tokyo (`hnd1`)、`DATABASE_URL` に `&connection_limit=1`

### DEVELOP — アカウント直接作成

| 項目 | 内容 |
|------|------|
| UI | 設定 → メンバー → **直接作成（DEVELOP）** タブ |
| 権限 | `createUserAction` は DEVELOP のみ（サーバー側ガード） |
| 上限 | DEVELOP 操作時は **users プラン上限をスキップ**（`lib/tenant/enforce-limits.ts`） |
| 関連 | `components/users/member-onboarding-section.tsx`, `CreateUserForm` |

### KPI — 通過月ベース集計

**変更:** 進行中パイプライン（件数）・金額面を **月末スナップショット → 選択月内のステータス遷移** に変更。

| 指標 | 集計 |
|------|------|
| エントリー / 面談設定 / 入社（件数・金額） | 各フェーズを **通過した月** に計上 |
| 例 | 1月エントリー+面談設定、2月入社 → 1月: 50/50/0、2月: 0/0/50（万円） |

| ファイル | 役割 |
|----------|------|
| `lib/kpi/metrics.ts` | `usesTransitionPeriodAggregation()` で月次は遷移集計 |
| `lib/kpi/constants.ts` | `KPI_PIPELINE_PERIOD_AGGREGATION_HINT`、ラベル更新 |
| `app/(dashboard)/kpi/page.tsx` | 説明文更新 |

日次行動量テーブルは従来どおり日別遷移件数。

### CA 稼働状況（Presence）

| 項目 | 内容 |
|------|------|
| URL | **`/team-status`**（サイドバー「CA 稼働状況」） |
| 閲覧 | MANAGER / ADMIN / DEVELOP |
| 対象 | CA（ADVISOR）のみ |
| オンライン | 最終操作から **10 分以内** |
| 更新 | 60 秒ごと自動 refresh |
| DB | `users.last_seen_at`（マイグレーション `20260625160000_user_last_seen_at`） |

| ファイル | 役割 |
|----------|------|
| `lib/auth/presence.ts` | 記録・一覧取得 |
| `lib/auth/presence-constants.ts` | 閾値定数（Client 安全） |
| `lib/auth/session.ts` | リクエストごと lastSeen 更新（2 分 throttle） |
| `lib/actions/auth.ts` | ログイン時即時更新 |

### バグ修正

| 問題 | 修正 |
|------|------|
| `/settings/tenants` クライアントクラッシュ | `TenantPlanSelect` が `@prisma/client` を Client に bundling → **`lib/tenant/plan-options.ts`** に分離 |

---

## DB マイグレーション（ローカル追加・要 deploy）

| マイグレーション | 内容 |
|------------------|------|
| `20260625143000_candidate_extended_fields` | 求職者拡張フィールド（前提済み） |
| `20260625160000_user_last_seen_at` | `users.last_seen_at`（CA 稼働状況） |

```powershell
npx prisma migrate deploy
npx prisma generate
```

---

## 未コミット・未 push 注意

**2026-06-25 時点:** 上記機能は **ローカル working tree に存在**。GitHub / Vercel 本番に反映するには:

1. `git add` + `git commit`（明示指示後）
2. `git push origin master`
3. `npx vercel --prod --yes`（または push 連動デプロイ）
4. 本番 DB で `npx prisma migrate deploy`

---

## 未完了・次の優先タスク

### 🟡 Supabase Auth URL（要確認）

Dashboard → Authentication → URL Configuration:

- Site URL: `https://hc-crm.vercel.app`
- Redirect URLs:
  ```
  https://hc-crm.vercel.app/**
  https://*.vercel.app/**
  http://localhost:3003/**
  ```

### 🟡 パフォーマンス（インフラ）

- Vercel Functions Region → **Tokyo (hnd1)**
- `DATABASE_URL` 末尾 `&connection_limit=1`
- 架電リスト **ページネーション**（数万件対応 — 設計済み、未実装）

### 🟢 Phase 5 本体

[phase-5.md](./phase-5.md) — PBX Webhook 統合

---

## インフラクイックリファレンス

| 項目 | 値 |
|------|-----|
| ローカル dev | http://localhost:3003 |
| Vercel 本番 | https://hc-crm.vercel.app |
| GitHub | ABHC-Furukawa/hc-crm |
| Supabase | `xtnlqkopygdchirfyxge`（Tokyo） |
| Default tenant ID | `a0000000-0000-4000-a000-000000000001` |
| Vercel プロジェクト | `hc-crm/hc-crm` |

### Vercel 環境変数

| 変数 | 備考 |
|------|------|
| `DATABASE_URL` | pooler `:6543` + `?pgbouncer=true`（`&connection_limit=1` 推奨） |
| `DIRECT_URL` | pooler `:5432` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 招待・直接作成に **必須** |
| `CRON_SECRET` | cron API 用 |
| `NEXT_PUBLIC_SITE_URL` | **`https://hc-crm.vercel.app`**（設定済み） |

### 招待・認証 URL

```
{SITE_URL}/auth/callback?next=/accept-invite
{SITE_URL}/auth/callback?next=/reset-password
```

---

## 新規ルート・主要ファイル

```
app/(dashboard)/
  team-status/page.tsx          # CA 稼働状況（MANAGER+）
components/
  team-status/ca-presence-panel.tsx
  users/member-onboarding-section.tsx
lib/
  auth/presence.ts
  auth/presence-constants.ts
  tenant/plan-options.ts        # Client 安全（Prisma 非依存）
  utils/site-url.ts
```

---

## 検証コマンド

```powershell
npm run verify:tenant-isolation
npm run verify:tenant-limits
npm run verify:user-invite
npm run build   # dev 停止後
```

**手動確認:**

- DEVELOP → 設定 → メンバー → 直接作成タブ
- MANAGER+ → `/team-status`
- DEVELOP → `/settings/tenants`（テナント一覧が表示されること）
- KPI → 進行中パイプライン / 金額面が「通過月」説明になっていること

---

## 重要ルール

- 既存 CRM を壊さない
- `npm run build` と `npm run dev` を同時実行しない
- **git commit は明示指示があるまで行わない**
- データスコープは **Tenant（`tenantId`）**
- **Client Component から `@prisma/client` を transitively import しない**（`plan-options.ts` パターンを参照）

---

## 参照

- [phase-5.md](./phase-5.md) — PBX Webhook
- [phase-4d-handoff.md](./phase-4d-handoff.md) — Phase 4 完了記録
- [next-chat-handoff.md](./next-chat-handoff.md) — 貼り付け用指示文
