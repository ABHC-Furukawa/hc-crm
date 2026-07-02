# CA CRM — チャット引き継ぎドキュメント

大規模改修を Phase 単位で進めるための引き継ぎ資料です。  
**新しい Cursor チャットを開始するとき**、該当ドキュメントを `@docs/handoff/` で参照してください。

## 使い方

1. **[next-chat-handoff.md](./next-chat-handoff.md)** を開く（貼り付け用指示文）
2. 新チャットの最初のメッセージに指示文を貼り付ける
3. 詳細は **[phase-6-call-lead-import.md](./phase-6-call-lead-import.md)** を参照

```
@docs/handoff/phase-6-call-lead-import.md と @docs/handoff/next-chat-handoff.md を参照して Phase 6 を実装してください。
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
| 4 | ✅ 完了 | [phase-4d-handoff.md](./phase-4d-handoff.md) | SaaS 化（テナント分離 / 設定 / 招待 / プラン・上限・監査） |
| 5a | ✅ 完了 | [phase-5a-production-handoff.md](./phase-5a-production-handoff.md) | 本番公開・招待 URL・KPI 通過月・CA 稼働 |
| 5 — Job Operations | ✅ 完了 | [phase-5.md](./phase-5.md) | Google Sheets → Job 同期、案件一覧・詳細、列マッピング、cron |
| 5B — Candidate × Job | ✅ 完了 | [phase-5.md](./phase-5.md) | 候補者案件 ↔ ATS Job 紐付け |
| KPI cron | ✅ 稼働 | [current-state-handoff.md](./current-state-handoff.md) | 日次キャッシュ（GitHub Actions） |
| Job sync cron | ✅ 稼働 | [phase-5.md](./phase-5.md) | 1日2回・タブ分割同期 |
| **6 — CallLead 大量取込** | 🚧 **Step 1〜5 完了（未コミット）** | **[phase-6-call-lead-import.md](./phase-6-call-lead-import.md)** | **Sheets → RawCallLead → CallLead DB 化。次: bulk 取込・デプロイ** |
| PBX Webhook | 未着手 | [phase-5.md](./phase-5.md) § PBX | 発信 Webhook 統合（後続） |

**→ 次チャット用:** [next-chat-handoff.md](./next-chat-handoff.md)  
**→ Phase 6 設計:** [phase-6-call-lead-import.md](./phase-6-call-lead-import.md)  
**→ 現状詳細:** [current-state-handoff.md](./current-state-handoff.md)

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
9. **大量データ:** CallLead 一覧は server-side pagination 必須（Phase 6）

## ディレクトリ構成（主要）

```
app/
  (dashboard)/
    call-leads/                    # 架電リスト（Phase 6 で pagination 強化）
    jobs/                          # 案件 ATS（Phase 5）
  api/cron/
    job-sync/                      # 案件同期 cron
    activity-metrics-daily/        # KPI cron
lib/
  call-leads/                      # 架電ドメイン
  import/                          # 現行 ImportService（CSV/Manual）
  jobs/                            # 案件同期（Phase 5・Sheets 参考実装）
  import/ → call-leads/import/     # Phase 6 で拡張予定
.github/workflows/
  sync-jobs.yml                    # 案件 cron
  sync-kpi-daily.yml               # KPI cron
```
