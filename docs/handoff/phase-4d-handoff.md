# Phase 4d — SaaS 仕上げ（プラン・上限・退避）引き継ぎ

**更新日:** 2026-06-24  
**プロジェクト:** CA CRM — `C:\Users\user\Desktop\ca-crm`  
**現在地:** Phase 4 **完了**（4a〜4d）→ **Phase 5 へ**

**新チャット用:** [next-chat-handoff.md](./next-chat-handoff.md)

---

## 実施方針

**4d-1 〜 4d-4 は 1 チャットで連続実装する。** サブフェーズごとにチャットを分けない。

推奨順序（同一チャット内）:

```
4d-1  プラン enum + plan-config + usage + UI 表示
  ↓
4d-2  enforcement（A/B）+ CallLead.deletedAt + 保護ルール
  ↓
4d-3  TenantAuditLog + 退避/ブロック記録
  ↓
4d-4  verify-tenant-limits / verify-tenant-audit + build
```

## Phase 4 進捗

| サブフェーズ | 状態 | 内容 |
|-------------|------|------|
| **4a** | ✅ | Candidate / Company / Tag に `tenantId`、分離検証 |
| **4b** | ✅ | `/settings/*` テナント・メンバー管理 UI |
| **4c** | ✅ | メール招待 + `/accept-invite` + `User.pendingInvite` |
| **4d-1** | ✅ | プラン enum + `plan-config` + usage + 設定 UI |
| **4d-2** | ✅ | 上限 enforcement（A/B）+ CallLead `deletedAt` |
| **4d-3** | ✅ | テナント監査ログ + DEVELOP 向け UI |
| **4d-4** | ✅ | verify 拡張 + build |

---

## 4d のゴール（確定方針）

### 上限ポリシー — A / B をリソースごとに選択

```typescript
enum TenantLimitPolicy {
  BLOCK        // A: 上限到達で新規作成・取込を拒否
  EVICT_OLDEST // B: 上限超過分を古い順に退避（ソフトデリート）
}
```

| 方式 | 挙動 |
|------|------|
| **A BLOCK** | `count >= max` なら Server Action で拒否 |
| **B EVICT_OLDEST** | 作成成功後、超過分を古い順に退避 |

**B のフォールバック:** 退避可能件数だけでは上限に収まらない場合（保護レコードのみ等）は、**新規作成のみ BLOCK**。既存データは消さない。

**ユーザー数**は退避不可 → **A BLOCK のみ**。

### ローリング退避の並び順（確定）

| リソース | 並び順 |
|---------|--------|
| **架電リスト（CallLead）** | `appliedAt ASC` → 未設定は `createdAt ASC`（**応募順**） |
| **求職者（Candidate）** | `createdAt ASC`（**登録順**） |

### 退避してはいけない（確定・採用済み）

**CallLead**

| 条件 | 理由 |
|------|------|
| `status = CONVERTED` | 求職者化済み |
| `status = HEARING` | ヒアリング中 |

**Candidate**

| 区分 | 内容 |
|------|------|
| 終端（成功） | `OFFER_ACCEPTED`, `JOINED` |
| 進行中ファネル | `HEARING` 〜 `FACTORY_TOUR` 全段階 |
| 進行中案件 | `Application.status` が終了以外 |

**Application 終了以外＝保護:**  
`DRAFT`, `APPLIED`, `SCREENING`, `INTERVIEW_1`, `INTERVIEW_2`, `INTERVIEW_FINAL`, `OFFER`

**Application 終了（退避候補になり得る）:**  
`ACCEPTED`, `REJECTED_BY_COMPANY`, `REJECTED_BY_CANDIDATE`, `WITHDRAWN`

### 社内調整待ち（実装後でも変更可）

- プラン別 **上限数値**（`max`）
- プラン別 **A/B 割当**（`policy`）
- Default tenant の初期 plan（既存データ保護のため `PROFESSIONAL` または `ENTERPRISE` 推奨）

→ 数値は **`lib/tenant/plan-config.ts` 1 箇所** に集約。4d-1 では **型と枠だけ** 用意し、TBD でも可。

---

## 4d 全体スコープ（同一チャットで一括実装）

### 4d-1 — プラン基盤

**目的:** プラン基盤の「器」。数値は TBD 可。

- [x] Prisma: `TenantPlan` enum + `Tenant.plan`（Default tenant は backfill で `PROFESSIONAL`）
- [x] Prisma: `TenantLimitPolicy` enum（BLOCK / EVICT_OLDEST）
- [x] `lib/tenant/plan-config.ts` — プラン別 `max` + `policy`
- [x] `lib/tenant/usage.ts` — active 件数（users / callLeads / candidates）
- [x] `/settings/tenant` — プラン・利用状況・policy 説明（ADMIN 閲覧）
- [x] `/settings/tenants` — DEVELOP が plan 変更

### 4d-2 — 上限 enforcement（A / B 両対応）

- [x] `CallLead.deletedAt` + 一覧クエリに `deletedAt: null` フィルタ
- [x] `lib/constants/tenant-eviction.ts` — 保護ステータス定義
- [x] `lib/tenant/eviction.ts` — 応募順 / 登録順 + 保護フィルタ
- [x] `lib/tenant/enforce-limits.ts` — `assertCanCreate` / `enforceAfterCreate`
- [x] フック: `inviteUserToTenant`, ImportService, `convertCallLeadToCandidate`, `createCandidateAction`, `createUserAction`
- [x] B フォールバック: 退避不足時は新規 BLOCK のみ
- [x] UI: 利用状況カード + BLOCK / EVICT 説明 + エラー表示

### 4d-3 — 監査ログ

- [x] Prisma: `TenantAuditLog` + `TenantAuditAction`
- [x] 記録: `LIMIT_BLOCKED`, `RECORD_EVICTED`, `EVICT_FALLBACK_BLOCK`, plan 変更, 招待
- [x] DEVELOP 向け audit 表示（`/settings/tenants/[id]`、`canViewTenantAuditLogs`）

### 4d-4 — 検証

- [x] `scripts/verify-tenant-limits.mjs` — BLOCK / EVICT / 保護 / フォールバック
- [x] `scripts/verify-tenant-audit.mjs`
- [x] `package.json` に verify スクリプト追加
- [x] `npm run build`

---

## 4d-1 詳細メモ（参考）

### 主要ファイル（予定）

```
lib/tenant/
  plan-config.ts       ← 4d-1
  usage.ts             ← 4d-1
  limit-policy.ts      ← （未分割）plan-config + enforce-limits に統合
  eviction.ts          ← 4d-2（応募順/登録順 + 保護フィルタ）
  enforce-limits.ts    ← 4d-2
  audit.ts             ← 4d-3

lib/constants/
  tenant-eviction.ts   ← 保護ステータス単一ソース

prisma/
  CallLead.deletedAt   ← 4d-2
  TenantAuditLog       ← 4d-3
```

### enforcement フック箇所（4d-2）

| 入口 | リソース |
|------|---------|
| `inviteUserAction` | users（BLOCK のみ） |
| `ImportService` / CallLead 手動作成 | callLeads |
| `convertCallLeadToCandidate` / `createCandidateAction` | candidates |

---

## Phase 4a〜4c 完了内容（前提知識）

### 4a — データ分離

- `Candidate.tenantId`, `Company.tenantId`, `Tag.tenantId`（NOT NULL）
- `User.tenantId` NOT NULL
- migration: `20260624120000_phase4a_tenant_scope`
- `candidateAccessFilter` → `tenantId` 直接フィルタ
- `npm run verify:tenant-isolation`

### 4b — 設定 UI

| パス | 権限 |
|------|------|
| `/settings/tenant` | ADMIN / DEVELOP |
| `/settings/members` | ADMIN / DEVELOP |
| `/settings/tenants` | DEVELOP |
| `/settings/tenants/new` | DEVELOP |
| `/users` | → `/settings/members` リダイレクト |

### 4c — メール招待

- `User.pendingInvite`
- `lib/users/invite.ts` — Supabase `inviteUserByEmail`
- `/accept-invite` — パスワード設定
- migration: `20260624140000_phase4c_user_invite`
- `npm run verify:user-invite`

### 架電リスト — 求職者登録ボタン（直近修正）

- 重複・対象外含む、`convertedCandidateId` 未設定なら表示
- `npm run verify:call-lead-convert`

---

## 現行 `Tenant` モデル（4d-1 前）

```prisma
model Tenant {
  id        String   @id
  name      String
  slug      String   @unique
  createdAt DateTime
  updatedAt DateTime
  // plan なし ← 4d-1 で追加
}
```

Default tenant ID: `a0000000-0000-4000-a000-000000000001`（`lib/tenant/constants.ts`）

---

## テストアカウント

| メール | ロール | 用途 |
|--------|--------|------|
| `admin@ab-hc.co.jp` | DEVELOP | テナント切替・テナント作成・設定 |
| `admin@example.com` | ADVISOR | KPI テスト（要 DB 存在確認） |
| 山崎 / 磯部 | ADVISOR / ADMIN | Default tenant |

2 件目 tenant: `node scripts/seed-demo-tenant.mjs`

---

## 重要ルール

1. 既存 CRM を壊さない（追加・拡張優先）
2. **`npm run build` と `npm run dev` を同時実行しない**
3. **git commit は明示指示があるまで行わない**
4. Client Component から Prisma を transitively import しない
5. Middleware は Edge — Prisma 直接 import 禁止（4c で `user_metadata.pendingInvite` パターン参照）
6. プラン数値の社内調整は `plan-config.ts` のみ変更する設計にする

---

## 検証コマンド

```powershell
# Phase 4 回帰（推奨一括）
npm run verify:tenant-isolation
npm run verify:develop-tenant
npm run verify:user-invite
npm run verify:call-lead-convert
npm run verify:tenant-limits
npm run verify:tenant-audit
node scripts/regression-step7.mjs

# ビルド（dev 停止後）
npm run build
```

---

## UI 説明文案（4d-2 以降で使用）

**BLOCK**

> 上限に達すると新規登録・取込ができません。

**EVICT_OLDEST**

> 上限を超えると、架電リストは応募日の古い順、求職者は登録の古い順に自動整理されます。  
> ヒアリング中・求職者化済みの架電、進行中・内定/入社の求職者は対象外です。

---

## 関連ドキュメント

| ファイル | 内容 |
|----------|------|
| [next-chat-handoff.md](./next-chat-handoff.md) | 新チャット貼り付け用指示文 |
| [phase-4.md](./phase-4.md) | Phase 4 全体（Organization 前提の旧稿・Tenant ベースで実装中） |
| [current-state-handoff.md](./current-state-handoff.md) | Phase 3 以前の詳細 |
| [phase-5.md](./phase-5.md) | 次 Phase（PBX） |

---

## Phase 4 完了サマリー

**完了日:** 2026-06-24

| 領域 | 主要成果 |
|------|---------|
| 分離 | Candidate / Company / Tag / User に `tenantId` |
| 設定 | `/settings/*`、DEVELOP テナント切替 |
| 招待 | Supabase メール招待 + `/accept-invite` |
| プラン | `TenantPlan` + `plan-config.ts`（数値は社内調整可） |
| 上限 | BLOCK / EVICT_OLDEST + CallLead 退避 |
| 監査 | `TenantAuditLog`（DEVELOP 閲覧） |

**マイグレーション（Phase 4）:** `20260624120000_phase4a_tenant_scope` 〜 `20260624180000_phase4d3_tenant_audit_log`

**社内調整待ち（運用開始前）:** `lib/tenant/plan-config.ts` の max / policy 数値

**次:** [phase-5.md](./phase-5.md) — PBX Webhook 統合
