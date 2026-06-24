# Phase 3 KPI — 引き継ぎ書（詰め・改善用）

**作成日:** 2026-06-23  
**プロジェクト:** CA CRM — `C:\Users\user\Desktop\ca-crm`  
**Phase 状態:** Phase 3 KPI — **初版実装済み・詰めフェーズ**  
**前工程:** Phase 2.5 CallLead ✅ 完了

---

## 新チャットに貼り付ける指示文

```
# CA CRM — Phase 3 KPI 詰め・改善

@docs/handoff/phase-3-kpi-handoff.md と @docs/handoff/phase-3.md を参照してください。

## プロジェクト
- パス: C:\Users\user\Desktop\ca-crm
- dev: http://localhost:3003（npm run dev）
- スタック: Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui

## 重要ルール
- 既存 CRM（Candidate / Activity / Communications / CallLead）を壊さない（追加のみ）
- npm run build と npm run dev を同時実行しない
- git commit は明示指示があるまで行わない

## 現状
Phase 3 KPI の初版は動作確認済み。以下を詰めたい：
- 集計ロジックの仕様統一（スナップショット vs 月次遷移）
- 月セレクタと KPI 指標の連動
- UX / 表示の改善
- （任意）ActivityMetricDaily cron、週次目標、グラフ

## 検証
node scripts/regression-step7.mjs      # 既存 CRM 回帰
node scripts/verify-kpi-snapshot.mjs  # KPI 期待値（admin@example.com）
npm run build                          # dev 停止後
```

---

## 実装済みサマリー

| 項目 | 状態 |
|------|------|
| Prisma `KpiGoal`, `ActivityMetricDaily` | ✅ migration 適用済み |
| `/kpi` ダッシュボード（12指標） | ✅ |
| `/kpi/goals` 月次目標一括設定（12項目） | ✅ |
| トップ `/dashboard` KPI ウィジェット（3+3） | ✅ |
| 個人 / チーム目標（`userId null`） | ✅ |
| サイドバー `/kpi` ルート | ✅ `lib/auth/navigation.ts` |
| `npm run build` | ✅ 成功済み |

### Migration（KPI 関連）

- `20260623140000_phase3_kpi` — `KpiGoal`, `ActivityMetricDaily` 初回
- `20260623160000_kpi_metric_types_v2` — 指標 enum 刷新（12種）

---

## 確定した KPI 指標（12種）

### 数値面（9）— 目標設定・`/kpi` ページ上部

| enum | ラベル | 集計方式 |
|------|--------|----------|
| `CALL_COUNT` | 架電数 | 当月 `CallAttempt` 件数 |
| `HEARING_COUNT` | ヒアリング数 | 当月 `Activity` → `HEARING` 遷移 |
| `PROPOSAL_COUNT` | 提案数 | 当月 → `JOB_PROPOSAL` |
| `ENTRY_COUNT` | エントリー数 | **スナップショット**（下記） |
| `INTERVIEW_PREP_COUNT` | 面談対策数 | 当月 → `INTERVIEW_PREP` |
| `INTERVIEW_SET_COUNT` | 面談設定数 | **スナップショット**（下記） |
| `OFFER_COUNT` | 内定数 | 当月 `Application.offerAt` |
| `OFFER_ACCEPTED_COUNT` | 内定承諾数 | 当月 → `OFFER_ACCEPTED` |
| `JOINED_COUNT` | 入社数 | **スナップショット**（下記） |

### 金額面（3）— 単位 **万円**（`CandidateJobCase.referralFee`）

| enum | ラベル | 集計方式 |
|------|--------|----------|
| `ENTRY_AMOUNT` | エントリー数 | **スナップショット** |
| `INTERVIEW_SET_AMOUNT` | 面談設定数 | **スナップショット** |
| `JOINED_AMOUNT` | 入社数 | **スナップショット** |

### 候補者ステータス進捗（合意済み）

```
ヒアリング → 案件提案 → エントリー → 面談対策 → 一次面接 → 工場見学 → 内定承諾 → 入社
```

---

## 集計ロジック（重要・詰めポイント）

実装: `lib/kpi/metrics.ts` / 定数: `lib/kpi/constants.ts`

### A. スナップショット集計（6指標）

**対象:** `ENTRY_COUNT`, `INTERVIEW_SET_COUNT`, `JOINED_COUNT` + 金額3種  
**方式:** 担当候補者の **現在ステータス** でカウント（**月セレクタ非連動**）

| 指標 | 条件 |
|------|------|
| エントリー数 / 金額 | ステータスが `ENTRY` 以降（`ENTRY_OR_BEYOND_STATUSES`） |
| 面談設定数 / 金額 | 同上（エントリー以降到達者の累計。一次面接・入社済みも含む） |
| 入社数 / 金額 | `JOINED` のみ |

**検証データ（`admin@example.com`）:**

| 候補者 | ステータス | 紹介料（万円） |
|--------|------------|----------------|
| テスト太郎 | ENTRY | 50 |
| 日本花子 | FIRST_INTERVIEW | 70 |
| 古川海斗 | JOINED | 70 |

**期待 KPI:** エントリー 3 / 面談設定 3 / 入社 1 — 金額 190 / 190 / 70（万円）

→ `node scripts/verify-kpi-snapshot.mjs` で確認可能

### B. 月次遷移集計（その他数値指標）

**方式:** 選択月の `Activity` / `CallAttempt` / `Application` を期間フィルタ

### C. 日次行動量テーブル

**方式:** 当月 **日別のステータス遷移**（スナップショットではない）  
**表示:** 1日 → 末日（昇順）  
**指標:** エントリー / 面談設定 / 入社（日次は `daily: true` オプションで遷移集計）

### 既知の仕様ギャップ（詰める候補）

1. **月セレクタ** — スナップショット6指標は `yearMonth` を変えても値が変わらない（UX 要検討）
2. **日次 vs スナップショット** — 同じ「エントリー数」ラベルで集計方式が異なる
3. **面談設定（日次）** — `ENTRY`〜`FIRST_INTERVIEW` 遷移のみ。スナップショットは `ENTRY` 以降全体
4. **内定数** — `Application.offerAt` ベース。ステータス `FACTORY_TOUR`（工場見学）とは未連動
5. **`ActivityMetricDaily`** — モデルあるが **同期処理は未使用**（プール枯渇でページ読込時 sync を削除済み）

---

## ファイルマップ

```
app/(dashboard)/
  kpi/page.tsx              # KPI ダッシュボード
  kpi/goals/page.tsx        # 月次目標設定
  dashboard/page.tsx        # KPI ウィジェット組込

components/kpi/
  kpi-progress-card.tsx     # 進捗カード / グリッド
  kpi-daily-table.tsx       # 日次行動量
  kpi-scope-filters.tsx     # 月・個人/チーム・担当者
  kpi-goals-bulk-form.tsx   # 12項目一括目標フォーム
  kpi-goals-table.tsx       # 設定済み目標一覧（Client）
  kpi-dashboard-widget.tsx  # トップページ用

lib/kpi/
  constants.ts              # 指標定義・ラベル・パイプライン
  metrics.ts                # 集計ロジック（snapshot / transition）
  dates.ts                  # 月次期間ユーティリティ
  serialize.ts              # KpiGoal Decimal → number（Client 渡し用）

lib/actions/kpi.ts          # getKpiDashboardData, goals CRUD, widget
lib/validators/kpi.ts       # 一括目標バリデーション
lib/auth/navigation.ts      # `/kpi` ルート定義

prisma/schema.prisma        # KpiGoal, ActivityMetricDaily, KpiMetricType enum

scripts/
  verify-kpi-snapshot.mjs   # KPI 期待値検証
  regression-step7.mjs      # 既存 CRM 回帰（KPI 非対象）
```

---

## アクセス・スコープ

| リソース | スコープ |
|----------|----------|
| KPI 目標（個人） | ログインユーザー |
| KPI 目標（チーム） | `userId = null`、ADMIN/MANAGER のみ設定可 |
| KPI 実績（個人） | 担当候補者 = `assignments.some({ userId, unassignedAt: null })` |
| KPI 実績（チーム） | tenant 内全担当者の合算 |
| 架電数 | tenant 内 `CallAttempt` |

---

## 解決済みインシデント（再発注意）

### 1. Prisma コネクションプール枯渇

**原因:** 日次集計を全並列 + `ActivityMetricDaily` 同期で 300 クエリ超  
**対応:** 日次は逐日処理、sync はページ読込から削除、月次は逐次

### 2. Client Component へ Decimal 渡し

**原因:** `KpiGoal.targetValue` が Prisma `Decimal`  
**対応:** `lib/kpi/serialize.ts` で `KpiGoalRow` に変換してから Client へ

### 3. Radix Select 空文字エラー

**原因:** `KpiScopeFilters` の `value=""`  
**対応:** 有効な `userId` のみ渡す

---

## 詰めフェーズで検討したい項目

### 優先度高

- [ ] **集計仕様の統一** — スナップショット指標を「選択月末時点」にするか、ラベルで明示するか
- [ ] **月セレクタ連動** — `/kpi` の UX（スナップショット指標は月を変えても変わらない問題）
- [ ] **日次行動量の定義** — スナップショット指標とラベルが同じで混乱しないよう整理
- [ ] **内定数** — `Application.offerAt` vs `FACTORY_TOUR` ステータス、どちらを正とするか

### 優先度中

- [ ] 目標未設定時の達成率表示（現状「目標未設定」）
- [ ] チーム KPI で MANAGER が他 CA の実績を見る UX
- [ ] `regression-step7.mjs` に KPI スモーク追加
- [ ] `phase-3.md` チェックリスト更新

### 優先度低（Phase 3 後半 or 別 Phase）

- [ ] `ActivityMetricDaily` cron 同期
- [ ] 週次目標（`GoalPeriodType.WEEKLY`）
- [ ] グラフ（recharts 等）
- [ ] 架電数・ヒアリング数をウィジェットに追加

---

## 環境・検証

```powershell
# migration 未適用環境のみ
npx prisma migrate deploy
npx prisma generate

# 開発
npm run dev   # http://localhost:3003

# 検証（dev 停止してから build）
node scripts/regression-step7.mjs
node scripts/verify-kpi-snapshot.mjs
npm run build
```

### テストアカウント

| Email | 備考 |
|-------|------|
| `admin@example.com` | 担当候補者 3 件（KPI 検証用） |
| `admin@ab-hc.co.jp` | CallLead 35 件共有 |

---

## Phase 4 への注意

KPI は `tenantId` スコープで設計済み。Phase 4 マルチテナント化時は `organizationId` 移行を意識（[phase-4.md](./phase-4.md) 参照）。

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| [phase-3.md](./phase-3.md) | Phase 3 初版スコープ（チェックリスト未更新） |
| [phase-2.5.md](./phase-2.5.md) | CallLead 完了詳細 |
| [README.md](./README.md) | ロードマップ全体 |
| [database-design.md](../database-design.md) | スキーマ設計 |
