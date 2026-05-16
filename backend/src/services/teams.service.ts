import { BotFrameworkAdapter, TurnContext, Activity } from 'botbuilder';
import axios from 'axios';

export const botAdapter = new BotFrameworkAdapter({
  appId: process.env.TEAMS_BOT_APP_ID ?? '',
  appPassword: process.env.TEAMS_BOT_APP_PASSWORD ?? '',
});

/**
 * Builds an Adaptive Card for goal sheet submission notification.
 * Includes a deep-link button that opens the portal to the specific sheet.
 */
function buildSubmissionCard(payload: {
  employeeName: string;
  cycleYear: number;
  sheetId: string;
  goalCount: number;
  portalUrl: string;
}): object {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          { type: 'TextBlock', text: '📋 Goal Sheet Submitted', weight: 'Bolder', size: 'Medium' },
        ],
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Employee', value: payload.employeeName },
          { title: 'Cycle Year', value: String(payload.cycleYear) },
          { title: 'Goals', value: String(payload.goalCount) },
          { title: 'Status', value: 'Awaiting your approval' },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Review Sheet',
        url: `${payload.portalUrl}/team?sheet=${payload.sheetId}`,
        style: 'positive',
      },
    ],
  };
}

/**
 * Sends an Adaptive Card to a Teams channel via incoming webhook.
 * Falls back gracefully if webhook URL is not configured.
 */
export async function sendTeamsNotification(
  webhookUrl: string,
  card: object
): Promise<void> {
  if (!webhookUrl) return;
  await axios.post(webhookUrl, {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: card,
      },
    ],
  });
}

/**
 * Notifies a manager when their report submits a goal sheet.
 */
export async function notifyManagerSheetSubmitted(payload: {
  managerWebhook: string;
  employeeName: string;
  cycleYear: number;
  sheetId: string;
  goalCount: number;
}) {
  const card = buildSubmissionCard({
    ...payload,
    portalUrl: process.env.PORTAL_URL ?? 'http://localhost:5173',
  });
  await sendTeamsNotification(payload.managerWebhook, card);
}

/**
 * Sends a plain-text escalation notification to a Teams webhook.
 */
export async function sendEscalationNotification(webhookUrl: string, message: string): Promise<void> {
  if (!webhookUrl) return;
  const card = {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.4',
    body: [
      { type: 'TextBlock', text: '⚠️ Escalation Alert', weight: 'Bolder', color: 'Attention' },
      { type: 'TextBlock', text: message, wrap: true },
    ],
  };
  await sendTeamsNotification(webhookUrl, card);
}

/**
 * Express handler for Bot Framework activity endpoint (/api/messages).
 * Required for the bot to receive replies/interactions from Teams.
 */
export async function handleBotMessage(req: import('express').Request, res: import('express').Response) {
  await botAdapter.processActivity(req, res, async (context: TurnContext) => {
    // Echo handler — extend for interactive card responses
    if (context.activity.type === 'message') {
      await context.sendActivity(`Received: ${context.activity.text}`);
    }
  });
}
