# Phase 3 — KPI / 月次目標 / 行動量管理 🔜 次

**目的:** CA・チームの目標設定と日次行動量の可視化

**前提:** [Phase 2](./phase-2.md) + [Phase 2.5](./phase-2.5.md) 完了

**新チャット開始例:** [next-chat-handoff.md](./next-chat-handoff.md) の指示文を貼り付け

```
@docs/handoff/phase-3.md と @docs/handoff/next-chat-handoff.md を参照して Phase 3 を実装してください。
```

---

## スコープ

### 指標（要合意・実装前に確定）
- 架電数 / 通電数
- エントリー数 / 面接設定数
- 内定数 / 入社数
- 紹介料（万円）
- 新規候補者登録数

### チェックリスト
- [ ] Prisma: `KpiGoal`, `ActivityMetricDaily` モデル追加
- [ ] migration 作成・適用
- [ ] `lib/kpi/metrics.ts` — 集計ロジック
- [ ] `lib/actions/kpi.ts` — 目標 CRUD、集計取得
- [ ] `app/(dashboard)/kpi/page.tsx` — KPI ダッシュボード
- [ ] `app/(dashboard)/kpi/goals/page.tsx` — 月次目標設定
- [ ] `components/kpi/` — グラフ、進捗、行動量テーブル
- [ ] Dashboard ウィジェット連携

### Prisma 追加（予定）
```prisma
enum KpiMetricType { CALL_COUNT, CONNECTED_CALL_COUNT, ENTRY_COUNT, ... }
enum GoalPeriodType { MONTHLY, WEEKLY }

model KpiGoal { ... }
model ActivityMetricDaily { ... }
```

### 集計方針
- `Activity` / `Communication` / `Candidate.status` から日次集計
- **Phase 2.5 追加:** `CallAttempt`（架電数・通電数）、`CallLead.status = CONVERTED`（コンバージョン）
- 初期: Server Action 同期集計 → 後から cron 化

### Phase 2.5 からの引き継ぎ

| 既存 | Phase 3 での用途 |
|------|-----------------|
| `CallAttempt` | 架電数 / 通電数 / 結果別集計 |
| `CallLead` | コンバージョン数、tenant スコープ集計 |
| `Communication` | 連絡チャネル別行動量 |
| `Activity` | 候補者ステータス遷移 |
| `lib/tenant/context.ts` | tenant スコープ KPI（チーム目標） |
| `lib/auth/navigation.ts` | `/kpi` ルート追加時はここに定義 |

---

## 完了基準

- [ ] 月次目標設定 → 日次行動量確認 → 達成率表示が一連で動作
- [ ] 個人目標とチーム目標（userId null）に対応

---

## 次 Phase へ

→ [phase-4.md](./phase-4.md)
