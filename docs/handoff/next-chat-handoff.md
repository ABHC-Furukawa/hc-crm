# 新チャット引き継ぎ指示書

**更新日:** 2026-06-29  
**プロジェクト:** CA CRM — `C:\Users\user\Desktop\ca-crm`  
**現在地:** Phase 6（CallLead 大量取込）**Step 1〜5 実装完了・未コミット** → Step 6（初回 bulk 取込）・デプロイ・Step 7（cron）が次

**詳細設計:** [phase-6-call-lead-import.md](./phase-6-call-lead-import.md)

---

## 新チャットに貼り付ける指示文（コピー用）

```
# CA CRM — Phase 6 続行（CallLead 大量取込）

@docs/handoff/next-chat-handoff.md と @docs/handoff/phase-6-call-lead-import.md を参照してください。

## プロジェクト
- パス: C:\Users\user\Desktop\ca-crm
- ローカル dev: http://localhost:3003（npm run dev）
- 本番: https://hc-crm.vercel.app
- GitHub: ABHC-Furukawa/hc-crm（master）
- スタック: Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui

## 現在地（2026-06-29）
Phase 6 Step 1〜5 は **コード実装済み・未コミット**。
- ローカル DB: migration `20260629100000_call_lead_bulk_import` **適用済み**
- `npm run build` **成功確認済み**
- 本番 master 最新: `2c02b24`（Phase 6 変更はまだ push されていない）

## 重要ルール
- 既存 CRM（Candidate / Activity / Communications / CallLead / Job）を壊さない
- Google スプレッドシートは取込元のみ。CRM 一覧・検索は DB の CallLead のみ参照
- 2万件を一度に画面表示しない（server-side pagination 必須 — 実装済み）
- npm run build と npm run dev を同時実行しない
- git commit / push は明示指示があるまで行わない

## Phase 6 完了済み（Step 1〜5）

### DB
- `RawCallLead`, `CallLeadImportLog` 新規
- `CallLead` に `sourceSheet`, `sourceRowNumber`, `sourceHash` 追加
- migration: `prisma/migrations/20260629100000_call_lead_bulk_import/`

### 取込サービス
- `lib/call-leads/import/call-lead-import-service.ts` — chunk 500、Raw 保存、upsert、CallLeadImportLog
- `lib/call-leads/import/find-existing.ts` — upsert 判定（行→hash→phone→email→name+age）
- `lib/call-leads/import/source-hash.ts`
- `lib/call-leads/import/adapters/google-sheet-adapter.ts`
- CSV / Manual は `lib/import/import-service.ts` 経由で新サービスに委譲

### UI
- `/call-leads` — server-side pagination（50/100 件）、取込元フィルタ
- `/call-leads/import` — CSV 取込 + Google Sheets 手動同期 + CallLeadImportLog 一覧
- CONVERTED も一覧グレーアウト対象

### 環境変数（.env.example 追記済み）
- CALL_LEAD_SPREADSHEET_ID
- CALL_LEAD_SHEET_NAME（デフォルト: 架電リスト）
- CALL_LEAD_HEADER_ROW / CALL_LEAD_DATA_START_ROW（任意、0=自動検出）
- GOOGLE_SERVICE_ACCOUNT_JSON（Job と共用）

## 次にやること（優先順）

1. **Step 6 — 初回 bulk 取込**
   - `.env` / Vercel に CALL_LEAD_SPREADSHEET_ID 等を設定
   - `/call-leads/import` から「Sheets から同期」で約2万件取込
   - 取込後: 一覧 pagination 性能、CallLeadImportLog、重複/対象外件数を確認

2. **コミット & デプロイ**（ユーザー指示後）
   - 未コミット変更を commit → push master
   - 本番で `prisma migrate deploy`（Vercel build hook または手動）
   - Vercel 環境変数設定

3. **Step 7 — Cron（将来）**
   - `/api/cron/call-lead-sync`
   - GitHub Actions workflow（Job sync と同様 chunk/タイムアウト対策）

## 検証コマンド
npx prisma generate
npm run build
npx prisma migrate deploy   # 本番 DB 適用時

## 参考実装（Job 側）
- lib/jobs/import/job-import-service.ts
- lib/jobs/sheets/google-sheets-client.ts
- .github/workflows/sync-jobs.yml
- app/api/cron/job-sync/route.ts
```

---

## セッション引き継ぎサマリ

### Git 状態（2026-06-29）

| 区分 | 内容 |
|------|------|
| 未 push 最新 | `2c02b24` Fix cron job sync timeout… |
| 未コミット | Phase 6 全変更（下記ファイル一覧） |
| 除外推奨 | `tsconfig.tsbuildinfo`（コミット不要） |

### 変更・追加ファイル一覧

**新規**

| パス | 用途 |
|------|------|
| `lib/call-leads/import/call-lead-import-service.ts` | メイン取込（chunk / upsert / log） |
| `lib/call-leads/import/adapters/google-sheet-adapter.ts` | Sheets → 行パース |
| `lib/call-leads/import/sheet-config.ts` | 環境変数・設定 |
| `lib/call-leads/import/sheet-layout.ts` | ヘッダー行検出 |
| `lib/call-leads/import/find-existing.ts` | upsert 既存検索 |
| `lib/call-leads/import/source-hash.ts` | sourceHash 生成 |
| `lib/call-leads/import/constants.ts` | CHUNK_SIZE=500, page sizes |
| `lib/call-leads/list-url.ts` | 一覧 URL ビルダー |
| `components/call-leads/call-lead-pagination.tsx` | 50/100 件 pagination UI |
| `prisma/migrations/20260629100000_call_lead_bulk_import/` | DB migration |
| `docs/handoff/phase-6-call-lead-import.md` | Phase 6 設計書 |

**変更**

| パス | 変更内容 |
|------|----------|
| `prisma/schema.prisma` | RawCallLead, CallLeadImportLog, CallLead 列 |
| `lib/import/import-service.ts` | 新サービスへ委譲 |
| `lib/import/types.ts` | sourceSheet 等、結果 counts 拡張 |
| `lib/actions/call-lead-import.ts` | Sheets 同期 action、CallLeadImportLog |
| `lib/actions/call-leads.ts` | pagination 対応 |
| `lib/call-leads/queries.ts` | `queryCallLeadsForUser` |
| `lib/call-leads/filters.ts` | page / pageSize / sourceType |
| `lib/call-leads/duplicate-detector.ts` | upsert 用 excludeCallLeadId |
| `app/(dashboard)/call-leads/page.tsx` | pagination |
| `app/(dashboard)/call-leads/import/page.tsx` | Sheets 同期 UI |
| `components/call-leads/call-lead-import-form.tsx` | CSV + Sheets フォーム |
| `components/call-leads/import-log-list.tsx` | CallLeadImportLog 表示 |
| `.env.example` | Phase 6 環境変数 |

---

## データフロー（実装済み）

```
Google Sheets / CSV / Manual
  ↓ Adapter
CallLeadImportService（chunk 500）
  ↓
RawCallLead 保存
  ↓ Normalize + duplicate-detector + eligibility
CallLead upsert（既存は CONVERTED/HEARING/NO_ANSWER ステータス保持）
  ↓
CallLeadImportLog
  ↓
/call-leads 一覧（pagination 50/100）
```

**Upsert 判定順:** `sourceName+sheet+row` → `sourceHash` → `phone` → `email` → `name+age` → create

---

## クイックリファレンス

| 項目 | 値 |
|------|-----|
| 本番 URL | https://hc-crm.vercel.app |
| 架電リスト | `/call-leads` |
| 架電取込・同期 | `/call-leads/import` |
| 案件同期 | `/jobs/sync` |
| Job cron | GitHub Actions `Sync Jobs from Google Sheets` |
| KPI cron | GitHub Actions `Sync KPI Daily Cache` |
| CallLead cron | **未実装**（Step 7） |

---

## Step 6 実行手順（初回 bulk 取込）

1. スプレッドシートをサービスアカウントに Viewer 共有
2. `.env.local` に設定:
   ```
   CALL_LEAD_SPREADSHEET_ID="..."
   CALL_LEAD_SHEET_NAME="架電リスト"
   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```
3. **preflight（推奨）** — dev サーバー不要:
   ```bash
   npm run call-leads:inspect
   ```
4. **取込実行** — UI または CLI（2万件は CLI 推奨、タイムアウト回避）:
   ```bash
   # CLI（dev サーバー不要、数分かかる可能性）
   npm run call-leads:sync

   # または npm run dev → /call-leads/import → 「Sheets から同期」
   ```
5. **取込後検証**:
   ```bash
   npm run verify:call-lead-import
   ```
   確認項目:
   - CallLeadImportLog の created/updated/duplicate/outOfScope 件数
   - `/call-leads` 一覧の pagination・フィルタ
   - 既存 CONVERTED リード（現在 7 件）が上書きされていないこと

---

## デプロイ手順（commit 指示後）

1. `git add`（`tsconfig.tsbuildinfo` は除外）
2. commit → `git push origin master`
3. Vercel 環境変数: `CALL_LEAD_SPREADSHEET_ID`, `CALL_LEAD_SHEET_NAME`, `GOOGLE_SERVICE_ACCOUNT_JSON`
4. 本番 DB: migration 適用（build 時 or `npx prisma migrate deploy`）
5. 本番 `/call-leads/import` で同期テスト

---

## 既知の注意点

- 汎用 `ImportLog` は残存。新取込は `CallLeadImportLog` を使用
- Sheets 同期 UI は `CALL_LEAD_SPREADSHEET_ID` 未設定時は非表示
- Vercel serverless timeout: 2万件一括同期は Job sync 同様、将来 cron + chunk 分割が安全
- ローカル migration 適用済みだが、本番は push 後に別途適用が必要

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| [phase-6-call-lead-import.md](./phase-6-call-lead-import.md) | Phase 6 設計・チェックリスト |
| [phase-2.5.md](./phase-2.5.md) | CallLead 初版 |
| [phase-5.md](./phase-5.md) | Job Operations（Sheets 参考） |
| [README.md](./README.md) | ロードマップ索引 |
