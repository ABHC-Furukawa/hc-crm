# CA CRM — Database Design

ER図: [`er-diagram.md`](./er-diagram.md)  
Prisma: [`../prisma/schema.prisma`](../prisma/schema.prisma)  
Partial Index マイグレーション: [`../prisma/migrations/20260621155200_add_partial_indexes/`](../prisma/migrations/20260621155200_add_partial_indexes/)

---

## 1. Enum 定義

### User / Candidate / Assignment

| Enum | 値 | 用途 |
|------|-----|------|
| `UserRole` | ADMIN, MANAGER, ADVISOR | 権限ロール（ADMIN/MANAGER=全候補者、ADVISOR=担当のみ） |
| `CandidateStatus` | HEARING, JOB_PROPOSAL, ENTRY, INTERVIEW_PREP, FIRST_INTERVIEW, FACTORY_TOUR, OFFER_ACCEPTED, JOINED, WITHDRAWN, REJECTED, UNREACHABLE, NOT_REFERRABLE, LOST | 候補者ステータス（製造派遣向け13段階） |
| `CandidateSource` | REFERRAL, JOB_BOARD, SNS, EVENT, INBOUND, LINE, OTHER | 流入経路 |
| `AssignmentRole` | PRIMARY, SECONDARY | CA担当ロール |
| `EmploymentStatus` | EMPLOYED, UNEMPLOYED, DISPATCH, PART_TIME, STUDENT, OTHER, UNKNOWN | 就業状況 |
| `EmploymentType` | FULL_TIME, PART_TIME, DISPATCH, CONTRACT, TEMPORARY, OTHER, UNKNOWN | 雇用形態 |
| `ExperienceLevel` | NONE, LESS_THAN_1_YEAR, … | 経験年数 |
| `VisaStatus` | JAPANESE, PERMANENT, WORK, … | 在留資格 |

### Company / Tag / Note

| Enum | 値 | 用途 |
|------|-----|------|
| `CompanyStatus` | PROSPECT, ACTIVE, INACTIVE, CLOSED | 取引ステータス |
| `CompanyIndustry` | IT, FINANCE, MANUFACTURING, RETAIL, HEALTHCARE, CONSULTING, MEDIA, EDUCATION, OTHER | 業界分類 |
| `TagCategory` | SKILL, EXPERIENCE, PREFERENCE, STATUS, CUSTOM | タグ種別 |
| `NoteType` | GENERAL, INTERVIEW, FOLLOW_UP, INTERNAL | メモ種別 |

### Communication / Call (PBX)

| Enum | 値 | 用途 |
|------|-----|------|
| `CommunicationChannel` | CALL, EMAIL, SMS, LINE, MEETING, OTHER | チャネル |
| `CommunicationDirection` | INBOUND, OUTBOUND, INTERNAL | 方向 |
| `CommunicationStatus` | DRAFT, SENT, DELIVERED, READ, FAILED, CANCELLED | 配信状態 |
| `PbxProvider` | TWILIO, MIITEL, BIZTEL, ZOOM_PHONE, ASTERISK, FREEPBX, CUSTOM, UNKNOWN | PBXプロバイダ（`calls.provider`） |
| `CallStatus` | INITIATED, RINGING, IN_PROGRESS, ANSWERED, COMPLETED, MISSED, VOICEMAIL, BUSY, FAILED, CANCELLED | 通話状態 |
| `RecordingStatus` | NONE, PENDING, AVAILABLE, FAILED, EXPIRED | 録音状態 |
| `TranscriptStatus` | NONE, PENDING, PROCESSING, COMPLETED, FAILED | 文字起こし処理 |
| `AiSummaryStatus` | NONE, PENDING, PROCESSING, COMPLETED, FAILED | AI要約処理 |

### LINE

| Enum | 値 | 用途 |
|------|-----|------|
| `LineConversationStatus` | OPEN, CLOSED, BLOCKED | 会話状態 |
| `LineMessageType` | TEXT, IMAGE, STICKER, FILE, FLEX, LOCATION, OTHER | メッセージ種別 |

### Task / Activity / File / Application

| Enum | 値 | 用途 |
|------|-----|------|
| `TaskStatus` | TODO, IN_PROGRESS, DONE, CANCELLED | タスク状態 |
| `TaskPriority` | LOW, MEDIUM, HIGH, URGENT | 優先度 |
| `ActivityAction` | CREATED, UPDATED, DELETED, STATUS_CHANGED, ASSIGNED, UNASSIGNED, COMMUNICATION_LOGGED, CALL_COMPLETED, FILE_UPLOADED, NOTE_ADDED, TAG_ASSIGNED, TAG_REMOVED, APPLICATION_SUBMITTED | 監査アクション |
| `ActivityEntityType` | CANDIDATE, COMPANY, COMMUNICATION, CALL, LINE_CONVERSATION, LINE_MESSAGE, EMAIL_THREAD, EMAIL_MESSAGE, TASK, FILE, NOTE, TAG, APPLICATION, CANDIDATE_ASSIGNMENT, USER | 参照エンティティ |
| `FileCategory` | RESUME, CV, PORTFOLIO, CONTRACT, RECORDING, TRANSCRIPT, OTHER | ファイル種別 |
| `ApplicationStatus` | DRAFT, APPLIED, SCREENING, INTERVIEW_1, INTERVIEW_2, INTERVIEW_FINAL, OFFER, ACCEPTED, REJECTED_BY_COMPANY, REJECTED_BY_CANDIDATE, WITHDRAWN | 選考ステータス |

---

## 2. Prisma Schema

完全な定義は `prisma/schema.prisma` を参照。

### チャネル拡張モデル（Communication 1:1）

```prisma
Communication ──1:1── Call         // PBX: provider + external_call_id
Communication ──1:1── LineMessage  ──▶ LineConversation
Communication ──1:1── EmailMessage ──▶ EmailThread
```

### 複数CA — CandidateAssignment

```prisma
model CandidateAssignment {
  id           String         @id
  candidateId  String
  userId       String
  role         AssignmentRole // PRIMARY | SECONDARY
  assignedAt   DateTime
  unassignedAt DateTime?      // null = 現役
}
```

`Candidate.assignedAdvisorId` は削除。PRIMARY 担当は `CandidateAssignment` で取得。

### Call PBX 強化

```prisma
model Call {
  provider       PbxProvider @map("provider")
  externalCallId String?     @map("external_call_id")
  parentCallId   String?
  answeredByUserId String?

  @@unique([provider, externalCallId])
}
```

### 今回の主要変更点

| モデル | 変更 |
|--------|------|
| 新規 | `CandidateJobCase` | 候補者1:1の進行中案件（エントリー〜入社予定日） |
| `Candidate` | プロフィール拡張フィールド（就業状況・身体情報・希望条件等） |
| `Candidate` | `assignedAdvisorId` 削除 → `CandidateAssignment` へ移行 |
| `Candidate` | `createdById` 追加、`phone @unique` 削除（partial UNIQUE は SQL） |
| `Call` | `pbxProvider` → `provider`、`@@unique([provider, externalCallId])` |
| `Call` | AI エラー列、`answeredByUserId`、`recordingStoragePath` 追加 |
| 新規 | `LineConversation`, `LineMessage`, `EmailThread`, `EmailMessage` |
| 新規 | `CandidateAssignment` (PRIMARY / SECONDARY) |
| `Application` | `@@unique([candidateId, companyId, jobTitle])` 追加 |

---

## 3. インデックス設計

### 候補者一覧・検索（10万件+）

| テーブル | インデックス | クエリ用途 |
|----------|-------------|-----------|
| `candidates` | `(status)` | ステータスフィルタ |
| `candidates` | `(email)` | メール検索 |
| `candidates` | `(phone)`, `(phone_secondary)` | PBX/LINE 突合 |
| `candidates` | `(last_name, first_name)` | 氏名ソート |
| `candidates` | `(updated_at DESC)` | 最近更新フィード |
| `candidate_assignments` | `(user_id, role, unassigned_at)` | CA別担当一覧 |
| `candidate_assignments` | `(candidate_id, role, unassigned_at)` | 候補者の現役担当取得 |
| `candidate_tags` | `(tag_id, candidate_id)` | タグ AND 検索 |

### 複数CA運用

| テーブル | インデックス / 制約 | 用途 |
|----------|---------------------|------|
| `candidate_assignments` | partial UNIQUE `(candidate_id) WHERE role='PRIMARY' AND unassigned_at IS NULL` | 主担当1名制約（SQL） |
| `candidate_assignments` | `(user_id, role, unassigned_at)` | ADVISOR の担当候補者一覧 |

### タイムライン・コミュニケーション

| テーブル | インデックス | クエリ用途 |
|----------|-------------|-----------|
| `communications` | `(candidate_id, occurred_at DESC)` | 候補者タイムライン |
| `line_conversations` | `(candidate_id)`, `(last_message_at DESC)` | LINE 一覧 |
| `line_messages` | `(line_conversation_id, created_at DESC)` | 会話履歴 |
| `email_threads` | `(candidate_id)`, `(last_message_at DESC)` | メール一覧 |
| `email_messages` | `(email_thread_id, created_at DESC)` | スレッド内メール |
| `activities` | `(candidate_id, occurred_at DESC)` | 監査ログ |

### PBX / AI

| テーブル | インデックス | クエリ用途 |
|----------|-------------|-----------|
| `calls` | `(provider, external_call_id)` UNIQUE | Webhook 冪等 |
| `calls` | `(from_number)`, `(to_number)` | 着信候補者突合 |
| `calls` | `(transcript_status)` | 文字起こしキュー |
| `calls` | `(transcript_status, ai_summary_status)` | AI パイプライン全体キュー |
| `calls` | `(ended_at DESC)` | 直近通話一覧 |

### LINE / Email Webhook

| テーブル | インデックス / 制約 | 用途 |
|----------|---------------------|------|
| `line_conversations` | UNIQUE `(line_channel_id, line_user_id)` | Webhook 会話突合 |
| `line_messages` | UNIQUE `(line_conversation_id, external_message_id)` | メッセージ冪等 |
| `email_messages` | UNIQUE `(message_id)` | RFC Message-ID 重複防止 |

### ユニーク制約

| テーブル | 制約 | 理由 |
|----------|------|------|
| `candidates.phone` | partial UNIQUE `WHERE deleted_at IS NULL` | ソフトデリート考慮（SQL） |
| `calls` | `(provider, external_call_id)` | PBX 冪等 |
| `applications` | `(candidate_id, company_id, job_title)` | 重複応募防止 |
| `line_conversations` | `(line_channel_id, line_user_id)` | LINE ユーザー一意 |
| `files.storage_path` | UNIQUE | Storage オブジェクト一意性 |

---

## 4. PostgreSQL 向け最適化案

Prisma スキーマに含まれない拡張は `20260621155200_add_partial_indexes` マイグレーションで管理。

### 4.1 Partial Index（ソフトデリート・現役担当）

```sql
-- 電話番号: 削除済み候補者の番号再利用を許可
CREATE UNIQUE INDEX idx_candidates_phone_active
  ON candidates (phone) WHERE deleted_at IS NULL;

-- PRIMARY 担当: 候補者1人につき現役1名
CREATE UNIQUE INDEX idx_candidate_assignment_primary_active
  ON candidate_assignments (candidate_id)
  WHERE role = 'PRIMARY' AND unassigned_at IS NULL;

-- CA別アクティブ候補者（JOIN 用）
CREATE INDEX idx_candidate_assignments_advisor_active
  ON candidate_assignments (user_id, candidate_id)
  WHERE unassigned_at IS NULL;
```

### 4.2 全文検索（10万件+ Candidate）

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_candidates_name_trgm
  ON candidates USING gin ((last_name || ' ' || first_name) gin_trgm_ops);

CREATE INDEX idx_notes_content_fts
  ON notes USING gin (to_tsvector('simple', content));
```

### 4.3 JSONB GIN

```sql
CREATE INDEX idx_activities_metadata_gin
  ON activities USING gin (metadata jsonb_path_ops);

CREATE INDEX idx_calls_pbx_metadata_gin
  ON calls USING gin (pbx_metadata jsonb_path_ops);

CREATE INDEX idx_line_messages_raw_payload_gin
  ON line_messages USING gin (raw_payload jsonb_path_ops);
```

### 4.4 BRIN Index（大量ログ）

```sql
CREATE INDEX idx_activities_occurred_brin
  ON activities USING brin (occurred_at) WITH (pages_per_range = 128);

CREATE INDEX idx_communications_occurred_brin
  ON communications USING brin (occurred_at) WITH (pages_per_range = 128);
```

### 4.5 Supabase 接続プーリング

| 用途 | 接続 | 設定 |
|------|------|------|
| アプリ実行時 | Transaction pooler (port 6543) | `DATABASE_URL` + `?pgbouncer=true` |
| マイグレーション | Session pooler (port 5432) | `DIRECT_URL` |

**注意:** 新しい Supabase プロジェクトは `aws-1-[region].pooler.supabase.com` を使用。`db.[ref].supabase.co:5432` への直接接続は環境によって到達不可な場合がある。

### アプリ層アクセス制御（Phase 0）

| ロール | 候補者アクセス |
|--------|--------------|
| ADMIN / MANAGER | 全候補者 |
| ADVISOR | 担当割当（`CandidateAssignment.unassignedAt IS NULL`）のみ |

実装: `lib/auth/access.ts` の `candidateAccessFilter` / `assertCandidateAccess`

### 4.6 RLS（複数CA運用）

```sql
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidates_assignment_select ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidate_assignments ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.candidate_id = candidates.id
        AND ca.unassigned_at IS NULL
        AND u.auth_id = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE auth_id = auth.uid()::text
        AND role IN ('ADMIN', 'MANAGER')
    )
  );
```

### 4.7 パーティション（将来）

`activities` / `communications` が数百万行を超えた場合、`occurred_at` 月次 RANGE パーティションを検討。

---

## Production Ready 判定

| 観点 | 状態 | 備考 |
|------|------|------|
| クラウドPBX統合 | ✅ | `provider` + `external_call_id` 複合UNIQUE、国内PBX enum |
| AI通話要約 | ✅ | ステータス分離、エラー列、キュー用インデックス |
| LINE連携 | ✅ | LineConversation + LineMessage 1:1拡張 |
| メール連携 | ✅ | EmailThread + EmailMessage 1:1拡張 |
| 10万件+ Candidate | ✅ | インデックス強化 + partial UNIQUE（SQL） |
| 複数CA運用 | ✅ | CandidateAssignment PRIMARY/SECONDARY |

**判定: Production Ready**

`add_partial_indexes` マイグレーションで partial index を管理。

---

## マイグレーション手順

```bash
cp .env.example .env
npx prisma migrate dev
npx prisma generate
```
