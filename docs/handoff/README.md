# CA CRM — チャット引き継ぎドキュメント

大規模改修を Phase 単位で進めるための引き継ぎ資料です。  
**新しい Cursor チャットを開始するとき**、該当ドキュメントを `@docs/handoff/` で参照してください。

## 使い方

1. **[next-chat-handoff.md](./next-chat-handoff.md)** を開く（貼り付け用指示文）
2. 新チャットの最初のメッセージに指示文を貼り付ける
3. 詳細は **[phase-5a-production-handoff.md](./phase-5a-production-handoff.md)** を参照

```
@docs/handoff/phase-5a-production-handoff.md と @docs/handoff/next-chat-handoff.md を参照して続きを実装してください。
```

## ロードマップ

| Phase / 工程 | 状態 | ドキュメント | 概要 |
|-------------|------|-------------|------|
| 0 | ✅ 完了 | [phase-0.md](./phase-0.md) | 基盤整備（RBAC、Activity） |
| 1 | ✅ 完了 | [phase-1.md](./phase-1.md) | Task / Notes / Communication CRUD |
| 2 | ✅ 完了 | [phase-2.md](./phase-2.md) | Communication Center |
| 2.5 | ✅ 完了 | [phase-2.5.md](./phase-2.5.md) | CallLead（架電管理） |
| 3 | ✅ 完了 | [phase-3.md](./phase-3.md) / [phase-3-kpi-handoff.md](./phase-3-kpi-handoff.md) | KPI / 月次目標 |
| 3.5 | ✅ 完了 | [current-state-handoff.md](./current-state-handoff.md) | ファネル分析 / 経営ダッシュボード |
| R1–R3 | ✅ 完了 | [current-state-handoff.md](./current-state-handoff.md) | ロール階層 + DEVELOP テナント横断 |
| KPI cron | 🔄 コード済 | [current-state-handoff.md](./current-state-handoff.md) | 日次キャッシュ（secret・backfill 未設定） |
| 4 | ✅ 完了 | [phase-4d-handoff.md](./phase-4d-handoff.md) | SaaS 化（テナント分離 / 設定 / 招待 / プラン・上限・監査） |
| 5a | 🔄 コード済 | [phase-5a-production-handoff.md](./phase-5a-production-handoff.md) | 本番公開・招待 URL・KPI 通過月・CA 稼働・DEVELOP 直接作成 |
| 5 | 未着手 | [phase-5.md](./phase-5.md) | PBX Webhook 統合 |

**→ 次チャット用:** [next-chat-handoff.md](./next-chat-handoff.md)  
**→ 現状詳細:** [phase-5a-production-handoff.md](./phase-5a-production-handoff.md)  
**→ Phase 5 PBX:** [phase-5.md](./phase-5.md)

## プロジェクト基本情報

| 項目 | 値 |
|------|-----|
| パス | `C:\Users\user\Desktop\ca-crm` |
| スタック | Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui |
| dev サーバー | **http://localhost:3003**（`npm run dev`） |
| 本番 | **https://hc-crm.vercel.app** |
| DB | Supabase PostgreSQL（Tokyo） |

## 関連ドキュメント

- [database-design.md](../database-design.md) — スキーマ・Enum・インデックス
- [er-diagram.md](../er-diagram.md) — ER 図

## 開発上の注意

1. **`npm run build` と `npm run dev` を同時実行しない**
2. キャッシュ破損時: dev 停止 → `.next` と `node_modules/.cache` 削除 → `npm run dev`
3. **git commit は明示指示があるまで行わない**
4. 求職者アクセス: `lib/auth/access.ts`（tenant スコープ対応）
5. 架電リード: `lib/tenant/access.ts`（tenant 内共有）
6. テナントコンテキスト: `lib/tenant/context.ts`（DEVELOP 切替 + `cache()`）
7. ルート RBAC: `lib/auth/navigation.ts`
8. **Client Component から Prisma を transitively import しない** — 定数は `lib/tenant/plan-options.ts` 等に分離

## ディレクトリ構成（主要）

```
app/
  (auth)/login/, forgot-password/, reset-password/
  auth/callback/
  (dashboard)/
    dashboard/, candidates/, communications/
    call-leads/, kpi/, kpi/goals, analytics/
    team-status/                   # CA 稼働状況（MANAGER+）
    settings/                      # tenant, members, tenants（DEVELOP）
    users/                         # → /settings/members へリダイレクト
  api/calls/initiate/
  api/cron/activity-metrics-daily/
components/
  candidates/, call-leads/, kpi/, analytics/, users/
  team-status/                     # ca-presence-panel
  layout/                          # sidebar, develop-tenant-switcher
lib/
  actions/                         # kpi, analytics, users, tenant, auth
  auth/                            # session, presence, rbac, navigation
  tenant/                          # context, plan-config, plan-options, enforce-limits
  kpi/, analytics/
  users/lifecycle.ts, invite.ts
  utils/site-url.ts
prisma/schema.prisma
scripts/                           # verify-*, backfill, promote-user-develop
.github/workflows/sync-kpi-daily.yml
```
