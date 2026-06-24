# Phase 2 — Communication Center 🔜 次

**目的:** 候補者横断の連絡ハブ — CA が詳細を開かず連絡履歴を検索・記録できる

**前提:** [Phase 1](./phase-1.md) 完了

**新チャット開始例:** 下記「引き継ぎ指示文」を新チャットに貼り付け

---

## Phase 1 からの引き継ぎ

Phase 1 で候補者詳細内の Communication CRUD は完成済み。Phase 2 では以下を**再利用**する:

| 既存 | 用途 |
|------|------|
| `createCommunicationLogAction` | 手動記録モーダル |
| `updateCommunicationLogAction` / `deleteCommunicationAction` | 詳細ページと同じ（横断一覧では read 中心） |
| `communication-log-form-fields.tsx` | 記録フォーム |
| `communication-item.tsx` | 一覧行表示（必要に応じて共通化・移動） |
| `lib/auth/access.ts` — `candidateAccessFilter` | RBAC 付き横断クエリの where 条件 |
| `lib/constants/labels.ts` | チャネル・方向・ステータスラベル |

---

## スコープ

### チェックリスト
- [ ] `app/(dashboard)/communications/page.tsx` — グローバル一覧
- [ ] `components/communications/` — 一覧、フィルタ、詳細
- [ ] `getCommunicationsForUser` — 担当候補者分の横断検索（RBAC 適用）
- [ ] フィルタ: チャネル / 期間 / 候補者 / 担当CA
- [ ] 手動記録モーダル（候補者選択 → 既存 action 再利用）
- [ ] `components/layout/app-sidebar.tsx` — ナビ追加

### 変更対象（予定）
```
app/(dashboard)/communications/page.tsx  (新規)
components/communications/               (新規)
lib/actions/communications.ts            (getCommunicationsForUser)
lib/constants/labels.ts
components/layout/app-sidebar.tsx
```

### Prisma 変更（任意）
- Communication 横断検索用インデックス強化（migration SQL）

---

## 完了基準

- [ ] `/communications` で担当候補者の連絡を横断表示
- [ ] 候補者詳細へのリンク、手動記録が可能
- [ ] ADMIN/MANAGER は全候補者、ADVISOR は担当分のみ
- [ ] `npm run build` 成功

---

## 規約・参照

- アクセス制御: `lib/auth/access.ts`（`candidateAccessFilter` / `canViewAllCandidates`）
- 候補者 include: `lib/candidates/queries.ts`
- ラベル: `lib/constants/labels.ts`
- **`npm run build` と `npm run dev` を同時実行しない**
- commit は明示指示まで不要

---

## 次 Phase へ

→ [phase-3.md](./phase-3.md)
