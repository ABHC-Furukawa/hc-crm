# Phase 5 — PBX Webhook 統合

**目的:** 通話自動記録 → 候補者 Communication + Call 自動生成。将来 AI 要約パイプラインの入口。

**前提:** [Phase 4](./phase-4d-handoff.md) 完了（**tenantId** スコープ必須）

**新チャット開始例:**

```
@docs/handoff/phase-5.md に従って Phase 5 を実装してください。
tenant スコープ（tenantId）内でのみ突合・保存すること。
PBX プロバイダは [Twilio / 国内PBX名] を想定してください。
```

---

## スコープ

### チェックリスト
- [ ] `app/api/webhooks/pbx/[provider]/route.ts` — Webhook 受信
- [ ] `lib/pbx/` — プロバイダ別パーサ、署名検証
- [ ] Prisma: `PbxWebhookEvent`（冪等: `provider + externalEventId`）
- [ ] 電話番号 → Candidate 突合（E.164 正規化、`candidate.phone`）
- [ ] `Communication` + `Call` 自動 upsert（既存 1:1 構造）
- [ ] Activity 自動記録（CALL_COMPLETED）
- [ ] UI: 録音 URL、通話時間、ステータス表示
- [ ] （将来）transcript / aiSummary バッチ

### 既存スキーマ活用
- `Call.provider`, `Call.externalCallId`, `@@unique([provider, externalCallId])`
- `Call.recordingUrl`, `transcript`, `aiSummary`, 各種 status enum

### Prisma 追加（予定）
```prisma
enum WebhookEventStatus { RECEIVED, PROCESSED, FAILED, DUPLICATE }

model PbxWebhookEvent {
  id              String
  tenantId        String   // Phase 4: org ではなく tenant
  provider        PbxProvider
  externalEventId String
  payload         Json
  status          WebhookEventStatus
  callId          String?
  @@unique([provider, externalEventId])
}
```

---

## 完了基準

- [ ] PBX Webhook → 候補者 Communication 自動生成（手動ログと同構造）
- [ ] 重複 Webhook を弾く（冪等）
- [ ] tenant スコープ内でのみ突合・保存

---

## 将来（Phase 6 以降）

- LINE / Email 同期（`LineConversation`, `EmailThread` モデル活用）
- AI 通話要約パイプライン
- Company / Application / Tags / Files UI

---

## 参照

- [database-design.md](../database-design.md) — Call / PBX 設計
- [er-diagram.md](../er-diagram.md)
