# CA CRM — 現状引き継ぎ書（2026-06-23）

> **⚠️ 2026-06-25 更新:** Phase 4 / 5a 以降の最新状態は **[phase-5a-production-handoff.md](./phase-5a-production-handoff.md)** と **[next-chat-handoff.md](./next-chat-handoff.md)** を参照。本書は Phase 3.5 時点の履歴として残しています。

**プロジェクト:** CA CRM  
**パス:** `C:\Users\user\Desktop\ca-crm`  
**dev:** http://localhost:3003（`npm run dev`）  
**本番:** https://hc-crm.vercel.app  
**スタック:** Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui, recharts

---

## 新チャットに貼り付ける指示文

```
# CA CRM — 続きの作業

@docs/handoff/current-state-handoff.md と @docs/handoff/next-chat-handoff.md を参照してください。

## プロジェクト
- パス: C:\Users\user\Desktop\ca-crm
- dev: http://localhost:3003（npm run dev）
- スタック: Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui

## 重要ルール
- 既存 CRM（Candidate / Activity / Communications / CallLead）を壊さない（追加・拡張優先）
- npm run build と npm run dev を同時実行しない
- git commit は明示指示があるまで行わない

## 現状サマリー
Phase 0〜3.5 / ロール階層 R1-R3 / KPI cron 基盤まで完了。
詳細・検証コマンド・未着手項目は current-state-handoff.md を参照。

## 次の候補
1. KPI 日次キャッシュのバックフィル + CRON_SECRET 設定（体感速度改善）
2. Phase 4 — SaaS 化（マルチテナント本格対応）
3. Phase 3.5 任意改善（handoff ドキュメント整備、verify 強化、週次目標）
```

---

## ロードマップ進捗

| Phase / 工程 | 状態 | 備考 |
|-------------|------|------|
| Phase 0 | ✅ | RBAC 基盤、Activity |
| Phase 1 | ✅ | Task / Notes / Communication |
| Phase 2 | ✅ | Communication Center |
| Phase 2.5 | ✅ | CallLead（架電管理） |
| Phase 3 | ✅ | KPI / 月次目標 / ダッシュボードウィジェット |
| Phase 3.5a/b/c | ✅ | ファネル分析 / 期間切替 / 経営ダッシュボード |
| ロール R1 | ✅ | DEVELOP + RBAC + data-scope |
| ロール R2 | ✅ | managerId 管下チーム |
| ロール R3 | ✅ | DEVELOP テナント横断参照 |
| KPI cron 基盤 | ✅ コード済 | バックフィル・CRON_SECRET は未設定 |
| Phase 4 | 未着手 | マルチテナント SaaS |
| Phase 5 | 未着手 | PBX Webhook |

---

## テストアカウント

| メール | ロール | 用途 |
|--------|--------|------|
| `admin@example.com` | ADVISOR | KPI テストデータ（求職者 3 件担当） |
| `admin@ab-hc.co.jp` | DEVELOP | 開発者・全 tenant 切替・ユーザー管理 |

DEVELOP 昇格: `node scripts/promote-user-develop.mjs <email>`

---

## 用語・表示

- UI 上の「候補者」→ **求職者**（`lib/constants/candidate-display.ts`）
- コード上のモデル名 `Candidate` / URL `/candidates` は変更しない
- 金額 KPI は **万円** 単位（`CandidateJobCase.referralFee`）
- 経営ダッシュボードの月末予測は **十万円単位** で丸め（`lib/analytics/executive-metrics.ts`）

---

## ロール階層（確定）

| ロール | 数値・CRM 閲覧 | 備考 |
|--------|---------------|------|
| **DEVELOP** | 全 tenant（cookie 切替） | テナント切替 UI、DEVELOP ロール付与は DEVELOP のみ |
| **ADMIN** | 自 tenant 全員 | ユーザー管理可 |
| **MANAGER** | 管下 + 自身 | `User.managerId` で ADVISOR を紐付け |
| **ADVISOR** | 自身のみ | チーム KPI 不可 |

主要ファイル:
- `lib/auth/rbac.ts` — 権限関数
- `lib/auth/data-scope.ts` — KPI/Analytics スコープ解決
- `lib/auth/access.ts` — 求職者アクセス（tenant スコープ対応）

---

## Phase 3 KPI

### 画面
- `/kpi` — 12 指標 + 日次行動量テーブル
- `/kpi/goals` — 個人 / チーム目標一括設定
- `/dashboard` — KPI ウィジェット（数値 3 + 金額 3）

### 集計の要点
- **スナップショット（6）:** エントリー / 面談設定 / 入社 + 金額 3 — 基準日時点の担当求職者ステータス
- **月次遷移（6）:** 架電・ヒアリング・提案・面談対策・内定・内定承諾
- **日次テーブル（3）:** エントリー / 面談設定 / 入社 — **当日の遷移件数**

### ラベルコンテキスト（`lib/kpi/constants.ts`）
- `snapshot` / `transition` / `amount` / `daily` — 同一 enum でも表示ラベルが異なる

### 検証期待値（admin@example.com / 当月）
- エントリー 3 / 面談設定 3 / 入社 1
- 金額 190 / 190 / 70（万円）

詳細: [phase-3-kpi-handoff.md](./phase-3-kpi-handoff.md)

---

## Phase 3.5 Analytics

### 画面
- `/analytics` — ファネル分析 + 経営ダッシュボード（MANAGER 以上）

### 実装済み
- 8 ステージ（応募→入社）CVR・ボトルネック
- 月次 / 週次 / 日次フィルタ
- 日次内訳テーブル
- ファネルチャート（recharts 横棒）
- 経営サマリーカード（売上・予測・目標）— MANAGER 管下スコープ対応

### 主要ファイル
| ファイル | 役割 |
|---------|------|
| `lib/analytics/funnel-metrics.ts` | ファネル集計 |
| `lib/analytics/executive-metrics.ts` | 経営指標・予測丸め |
| `lib/actions/analytics.ts` | Server Actions |
| `components/analytics/*` | UI |
| `lib/analytics/period-client.ts` | Client 用（Prisma 非 import） |

---

## ActivityMetricDaily（KPI 日次キャッシュ）

### 目的
`/kpi` 日次テーブルの表示高速化。過去日は `activity_metrics_daily` から読み、当日のみライブ集計。

### 実装済み（cron 未稼働）
| ファイル | 役割 |
|---------|------|
| `lib/kpi/sync-activity-metrics-daily.ts` | 同期ロジック |
| `lib/kpi/daily-cache.ts` | キャッシュ読み取り |
| `lib/kpi/metrics.ts` | `computeDailyMetrics` キャッシュ優先 |
| `app/api/cron/activity-metrics-daily/route.ts` | cron API |
| `.github/workflows/sync-kpi-daily.yml` | 毎日 JST 2:00 |
| `scripts/backfill-activity-metrics-daily.ts` | 初回バックフィル（dev サーバー不要） |

### 有効化手順（未実施）
1. `.env` に `CRON_SECRET` を追加（ローカル・Vercel・GitHub Secrets で同一値）
2. 初回バックフィル: `npm run kpi:backfill -- --days 31`
3. 本番: GitHub Secrets に `APP_URL` + `CRON_SECRET`

**注意:** PC 移行時に env 一式と一緒に設定する想定で、現時点では secret 未設定でもアプリは動作する（キャッシュ空 → ライブ集計フォールバック）。

---

## Phase R3 — DEVELOP テナント横断

### 実装済み
- `canCrossTenantAccess()` — DEVELOP のみ
- cookie `ca-crm-develop-tenant-id` で参照 tenant 切替
- `requireTenantContext()` → `tenantId` / `homeTenantId` / `isDevelopTenantOverride`
- ヘッダー tenant 切替 UI（tenant 2 件以上で有効）
- 所属外 tenant 参照時バナー
- 求職者一覧に tenant スコープ追加

### 主要ファイル
- `lib/tenant/develop-tenant.ts`
- `lib/tenant/context.ts`
- `lib/actions/tenant.ts`
- `components/layout/develop-tenant-switcher.tsx`
- `components/layout/develop-tenant-banner.tsx`

### 検証
```powershell
npm run verify:develop-tenant
node scripts/seed-demo-tenant.mjs   # 2 件目 tenant（切替 UI テスト用）
```

---

## ユーザー管理

### 実装済み
- 停止（`isActive=false` + Supabase ban）
- 再有効化（unban）
- 削除（Supabase Auth 削除 → Prisma 削除。履歴がある場合はブロック）
- DEVELOP ロール付与は DEVELOP のみ
- 最後の DEVELOP ユーザーは停止・削除不可

### 主要ファイル
- `lib/users/lifecycle.ts`
- `lib/actions/users.ts`
- `components/users/user-status-actions.tsx`
- `components/users/user-hierarchy-editor.tsx`

---

## ディレクトリ構成（追加分）

```
app/
  (dashboard)/analytics/           # Phase 3.5
  api/cron/activity-metrics-daily/ # KPI cron
components/
  analytics/                       # ファネル・経営ダッシュボード
  kpi/
  users/
lib/
  analytics/
  kpi/                             # metrics, constants, dates, daily-cache, sync
  auth/data-scope.ts
  tenant/develop-tenant.ts
  users/lifecycle.ts
  constants/candidate-display.ts
scripts/
  verify-kpi-snapshot.mjs
  verify-kpi-daily-cache.mjs
  verify-analytics-funnel.mjs
  verify-analytics-executive.mjs
  verify-develop-tenant.mjs
  verify-user-creation-readiness.mjs
  backfill-activity-metrics-daily.ts
  sync-activity-metrics-daily.mjs
  seed-demo-tenant.mjs
  promote-user-develop.mjs
.github/workflows/sync-kpi-daily.yml
```

---

## 検証コマンド一覧

```powershell
# 回帰スモーク
node scripts/regression-step7.mjs

# KPI
node scripts/verify-kpi-snapshot.mjs
node scripts/verify-kpi-daily-cache.mjs   # キャッシュ空だと WARN

# Analytics
node scripts/verify-analytics-funnel.mjs
node scripts/verify-analytics-executive.mjs

# ロール / テナント
npm run verify:develop-tenant

# ユーザー作成
node scripts/verify-user-creation-readiness.mjs

# ビルド（dev 停止後）
npm run build
```

---

## 開発上の注意

1. **`npm run build` と `npm run dev` を同時実行しない**
2. **git commit は明示指示があるまで行わない**
3. Client Component から `@prisma/client` を transitively import しない（`period-client.ts` パターン参照）
4. 架電リードは tenant 内共有（`lib/tenant/access.ts`）
5. ルート RBAC は `lib/auth/navigation.ts` の `APP_ROUTE_DEFINITIONS`
6. Prisma include は `lib/candidates/queries.ts` / `lib/call-leads/queries.ts` に集約

---

## 未着手・任意改善

### 優先度中
- [ ] KPI 日次キャッシュ: `CRON_SECRET` 設定 + `npm run kpi:backfill -- --days 31`
- [ ] Phase 4 — マルチテナント SaaS（[phase-4.md](./phase-4.md)）

### 優先度低（任意）
- [ ] Phase 3.5 専用 handoff の分割（本書に統合済み）
- [ ] verify スクリプト強化（週次・日次、MANAGER ユーザー前提）
- [ ] `/analytics/executive` 画面分離
- [ ] 週次専用 KPI 目標テーブル
- [ ] 台形ファネルチャート UX

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| [next-chat-handoff.md](./next-chat-handoff.md) | 新チャット用短縮版 |
| [phase-3-kpi-handoff.md](./phase-3-kpi-handoff.md) | KPI 詳細 |
| [phase-4.md](./phase-4.md) | 次 Phase（SaaS 化） |
| [README.md](./README.md) | ロードマップ索引 |
| [database-design.md](../database-design.md) | スキーマ |
| [er-diagram.md](../er-diagram.md) | ER 図 |

---

## Migration 一覧（参考）

| migration | 内容 |
|-----------|------|
| `20260622180000_phase25_call_leads_step1` | Tenant + CallLead |
| `20260623140000_phase3_kpi` | KpiGoal, ActivityMetricDaily |
| `20260623160000_kpi_metric_types_v2` | KPI 12 指標 enum |
| `20260623180000_user_role_hierarchy` | DEVELOP + managerId |
