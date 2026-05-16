import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { writeAudit } from '../services/audit.service';

const prisma = new PrismaClient();

export async function unlockSheet(req: AuthRequest, res: Response) {
  const schema = z.object({
    justification: z.string().min(10, 'Justification must be at least 10 characters'),
    expiresInHours: z.number().int().min(1).max(168).default(24),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.sheetId } });
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 3_600_000);

  const unlock = await prisma.goalUnlock.create({
    data: {
      sheetId: req.params.sheetId,
      grantedBy: req.user!.userId,
      justification: parsed.data.justification,
      expiresAt,
    },
    include: { admin: { select: { name: true } } },
  });

  await writeAudit('GoalSheet', sheet.id, req.user!.userId, { status: sheet.status }, { unlocked: true, expiresAt }, 'UPDATE');

  res.status(201).json(unlock);
}

export async function getSheetUnlocks(req: AuthRequest, res: Response) {
  const unlocks = await prisma.goalUnlock.findMany({
    where: { sheetId: req.params.sheetId },
    include: { admin: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(unlocks);
}

export async function getAuditTrail(req: AuthRequest, res: Response) {
  const schema = z.object({
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { entityType, entityId, page, limit } = parsed.data;
  const where = {
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { changer: { select: { name: true, email: true, role: true } } },
      orderBy: { changedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ total, page, limit, pages: Math.ceil(total / limit), logs });
}

export async function getAllUsers(req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, managerId: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}
