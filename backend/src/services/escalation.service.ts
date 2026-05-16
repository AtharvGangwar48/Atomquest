import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEscalationNotification } from './teams.service';

const prisma = new PrismaClient();

type EscalationEvent = 'GOAL_NOT_SUBMITTED' | 'APPROVAL_PENDING' | 'ACTUAL_NOT_LOGGED';

async function runEscalations() {
  const rules = await prisma.escalationRule.findMany({ where: { isActive: true } });
  if (!rules.length) return;

  const now = new Date();

  for (const rule of rules) {
    const cutoff = new Date(now.getTime() - rule.thresholdDays * 86_400_000);

    switch (rule.triggerEvent as EscalationEvent) {
      case 'GOAL_NOT_SUBMITTED': {
        // Employees with DRAFT sheets older than threshold
        const sheets = await prisma.goalSheet.findMany({
          where: { status: 'DRAFT', createdAt: { lt: cutoff } },
          include: { employee: { select: { id: true, name: true, email: true, manager: { select: { id: true } } } } },
        });

        for (const sheet of sheets) {
          const msg = `${sheet.employee.name} has not submitted their ${sheet.cycleYear} goal sheet. Sheet created ${sheet.createdAt.toDateString()}.`;
          await logAndNotify(rule.id, sheet.employee.id, msg, rule.notifyRole);
        }
        break;
      }

      case 'APPROVAL_PENDING': {
        // Submitted sheets waiting longer than threshold
        const sheets = await prisma.goalSheet.findMany({
          where: { status: 'SUBMITTED', updatedAt: { lt: cutoff } },
          include: {
            employee: {
              select: { id: true, name: true, manager: { select: { id: true } } },
            },
          },
        });

        for (const sheet of sheets) {
          const managerId = sheet.employee.manager?.id;
          if (!managerId) continue;
          const msg = `${sheet.employee.name}'s ${sheet.cycleYear} goal sheet has been awaiting approval for over ${rule.thresholdDays} days.`;
          await logAndNotify(rule.id, managerId, msg, rule.notifyRole);
        }
        break;
      }

      case 'ACTUAL_NOT_LOGGED': {
        // APPROVED sheets with no actuals logged in the current quarter
        const currentQuarter = getCurrentQuarter();
        const sheets = await prisma.goalSheet.findMany({
          where: { status: 'APPROVED' },
          include: {
            employee: { select: { id: true, name: true } },
            goals: { include: { actuals: { where: { quarter: currentQuarter } } } },
          },
        });

        for (const sheet of sheets) {
          const hasActuals = sheet.goals.some((g) => g.actuals.length > 0);
          if (!hasActuals && sheet.updatedAt < cutoff) {
            const msg = `${sheet.employee.name} has not logged any ${currentQuarter} actuals for their ${sheet.cycleYear} goals.`;
            await logAndNotify(rule.id, sheet.employee.id, msg, rule.notifyRole);
          }
        }
        break;
      }
    }
  }
}

async function logAndNotify(ruleId: string, userId: string, message: string, _notifyRole: string) {
  // Deduplicate: skip if already logged today for same rule+user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.escalationLog.findFirst({
    where: { ruleId, userId, sentAt: { gte: today } },
  });
  if (existing) return;

  await prisma.escalationLog.create({
    data: { ruleId, userId, message, channel: 'TEAMS' },
  });

  const webhook = process.env.TEAMS_ESCALATION_WEBHOOK ?? '';
  await sendEscalationNotification(webhook, message);
}

function getCurrentQuarter(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 'Q1';
  if (m <= 6) return 'Q2';
  if (m <= 9) return 'Q3';
  return 'Q4';
}

/**
 * Registers the nightly cron job. Call once at app startup.
 * Runs at 02:00 every night.
 */
export function startEscalationEngine() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[Escalation] Running nightly escalation check…');
    try {
      await runEscalations();
      console.log('[Escalation] Done.');
    } catch (err) {
      console.error('[Escalation] Error:', err);
    }
  });
  console.log('[Escalation] Engine scheduled (02:00 nightly).');
}
