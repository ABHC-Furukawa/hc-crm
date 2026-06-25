# 新チャット引き継ぎ指示書

**更新日:** 2026-06-25  
**プロジェクト:** CA CRM — `C:\Users\user\Desktop\ca-crm`  
**現在地:** Phase 5a 機能追加済み（**未コミット**）→ **コミット / 本番反映 / Phase 5 へ**

**詳細は [phase-5a-production-handoff.md](./phase-5a-production-handoff.md) を参照。**

---

## 新チャットに貼り付ける指示文

```
# CA CRM — Phase 5a 反映 & 次フェーズ

@docs/handoff/phase-5a-production-handoff.md と @docs/handoff/next-chat-handoff.md を参照してください。

## プロジェクト
- パス: C:\Users\user\Desktop\ca-crm
- ローカル dev: http://localhost:3003（npm run dev）
- 本番（Vercel）: https://hc-crm.vercel.app
- GitHub: ABHC-Furukawa/hc-crm（master）
- Supabase: xtnlqkopygdchirfyxge（Tokyo）
- スタック: Next.js 15, TypeScript, Prisma, Supabase Auth, shadcn/ui

## 重要ルール
- 既存 CRM（Candidate / Activity / Communications / CallLead）を壊さない
- npm run build と npm run dev を同時実行しない
- git commit は明示指示があるまで行わない
- Client Component から @prisma/client を transitively import しない

## 完了済み（ローカル・未コミットの可能性あり）
- 招待 URL: NEXT_PUBLIC_SITE_URL + site-url.ts ガード + Vercel redeploy
- パフォーマンス: cache() / Prisma globalThis シングルトン
- DEVELOP: メンバー直接作成 + users 上限スキップ
- KPI: 進行中・金額を通過月ベース集計
- CA 稼働状況: /team-status（10分オンライン、last_seen_at）
- 修正: /settings/tenants（plan-options.ts 分離）

## 優先タスク
1. git commit + push + Vercel redeploy（未反映なら）
2. 本番 DB: npx prisma migrate deploy（last_seen_at）
3. Supabase Auth URL Configuration 確認
4. （任意）Vercel Tokyo + connection_limit=1
5. （任意）架電リストページネーション
6. Phase 5 PBX Webhook（phase-5.md）

## 検証
npm run verify:tenant-isolation
npm run verify:user-invite
npm run build
```

---

## クイックリファレンス

| 項目 | 値 |
|------|-----|
| 本番 URL | https://hc-crm.vercel.app |
| ローカル dev | http://localhost:3003 |
| DEVELOP ユーザー | `admin-1@ab-hc.co.jp` |
| 招待 redirectTo | `{SITE_URL}/auth/callback?next=/accept-invite` |
| CA 稼働状況 | `/team-status`（MANAGER+、10分以内=オンライン） |
| DEVELOP 直接作成 | 設定 → メンバー → 直接作成タブ |
| KPI 集計（月次） | エントリー/面談設定/入社 = **通過月** |

---

## 2026-06-25 セッションで追加した主要変更

| 領域 | 変更 |
|------|------|
| Auth / URL | `lib/utils/site-url.ts`, Vercel `NEXT_PUBLIC_SITE_URL` |
| Performance | `cache()` in session/context, `lib/prisma.ts` singleton |
| Users | DEVELOP direct create, `member-onboarding-section.tsx` |
| KPI | Transition-based monthly pipeline + amount metrics |
| Presence | `last_seen_at`, `/team-status`, `lib/auth/presence*.ts` |
| Bugfix | `lib/tenant/plan-options.ts`（tenants page crash） |

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| **[phase-5a-production-handoff.md](./phase-5a-production-handoff.md)** | **本番公開・5a 完了記録（メイン）** |
| [phase-5.md](./phase-5.md) | PBX Webhook |
| [phase-4d-handoff.md](./phase-4d-handoff.md) | Phase 4 完了記録 |
| [README.md](./README.md) | ロードマップ索引 |
