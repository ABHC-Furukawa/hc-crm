# Phase 4 — SaaS 化（マルチテナント）

> **✅ 完了（2026-06-24）** — `Organization` 案ではなく **Tenant + tenantId** ベースで実装済み。  
> 詳細は [phase-4d-handoff.md](./phase-4d-handoff.md) を参照。

**目的:** 複数紹介会社への提供基盤。組織単位のデータ完全分離。

**前提:** [Phase 3](./phase-3.md) 完了

**⚠️ 最大の破壊的変更。** KPI / Communication Center を org スコープなしで作りすぎないこと（Phase 3 までに設計を意識）。

**新チャット開始例:**

```
@docs/handoff/phase-4.md に従って Phase 4 を実装してください。
```

---

## スコープ

### チェックリスト
- [ ] Prisma: `Organization`, `Membership` モデル
- [ ] 全業務テーブルに `organizationId` FK
- [ ] 既存データを default Organization に backfill
- [ ] `lib/tenant/context.ts` — セッションから org 解決
- [ ] `lib/tenant/access.ts` — org スコープ assert
- [ ] 全 Server Action / クエリに org フィルタ
- [ ] `app/(dashboard)/settings/` — 組織・メンバー管理
- [ ] 組織登録・招待フロー
- [ ] migration 履歴の一本化

### Prisma 追加（予定）
```prisma
enum OrganizationPlan { FREE, STARTER, PROFESSIONAL, ENTERPRISE }
enum MembershipRole { OWNER, ADMIN, MANAGER, ADVISOR }

model Organization { id, name, slug, plan, ... }
model Membership { organizationId, userId, role, ... }

// 各モデルに organizationId 追加
model Candidate { organizationId String ... }
```

### 移行戦略
1. default Organization 1件作成
2. 全行 backfill
3. NOT NULL 制約追加
4. アプリ層ガード（初期は RLS 不要、Phase 4 後半で検討）

---

## 完了基準

- [ ] 2組織のデータが完全分離
- [ ] 同一 DB で複数テナント運用可能

---

## 次 Phase へ

→ [phase-5.md](./phase-5.md)
