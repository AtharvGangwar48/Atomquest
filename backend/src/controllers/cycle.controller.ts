import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { getActiveCycle } from '../services/cycle.service';

const prisma = new PrismaClient();

export async function getCurrentCycle(req: AuthRequest, res: Response) {
  const year = req.query.year ? Number(req.query.year) : undefined;
  const cycle = await getActiveCycle(year);
  res.json(cycle);
}

export async function upsertCycleConfig(req: AuthRequest, res: Response) {
  const schema = z.object({
    cycleYear: z.number().int().min(2020).max(2100),
    goalSettingStart: z.number().int().min(1).max(12).optional(),
    q1Start: z.number().int().min(1).max(12).optional(),
    q2Start: z.number().int().min(1).max(12).optional(),
    q3Start: z.number().int().min(1).max(12).optional(),
    q4Start: z.number().int().min(1).max(12).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { cycleYear, ...rest } = parsed.data;
  const config = await prisma.cycleConfig.upsert({
    where: { cycleYear },
    update: rest,
    create: { cycleYear, ...rest },
  });
  res.json(config);
}

export async function getCycleConfigs(req: AuthRequest, res: Response) {
  const configs = await prisma.cycleConfig.findMany({ orderBy: { cycleYear: 'desc' } });
  res.json(configs);
}
