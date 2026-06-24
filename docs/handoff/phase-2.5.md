# Phase 2.5 — CallLead（架電管理）✅ 完了

**目的:** 応募者を Candidate 化する前段階として、架電対象（CallLead）を管理する

**前提:** [Phase 2](./phase-2.md) Communication Center 完了

**次 Phase:** [phase-3.md](./phase-3.md)（KPI / 月次目標）— 引き継ぎは [next-chat-handoff.md](./next-chat-handoff.md)

---

## 重要方針（実装済み）

| 項目 | 方針 |
|------|------|
| 既存 CRM | **追加のみ**。Candidate / Activity / Communications を壊さない |
| CallLead | Candidate **前段階**の別管理 |
| Tenant | Phase 2.5 で導入。新規モデルはすべて `tenantId` 必須 |
| Activity | 既存 `Activity` は**非変更** → **`CallLeadActivity`** を新設 |
| CallStatus | 既存 Communication 用と衝突回避 → **`CallAttemptStatus`** / **`CallAttemptResult`** |
| 発信 | **`CallService` + `CallDialProvider`**（TEL のみ実装、PBX 拡張前提） |
| 取込 | **`ImportService` + Adapter**（CSV は adapter 経由） |

---

## 業務フロー

```
応募データ → CallLead → 架電 → ヒアリング → Candidate化 → 面談 → 推薦 → 内定 → 入社
```

---

## 実装ステップ（全 Step 完了）

### Step 1 — DB 基盤 ✅

- [x] Prisma schema 追加（Tenant, CallLead, CallAttempt, CallLeadNote, ImportLog, CallLeadActivity）
- [x] `User.tenantId` 追加
- [x] `Candidate.convertedFromCallLeads` relation 追加
- [x] Migration `20260622180000_phase25_call_leads_step1`
- [x] `lib/tenant/constants.ts` — デフォルト Tenant ID
- [x] `lib/tenant/context.ts` — セッション → tenantId 解決
- [x] `lib/tenant/access.ts` — CallLead RBAC + tenant スコープ

### Step 2 — ドメインロジック ✅

- [x] `lib/call-leads/duplicate-detector.ts`
- [x] `lib/call-leads/eligibility.ts`
- [x] `lib/import/types.ts`
- [x] `lib/import/import-service.ts`
- [x] `lib/import/adapters/csv-adapter.ts`
- [x] `lib/import/adapters/manual-adapter.ts`
- [x] `lib/validators/call-lead-import.ts`

### Step 3 — CallLead CRUD ✅

- [x] `lib/actions/call-leads.ts` — 一覧・詳細・更新・FollowUp・Candidate 化
- [x] `lib/actions/call-lead-import.ts`
- [x] `lib/actions/call-lead-activities.ts`
- [x] `lib/call-leads/queries.ts`
- [x] `lib/constants/call-lead-labels.ts`

### Step 4 — 発信基盤（CallService）✅

- [x] `lib/calls/types.ts`
- [x] `lib/calls/providers/tel-provider.ts`
- [x] `lib/calls/call-service.ts`
- [x] `app/api/calls/initiate/route.ts`
- [x] `lib/call-leads/sync-call-count.ts`
- [x] `lib/actions/call-attempts.ts`

### Step 5 — UI（一覧・取込）✅

- [x] `/call-leads` 一覧（DUPLICATE / OUT_OF_SCOPE グレーアウト、フィルタ折りたたみ）
- [x] `/call-leads/import` CSV 取込
- [x] `/call-leads/new` 手動登録
- [x] `components/call-leads/*`
- [x] サイドバー「架電リスト」追加

### Step 6 — UI（詳細・変換）✅

- [x] `/call-leads/[id]` — 基本情報 / 架電履歴 / 活動履歴 / Notes / FollowUp（5 タブ）
- [x] `lib/call-leads/convert-to-candidate.ts` — Candidate 化 + Note 引継ぎ
- [x] `lib/actions/call-lead-notes.ts`

### Step 7 — 仕上げ ✅

- [x] 既存 `/candidates`, `/communications`, `/dashboard` 回帰確認
- [x] `scripts/regression-step7.mjs` — DB スモーク
- [x] `npm run build` 成功

---

## Phase 2.5 追加実装（スコープ拡張・完了）

| 領域 | 内容 | 主要ファイル |
|------|------|-------------|
| 一覧 UX | ステータス編集、Note 列、担当者割当、フィルタ | `call-lead-table.tsx`, `call-lead-note-cell.tsx`, `call-lead-assignee-selector.tsx` |
| ユーザー管理 | ADMIN のみ `/users`、Supabase Admin API でアカウント作成 | `lib/actions/users.ts`, `app/(dashboard)/users/page.tsx` |
| User 氏名 | `lastName` / `firstName` 追加 | migration `20260623120000_user_last_first_name` |
| 認証 | パスワードリセット、コールバック | `/forgot-password`, `/reset-password`, `/auth/callback` |
| ナビ RBAC | ルート定義の単一ソース | `lib/auth/navigation.ts` |
| ログアウト修正 | グローバル signOut | `components/layout/user-nav.tsx`, `lib/actions/auth.ts` |

---

## アクセスモデル（重要）

| リソース | スコープ | 実装 |
|----------|----------|------|
| **CallLead** | **同一 tenant 内で組織共有** | `callLeadAccessFilter` → `{ tenantId }` のみ |
| **Candidate** | ユーザー個別（ADVISOR = 担当のみ） | `candidateAccessFilter` in `lib/auth/access.ts` |
| **Communication / Dashboard** | Candidate 経由で個別 | 既存 Phase 2 パターン維持 |

デフォルト Tenant: `Default`（ID: `a0000000-0000-4000-a000-000000000001`）  
`admin@example.com` と `admin@ab-hc.co.jp` は同一 tenant に所属。

---

## 画面・ルート一覧

| パス | 機能 |
|------|------|
| `/call-leads` | 一覧・フィルタ・発信・Note/担当編集 |
| `/call-leads/import` | CSV 取込（ImportService 経由） |
| `/call-leads/new` | 手動 1 件登録 |
| `/call-leads/[id]` | 詳細 5 タブ + Candidate 化 |
| `/users` | ユーザー管理（ADMIN のみ） |
| `/login` | ログイン |
| `/forgot-password` | パスワードリセット申請 |
| `/reset-password` | 新パスワード設定 |

---

## 新規 Prisma モデル

| モデル | 概要 |
|--------|------|
| `Tenant` | SaaS テナント（slug: `default`） |
| `CallLead` | 架電対象（status, callCount, nextCallDate 等） |
| `CallAttempt` | 架電試行（PBX 拡張フィールド含む） |
| `CallLeadNote` | 架電リード用メモ |
| `ImportLog` | 取込履歴 |
| `CallLeadActivity` | 活動履歴（既存 Activity とは分離） |

**CallLeadStatus:** `BLANK` | `HEARING` | `NO_ANSWER` | `DUPLICATE` | `OUT_OF_SCOPE` | `CONVERTED`

---

## Migration 一覧（Phase 2.5 関連）

```bash
npx prisma migrate deploy
npx prisma generate
```

| Migration | 内容 |
|-----------|------|
| `20260622180000_phase25_call_leads_step1` | CallLead 系モデル + User.tenantId |
| `20260623120000_user_last_first_name` | User.lastName / firstName |

---

## 開発・検証コマンド

```bash
# dev サーバー（port 3003）
npm run dev

# 回帰スモーク（DB）
node scripts/regression-step7.mjs

# ダミーデータ（任意）
node scripts/seed-call-leads-batch30.mjs

# ビルド（dev 停止後に実行）
npm run build
```

---

## 環境変数（`.env.example` 参照）

| 変数 | 用途 |
|------|------|
| `DATABASE_URL` / `DIRECT_URL` | Prisma + Supabase PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | 認証 |
| `NEXT_PUBLIC_SITE_URL` | パスワードリセット redirectTo（`http://localhost:3003`） |
| `SUPABASE_SERVICE_ROLE_KEY` | `/users` でのアカウント作成（Server-only） |

Supabase Dashboard でリダイレクト URL に `http://localhost:3003/auth/callback` を登録すること。

---

## 規約・参照

- Tenant 解決: `lib/tenant/context.ts` — `requireTenantContext()`
- CallLead アクセス: `lib/tenant/access.ts` — `callLeadAccessFilter` / `assertCallLeadAccess`
- 候補者 RBAC: `lib/auth/access.ts` — `candidateAccessFilter`
- ルート RBAC: `lib/auth/navigation.ts` — `APP_ROUTE_DEFINITIONS`
- Candidate 化: `lib/call-leads/convert-to-candidate.ts`
- **`npm run build` と `npm run dev` を同時実行しない**
- commit は明示指示まで不要

---

## 完了基準（Phase 2.5 全体）— すべて達成

- [x] CSV 取込 → CallLead 生成（重複・対象外自動判定）
- [x] `/call-leads` 一覧（DUPLICATE / OUT_OF_SCOPE グレーアウト）
- [x] 詳細 5 タブ + 発信 + 架電結果記録
- [x] CallAttempt 数 → `callCount` 自動反映
- [x] Candidate 化 + Note 引継ぎ
- [x] 全データ `tenantId` スコープ
- [x] 既存 Candidate / Dashboard / Communications 動作維持
- [x] `npm run build` 成功

---

## 未実施・任意（次チャット以降）

- [ ] ブラウザ手動 QA（CSV 取込 → 架電 → Candidate 化の E2E）
- [ ] パスワードリセットメール送信の本番 SMTP 設定
- [ ] CallLead ダッシュボード KPI ウィジェット（Phase 3 で `CallAttempt` を集計源に利用可）
- [ ] PBX Provider 実装（Phase 5）

---

## 次 Phase へ

→ [phase-3.md](./phase-3.md)  
→ 新チャット用コピペ: [next-chat-handoff.md](./next-chat-handoff.md)
