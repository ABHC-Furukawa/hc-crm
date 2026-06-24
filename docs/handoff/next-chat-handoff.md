# 新チャット引き継ぎ指示書

**更新日:** 2026-06-24  
**プロジェクト:** CA CRM — `C:\Users\user\Desktop\ca-crm`  
**現在地:** Phase 4 **完了** → **Phase 5（PBX Webhook 統合）**

**詳細は [phase-5.md](./phase-5.md) を参照。**

---

## 新チャットに貼り付ける指示文

以下をそのまま新しい Cursor チャットの最初のメッセージに貼り付けてください。

```
# CA CRM — Phase 5 PBX Webhook 統合

@docs/handoff/phase-5.md と @docs/handoff/next-chat-handoff.md を参照してください。

## プロジェクト
- パス: C:\Users\user\Desktop\ca-crm
- dev: http://localhost:3003（npm run dev）
- スタック: Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui

## 重要ルール
- 既存 CRM（Candidate / Activity / Communications / CallLead）を壊さない
- npm run build と npm run dev を同時実行しない
- git commit は明示指示があるまで行わない
- データスコープは Tenant（`tenantId`）— Phase 4 完了済み

## Phase 4 完了済み（前提）
- 4a: Candidate/Company/Tag tenantId + verify:tenant-isolation
- 4b: /settings/tenant, /members, /tenants
- 4c: メール招待 + /accept-invite
- 4d: プラン・上限 enforcement・TenantAuditLog

## 今回のタスク: Phase 5
- PBX Webhook 受信 API
- lib/pbx/ プロバイダ別パーサ・署名検証
- PbxWebhookEvent（冪等）
- 電話番号 → Candidate 突合（tenant スコープ内）
- Communication + Call 自動 upsert、Activity 記録
- UI: 録音 URL・通話時間・ステータス

## 検証（Phase 4 回帰 + Phase 5 追加）
npm run verify:tenant-isolation
npm run verify:tenant-limits
npm run build                  # dev 停止後
```

---

## クイックリファレンス

| 項目 | 値 |
|------|-----|
| dev URL | http://localhost:3003 |
| DEVELOP ユーザー | admin@ab-hc.co.jp |
| Default tenant ID | `a0000000-0000-4000-a000-000000000001` |
| プラン設定 | `lib/tenant/plan-config.ts`（社内調整可） |
| 監査ログ | DEVELOP のみ `/settings/tenants/[id]` |

---

## Phase 4 検証コマンド（回帰用）

```powershell
npm run verify:tenant-isolation
npm run verify:develop-tenant
npm run verify:user-invite
npm run verify:call-lead-convert
npm run verify:tenant-limits
npm run verify:tenant-audit
node scripts/regression-step7.mjs
```

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| **[phase-5.md](./phase-5.md)** | **Phase 5 詳細（メイン）** |
| [phase-4d-handoff.md](./phase-4d-handoff.md) | Phase 4 完了記録 |
| [current-state-handoff.md](./current-state-handoff.md) | Phase 3 以前の詳細 |
| [README.md](./README.md) | ロードマップ索引 |
