# CA CRM — ER Diagram

人材紹介会社向けCA CRMのエンティティ関係図。
**Candidate中心**・**Communication中心**の設計。各チャネルは `Communication` を親とする1:1拡張パターン。

## 設計方針

| 方針 | 実装 |
|------|------|
| Candidate中心 | 主要エンティティはすべて `Candidate` に紐づく |
| Communication中心 | 通話・メール・LINE等は `Communication` を親とし、チャネル別に拡張 |
| 複数CA運用 | `CandidateAssignment` で PRIMARY / SECONDARY 担当を管理 |
| PBX統合 | `Call.provider` + `Call.external_call_id` 複合UNIQUE |
| LINE連携 | `LineConversation` → `LineMessage` → `Communication` |
| メール連携 | `EmailThread` → `EmailMessage` → `Communication` |
| AI通話要約 | `Call.transcript` / `Call.aiSummary` と処理ステータスを分離 |

## ER Diagram

```mermaid
erDiagram
    User ||--o{ Candidate : "createdBy"
    User ||--o{ CandidateAssignment : "assigned"
    User ||--o{ Communication : "handledBy"
    User ||--o{ Task : "assignedTo"
    User ||--o{ Activity : "performedBy"
    User ||--o{ File : "uploadedBy"
    User ||--o{ Note : "authoredBy"
    User ||--o{ Company : "accountManager"
    User ||--o{ CandidateTag : "assignedBy"
    User ||--o{ Call : "answeredBy"

    Candidate ||--o| CandidateJobCase : "has"
    Candidate ||--o{ CandidateAssignment : "has"
    Candidate ||--o{ Communication : "has"
    Candidate ||--o{ LineConversation : "has"
    Candidate ||--o{ EmailThread : "has"
    Candidate ||--o{ Task : "has"
    Candidate ||--o{ Activity : "has"
    Candidate ||--o{ File : "has"
    Candidate ||--o{ Application : "has"
    Candidate ||--o{ Note : "has"
    Candidate ||--o{ CandidateTag : "tagged"

    Tag ||--o{ CandidateTag : "usedIn"

    Company ||--o{ Application : "has"
    Company ||--o{ Note : "has"

    Communication ||--o| Call : "extends"
    Communication ||--o| LineMessage : "extends"
    Communication ||--o| EmailMessage : "extends"
    Communication ||--o{ File : "attachedTo"
    Communication ||--o{ Task : "relatedTo"

    LineConversation ||--o{ LineMessage : "contains"
    EmailThread ||--o{ EmailMessage : "contains"

    Application ||--o{ File : "attachedTo"
    Application ||--o{ Note : "has"

    User {
        uuid id PK
        string authId UK
        string email UK
        string name
        enum role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Candidate {
        uuid id PK
        uuid createdById FK
        string lastName
        string firstName
        string email
        string phone
        string phoneSecondary
        enum status
        enum source
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    CandidateAssignment {
        uuid id PK
        uuid candidateId FK
        uuid userId FK
        enum role "PRIMARY | SECONDARY"
        datetime assignedAt
        datetime unassignedAt
    }

    CandidateJobCase {
        uuid id PK
        uuid candidateId FK UK
        string entryJobName
        string dispatchCompanyName
        int referralFee
        datetime interviewPrepAt
        datetime interviewAt
        date factoryTourAt
        date offerAcceptedAt
        date scheduledJoinAt
    }

    Company {
        uuid id PK
        uuid accountManagerId FK
        string name UK
        enum industry
        enum status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Tag {
        uuid id PK
        string name UK
        enum category
        string color
        datetime createdAt
        datetime updatedAt
    }

    CandidateTag {
        uuid candidateId FK PK
        uuid tagId FK PK
        uuid assignedById FK
        datetime assignedAt
    }

    Note {
        uuid id PK
        uuid candidateId FK
        uuid authorId FK
        enum type
        text content
        boolean isPinned
        datetime createdAt
        datetime updatedAt
    }

    Communication {
        uuid id PK
        uuid candidateId FK
        uuid userId FK
        enum channel
        enum direction
        string subject
        text body
        enum status
        datetime occurredAt
        datetime createdAt
        datetime updatedAt
    }

    Call {
        uuid id PK
        uuid communicationId FK UK
        enum provider
        string external_call_id
        uuid parentCallId FK
        string fromNumber
        string toNumber
        enum callStatus
        uuid answeredByUserId FK
        text transcript
        text aiSummary
        json pbxMetadata
        datetime startedAt
        datetime endedAt
    }

    LineConversation {
        uuid id PK
        uuid candidateId FK
        string lineChannelId
        string lineUserId
        enum status
        datetime lastMessageAt
        int unreadCount
    }

    LineMessage {
        uuid id PK
        uuid lineConversationId FK
        uuid communicationId FK UK
        string externalMessageId
        enum messageType
        string replyToken
        json rawPayload
    }

    EmailThread {
        uuid id PK
        uuid candidateId FK
        string subject
        string externalThreadId
        datetime lastMessageAt
    }

    EmailMessage {
        uuid id PK
        uuid emailThreadId FK
        uuid communicationId FK UK
        string messageId UK
        string fromAddress
        array toAddresses
        text htmlBody
    }

    Task {
        uuid id PK
        uuid candidateId FK
        uuid assignedToId FK
        string title
        enum status
        enum priority
        datetime dueAt
    }

    Activity {
        uuid id PK
        uuid candidateId FK
        uuid userId FK
        enum action
        enum entityType
        uuid entityId
        json metadata
        datetime occurredAt
    }

    File {
        uuid id PK
        uuid candidateId FK
        string storagePath UK
        enum category
    }

    Application {
        uuid id PK
        uuid candidateId FK
        uuid companyId FK
        string jobTitle
        enum status
    }
```

## リレーション概要

```
User ──CandidateAssignment──▶ Candidate ◀─── すべての業務データの中心
         (PRIMARY/SECONDARY)      │
                                  ├── Communication ──1:1──▶ Call        (PBX / AI)
                                  │                 ──1:1──▶ LineMessage ──▶ LineConversation
                                  │                 ──1:1──▶ EmailMessage ──▶ EmailThread
                                  ├── Task / Activity / File / Note
                                  ├── Application ──▶ Company
                                  └── CandidateTag ──▶ Tag
```

## Communication チャネル拡張

```
Communication (共通ハブ)
  ├── Call         (PBX: provider + external_call_id)
  ├── LineMessage  (LINE Messaging API)
  └── EmailMessage (RFC 5322 / Gmail API)
```

## 複数CA運用 — CandidateAssignment

| role | 説明 |
|------|------|
| `PRIMARY` | 主担当CA（候補者1人につき現役1名 — partial UNIQUE） |
| `SECONDARY` | 副担当CA（複数可） |

`unassignedAt IS NULL` が現役担当。引継ぎ履歴を保持。

## PBX統合 — Call テーブル

| カラム | 用途 |
|--------|------|
| `provider` | PBXプロバイダ（Twilio, Miitel, Biztel 等） |
| `external_call_id` | Webhook 冪等キー |
| `(provider, external_call_id)` | 複合UNIQUE — プロバイダ跨ぎID衝突防止 |
| `parentCallId` | 転送・内線の親通話 |
| `answeredByUserId` | 応答したCA |
| `pbxMetadata` | プロバイダ固有 JSON |

## LINE連携

```
Candidate ──▶ LineConversation (lineChannelId + lineUserId)
                    └── LineMessage ──1:1── Communication
```

| カラム | 用途 |
|--------|------|
| `lineChannelId` | 公式アカウント識別（複数アカウント対応） |
| `lineUserId` | LINE ユーザーID — Webhook 突合 |
| `externalMessageId` | メッセージ冪等キー |
| `replyToken` | 返信API用（短期TTL） |

## メール連携

```
Candidate ──▶ EmailThread (subject / externalThreadId)
                    └── EmailMessage ──1:1── Communication
```

| カラム | 用途 |
|--------|------|
| `messageId` | RFC 5322 Message-ID（スレッド・重複排除） |
| `inReplyTo` | 返信チェーン |
| `externalThreadId` | Gmail/Outlook thread ID |
| `htmlBody` | リッチメール表示 |
