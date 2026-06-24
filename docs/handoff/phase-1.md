# Phase 1 — Task / Notes / Communication CRUD 完成 ✅ 完了

**目的:** 候補者詳細タブの CRUD 不足を解消し、日常業務を詳細ページ内で完結させる

**前提:** [Phase 0](./phase-0.md) 完了

**状態:** 完了（2026-06-22）

---

## 実施内容

### 1. Task

- [x] `updateTaskAction` — title, description, priority, dueAt 編集
- [x] `updateTaskStatusAction` 拡張 — IN_PROGRESS, CANCELLED, TODO 復帰, DONE 対応
- [x] `updateTaskAssigneeAction` — `assignedToId` 変更（アクティブ CA ユーザー）
- [x] `task-list-panel.tsx` — 編集 UI、ステータスボタン、担当者 select
- [x] Activity ログ（UPDATED, STATUS_CHANGED, ASSIGNED）
- [x] `lib/users/queries.ts` — `getActiveUsersForAssignment`（タスクタブ用）
- [x] `lib/validators/task.ts` — `taskAssigneeSchema` 追加

| ファイル | 内容 |
|---------|------|
| `lib/actions/tasks.ts` | create / update / status / assignee |
| `lib/validators/task.ts` | 更新・担当者 schema |
| `components/candidates/detail/task-list-panel.tsx` | CRUD UI |
| `app/(dashboard)/candidates/[id]/page.tsx` | tasks タブで `assignableUsers` 取得 |

**未実施（任意）:** Task の `createdById` / `cancelledAt` / `cancelReason` — Phase 2 以降で必要なら追加

---

### 2. Note

- [x] `updateNoteAction` — content, type 編集
- [x] `deleteNoteAction` — ソフトデリート（`deletedAt` 設定、ピン解除）
- [x] `note-list-panel.tsx` — 編集・削除 UI
- [x] 一覧から `deletedAt IS NULL` のみ表示
- [x] migration `20260622150000_add_note_deleted_at` 適用済み

| ファイル | 内容 |
|---------|------|
| `prisma/schema.prisma` | `Note.deletedAt` |
| `lib/actions/notes.ts` | create / update / delete / pin |
| `lib/candidates/queries.ts` | `notes: { where: { deletedAt: null } }` |
| `components/candidates/detail/note-list-panel.tsx` | CRUD UI |

**既知の軽微事項:** サマリーカード等の `_count.notes` は削除済みメモを含む可能性あり（一覧表示はフィルタ済み）

---

### 3. Communication

- [x] `updateCommunicationLogAction` — 手動記録の編集（CALL 時は Call upsert / チャネル変更時 Call 削除）
- [x] `deleteCommunicationAction` — 削除（Call は Communication 削除で Cascade）
- [x] `communication-history-panel.tsx` — 作成フォーム共通化
- [x] `communication-item.tsx` — 編集・削除 UI、Call 詳細強化
- [x] `communication-log-form-fields.tsx` — 作成・編集フォーム共通化（新規）
- [x] `lib/constants/labels.ts` — PBX / 録音 / 文字起こし / AI要約ラベル追加

| ファイル | 内容 |
|---------|------|
| `lib/actions/communications.ts` | create / update / delete |
| `components/candidates/detail/communication-history-panel.tsx` | 一覧 + 記録 |
| `components/candidates/detail/communication-item.tsx` | 表示・編集・削除 |
| `components/candidates/detail/communication-log-form-fields.tsx` | フォーム部品 |

---

## 完了基準

- [x] 候補者詳細の Task / Notes / Communications タブで CRUD が完結
- [x] 全 action が `assertCandidateAccess` 経由
- [x] `npm run build` 成功
- [x] マイグレーション履歴同期済み（`Database schema is up to date!`）
- [x] `prisma generate` 成功

---

## 追加・変更ファイル（Phase 1 全体）

```
lib/actions/tasks.ts
lib/actions/notes.ts
lib/actions/communications.ts
lib/validators/task.ts
lib/users/queries.ts                    (新規)
lib/candidates/queries.ts
lib/constants/labels.ts
components/candidates/detail/task-list-panel.tsx
components/candidates/detail/note-list-panel.tsx
components/candidates/detail/communication-history-panel.tsx
components/candidates/detail/communication-item.tsx
components/candidates/detail/communication-log-form-fields.tsx  (新規)
app/(dashboard)/candidates/[id]/page.tsx
prisma/schema.prisma
prisma/migrations/20260622150000_add_note_deleted_at/
```

---

## 規約・参照

- アクセス制御: `lib/auth/access.ts`
- Include 定義: `lib/candidates/queries.ts`
- ラベル: `lib/constants/labels.ts`
- commit は明示指示まで不要

---

## 次 Phase へ

→ [phase-2.md](./phase-2.md) — Communication Center（候補者横断の連絡ハブ）
