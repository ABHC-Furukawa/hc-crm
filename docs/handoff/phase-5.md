# Phase 5 — Job Operations（案件管理基盤）

**目的:** Google スプレッドシート（1ファイル・会社別タブ）から求人情報を同期し、CRM 内で案件一覧・詳細を参照できる ATS 基盤を構築する。

**前提:** Phase 4 完了（**tenantId** スコープ必須）

---

## スコープ

### チェックリスト
- [x] Prisma: `Job`, `RawJob`, `JobImportLog`
- [x] `lib/jobs/sheets/` — Google Sheets API クライアント
- [x] `GoogleSheetAdapter` + `JobImportService`
- [x] `NormalizeService` + 会社別 `GenericCompanyImporter`（Registry）
- [x] UI: `/jobs` 一覧, `/jobs/[id]` 詳細, `/jobs/sync` 手動同期
- [x] Cron: `GET /api/cron/job-sync`（1日2回 GitHub Actions）
- [x] 13タブ直接同期 + 紹介料40万円以上フィルタ
- [x] 列エイリアス・ヘッダー行自動/手動検出
- [ ] 新日本タブ: シートに **紹介料列** を追加後に取込可能

### データフロー

```
Google Spreadsheet（1ファイル・タブ分け）
  → GoogleSheetAdapter（タブごとにヘッダー検出）
  → JobImportService
  → RawJob
  → NormalizeService / GenericCompanyImporter
  → Job（紹介料 ≥ 40万円のみ）
  → /jobs 一覧・詳細
```

### 登録タブ（13件）

| タブ | companyKey | ヘッダー行 | 取込見込み |
|------|------------|-----------|-----------|
| 綜合キャリア | sogo-career | 自動 | 14 |
| ns派遣 | ns-haken | 自動 | 145 |
| ns正社員 | ns-seishain | 自動 | 20 |
| WT | wt | **3行目** | 18 |
| 平山 | hirayama | 自動 | 3 |
| 新日本 | shinnihon | **3行目** | 0 ※紹介料列なし |
| ヨコタエンタープライズ | yokota-enterprise | 自動 | 150 |
| UTエイム | ut-aim | **5行目** | 41 |
| WIC | wic | 自動 | 0 ※40万以上なし |
| 高木工業 | takagi-kogyo | 自動 | 167 |
| 日研 | nikken | 自動 | 110 |
| BREXA Next | brexa-next | 自動 | 148 |
| 自社派遣 | jisha-haken | 自動 | 4 |

**合計: 約820件**（2026-06-26 診断時）

### 取込対象外タブ

| タブ | 理由 |
|------|------|
| 東洋ワーク | データ不整合のため除外（`clear-jobs.ts --company toyowork` で削除可） |

---

## 環境変数

| 変数 | 説明 |
|------|------|
| `JOB_SPREADSHEET_ID` | 共通スプレッドシート ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | サービスアカウント JSON（1行） |
| `JOB_SHEET_TABS` | （任意）タブ設定 JSON でコード上書き |
| `JOB_SYNC_TENANT_ID` | （任意）Cron 同期対象 tenant |
| `CRON_SECRET` | Cron API 認証 |

---

## 本番デプロイ手順

### 1. GCP / スプレッドシート

1. GCP で Sheets API 有効化 + サービスアカウント作成
2. スプレッドシートを SA メールに **閲覧者** で共有

### 2. Vercel 環境変数

```
JOB_SPREADSHEET_ID=<スプレッドシートID>
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
CRON_SECRET=<ランダム文字列>
```

### 3. DB マイグレーション

```bash
npx prisma migrate deploy
npx prisma generate
```

適用が必要なマイグレーション（Job Operations 関連）:

- `20260626100000_phase5_job_operations`
- `20260626120000_job_referral_fee`
- `20260626140000_job_gender_max_age`
- `20260626150000_job_shift_type_detail`

### 4. 初回同期

Vercel デプロイ後:

- 管理画面 `/jobs/sync` → **全タブを同期**
- または CLI: `npx tsx scripts/sync-jobs.ts`

### 5. 自動同期

GitHub Actions `.github/workflows/sync-jobs.yml` が JST 09:00 / 18:00 に実行。

---

## ローカル開発

```bash
# 診断（取込件数の確認）
npx tsx scripts/diagnose-job-sync.ts
npx tsx scripts/diagnose-job-sync.ts --company shinnihon --inspect

# 同期
npx tsx scripts/sync-jobs.ts
npx tsx scripts/sync-jobs.ts --company takagi-kogyo

# タブ別削除
npx tsx scripts/clear-jobs.ts --company toyowork
```

---

## 完了基準

- [x] Google Sheets → RawJob → Job 同期パイプライン
- [x] tenant スコープ内でのみ保存・参照
- [x] 1日2回自動同期 + 手動同期
- [x] 13タブから約820件取込（40万円以上）
- [ ] 新日本: シート側に紹介料列追加

---

## 将来（Phase 6 以降）

- **Application（推薦管理）** — `CandidateJobCase` と `Job` の連携
- AI による求人情報解析（NormalizeService 差し替え）
- CSV 取込 Adapter
- PBX 連携

---

## 参照

- [phase-4d-handoff.md](./phase-4d-handoff.md)
- `lib/jobs/sheets/company-sheet-config.ts`
- `lib/jobs/sheet-columns.ts`
