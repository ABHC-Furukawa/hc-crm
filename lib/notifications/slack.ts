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

export function isImprovementRequestSlackConfigured(): boolean {
  return getImprovementRequestWebhookUrl() != null;
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

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `HC OS 改善提案: ${input.name}`,
      blocks,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Slack webhook failed (${response.status})${body ? `: ${body}` : ""}`
    );
  }
}

function escapeSlack(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
