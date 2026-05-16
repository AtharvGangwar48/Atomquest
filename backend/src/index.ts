import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { startEscalationEngine } from './services/escalation.service';

const app = express();

// ── Prisma middleware: auto-audit every goal mutation ─────────────────────────
// Intercepts update/delete on the goals table and writes a diff to audit_log.
// The changedBy field is stored in a per-request context via AsyncLocalStorage.
import { AsyncLocalStorage } from 'async_hooks';

export const auditContext = new AsyncLocalStorage<{ userId: string }>();

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.model === 'Goal' && ['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
    const ctx = auditContext.getStore();
    const userId = ctx?.userId ?? 'system';

    // Fetch old value before mutation
    let oldRecord: object | null = null;
    if (params.action === 'update' && params.args.where?.id) {
      oldRecord = await prisma.goal.findUnique({ where: { id: params.args.where.id } });
    }

    const result = await next(params);

    // Write audit entry
    const entityId = params.args.where?.id ?? 'batch';
    const action = params.action.startsWith('delete') ? 'DELETE' : 'UPDATE';
    await prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId,
        action,
        changedBy: userId,
        oldValue: oldRecord ?? undefined,
        newValue: action === 'DELETE' ? undefined : (params.args.data ?? undefined),
      },
    });

    return result;
  }
  return next(params);
});

export { prisma };

// ── Express app ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Inject userId into AsyncLocalStorage for Prisma middleware
app.use((req: express.Request & { user?: { userId: string } }, _res, next) => {
  const userId = req.user?.userId;
  if (userId) {
    auditContext.run({ userId }, next);
  } else {
    next();
  }
});

app.use('/api', routes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Bot Framework activity endpoint
import { handleBotMessage } from './services/teams.service';
app.post('/api/messages', handleBotMessage);

// Start nightly escalation cron
startEscalationEngine();

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;
