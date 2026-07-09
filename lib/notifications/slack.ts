type SlackTextObject = {
  type: "mrkdwn" | "plain_text";
  text: string;
};

type SlackBlock = {
  type: "header" | "section" | "divider";
  text?: SlackTextObject;
  fields?: SlackTextObject[];
};

function getImprovementRequestWebhookUrl(): string | null {
  const url = process.env.IMPROVEMENT_REQUEST_SLACK_WEBHOOK_URL?.trim();
  return url || null;
}

function getSyncWebhookUrl(): string | null {
  const url = process.env.SYNC_SLACK_WEBHOOK_URL?.trim();
  return url || null;
}

export function isImprovementRequestSlackConfigured(): boolean {
  return getImprovementRequestWebhookUrl() != null;
}

export function isSyncSlackConfigured(): boolean {
  return getSyncWebhookUrl() != null;
}

async function postSlackWebhook(
  webhookUrl: string,
  payload: { text: string; blocks?: SlackBlock[] }
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Slack webhook failed (${response.status})${body ? `: ${body}` : ""}`
    );
  }
}

export async function notifyImprovementRequestToSlack(input: {
  name: string;
  priorityLabel: string;
  description: string;
  submitterName: string;
  submitterEmail: string;
  tenantName: string;
  createdAt: Date;
}): Promise<void> {
  const webhookUrl = getImprovementRequestWebhookUrl();
  if (!webhookUrl) return;

  const createdAtLabel = input.createdAt.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "HC OS — 改善・要望提案",
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*名前*\n${escapeSlack(input.name)}` },
        { type: "mrkdwn", text: `*優先度*\n${escapeSlack(input.priorityLabel)}` },
        { type: "mrkdwn", text: `*投稿者*\n${escapeSlack(input.submitterName)}` },
        { type: "mrkdwn", text: `*テナント*\n${escapeSlack(input.tenantName)}` },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*改善項目*\n${escapeSlack(input.description)}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*投稿者メール*\n${escapeSlack(input.submitterEmail)}\n*投稿日時*\n${createdAtLabel}`,
      },
    },
  ];

  await postSlackWebhook(webhookUrl, {
    text: `HC OS 改善提案: ${input.name}`,
    blocks,
  });
}

export async function notifyJobSyncToSlack(input: {
  displayName: string;
  companyKey: string;
  importedCount: number;
  successCount: number;
  failedCount: number;
  skippedClosedCount?: number;
}): Promise<void> {
  const webhookUrl = getSyncWebhookUrl();
  if (!webhookUrl) return;

  const finishedAt = formatJstNow();
  const statusLabel =
    input.failedCount > 0 ? "一部失敗" : input.importedCount > 0 ? "完了" : "完了（変更なし）";

  const fields: SlackTextObject[] = [
    { type: "mrkdwn", text: `*会社*\n${escapeSlack(input.displayName)}` },
    { type: "mrkdwn", text: `*ステータス*\n${statusLabel}` },
    { type: "mrkdwn", text: `*取込件数*\n${input.importedCount} 件` },
    { type: "mrkdwn", text: `*成功 / 失敗*\n${input.successCount} / ${input.failedCount}` },
  ];

  if (input.skippedClosedCount && input.skippedClosedCount > 0) {
    fields.push({
      type: "mrkdwn",
      text: `*募集終了スキップ*\n${input.skippedClosedCount} 件`,
    });
  }

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "HC OS — 案件同期" },
    },
    { type: "section", fields },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*完了日時*\n${finishedAt}\n*companyKey*\n${escapeSlack(input.companyKey)}`,
      },
    },
  ];

  await postSlackWebhook(webhookUrl, {
    text: `HC OS 案件同期${statusLabel}: ${input.displayName}`,
    blocks,
  });
}

export async function notifyCallLeadSyncToSlack(input: {
  importedCount: number;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  outOfScopeCount: number;
  skippedCount: number;
  failedCount: number;
  syncWindowLabel?: string | null;
}): Promise<void> {
  const webhookUrl = getSyncWebhookUrl();
  if (!webhookUrl) return;

  const finishedAt = formatJstNow();
  const statusLabel = input.failedCount > 0 ? "一部失敗" : "完了";

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "HC OS — 架電リスト同期" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*ステータス*\n${statusLabel}` },
        { type: "mrkdwn", text: `*取込件数*\n${input.importedCount} 件` },
        { type: "mrkdwn", text: `*新規 / 更新*\n${input.createdCount} / ${input.updatedCount}` },
        {
          type: "mrkdwn",
          text: `*重複 / 対象外 / スキップ*\n${input.duplicateCount} / ${input.outOfScopeCount} / ${input.skippedCount}`,
        },
        { type: "mrkdwn", text: `*失敗*\n${input.failedCount} 件` },
        { type: "mrkdwn", text: `*完了日時*\n${finishedAt}` },
      ],
    },
  ];

  if (input.syncWindowLabel) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*同期範囲*\n${escapeSlack(input.syncWindowLabel)}`,
      },
    });
  }

  await postSlackWebhook(webhookUrl, {
    text: `HC OS 架電リスト同期${statusLabel}（取込 ${input.importedCount} 件）`,
    blocks,
  });
}

export async function notifyCallLeadSyncFailedToSlack(error: string): Promise<void> {
  const webhookUrl = getSyncWebhookUrl();
  if (!webhookUrl) return;

  await postSlackWebhook(webhookUrl, {
    text: "HC OS 架電リスト同期失敗",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "HC OS — 架電リスト同期失敗" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*エラー*\n${escapeSlack(error)}\n*日時*\n${formatJstNow()}`,
        },
      },
    ],
  });
}

function formatJstNow(): string {
  return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

function escapeSlack(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
