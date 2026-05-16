import { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const ruleSchema = z.object({
  name: z.string().min(1),
  triggerEvent: z.enum(['GOAL_NOT_SUBMITTED', 'APPROVAL_PENDING', 'ACTUAL_NOT_LOGGED']),
  thresholdDays: z.number().int().min(1).max(365),
  notifyRole: z.nativeEnum(Role),
  isActive: z.boolean().default(true),
});

export async function listRules(req: AuthRequest, res: Response) {
  const rules = await prisma.escalationRule.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(rules);
}

export async function upsertRule(req: AuthRequest, res: Response) {
  const parsed = ruleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const rule = await prisma.escalationRule.upsert({
    where: { name: parsed.data.name },
    update: parsed.data,
    create: parsed.data,
  });
  res.json(rule);
}

export async function deleteRule(req: AuthRequest, res: Response) {
  await prisma.escalationRule.delete({ where: { id: req.params.ruleId } });
  res.status(204).send();
}
