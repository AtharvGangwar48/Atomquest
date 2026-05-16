import { Response } from 'express';
import { PrismaClient, GoalStatus, ScoringType } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { writeAudit } from '../services/audit.service';
import { getActiveCycle, isQuarterWritable } from '../services/cycle.service';
import { buildScoringInput, computeScore } from '../services/scoring.service';

const prisma = new PrismaClient();

const goalSchema = z.object({
  thrustArea: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  uomType: z.enum(['PERCENTAGE', 'NUMBER', 'CURRENCY', 'BOOLEAN']),
  scoringType: z.nativeEnum(ScoringType).default(ScoringType.MAX),
  target: z.number().positive(),
  deadline: z.string().datetime().optional(),
  weightage: z.number().positive().max(100),
  isShared: z.boolean().default(false),
  sharedOwnerId: z.string().uuid().optional(),
});

async function validateWeightage(sheetId: string, weightage: number, excludeGoalId?: string): Promise<boolean> {
  const goals = await prisma.goal.findMany({
    where: { sheetId, ...(excludeGoalId ? { NOT: { id: excludeGoalId } } : {}) },
  });
  return goals.reduce((s, g) => s + g.weightage, 0) + weightage <= 100;
}

export async function createGoal(req: AuthRequest, res: Response) {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { sheetId } = req.params;
  if (!(await validateWeightage(sheetId, parsed.data.weightage))) {
    return res.status(400).json({ error: 'Total weightage would exceed 100%' });
  }

  const { deadline, ...rest } = parsed.data;
  const goal = await prisma.goal.create({
    data: { ...rest, sheetId, ...(deadline ? { deadline: new Date(deadline) } : {}) },
  });
  await writeAudit('Goal', goal.id, req.user!.userId, null, goal);
  res.status(201).json(goal);
}

export async function updateGoal(req: AuthRequest, res: Response) {
  const parsed = goalSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
  if (!existing) return res.status(404).json({ error: 'Goal not found' });

  if (parsed.data.weightage !== undefined) {
    if (!(await validateWeightage(existing.sheetId, parsed.data.weightage, req.params.goalId))) {
      return res.status(400).json({ error: 'Total weightage would exceed 100%' });
    }
  }

  const { deadline, ...rest } = parsed.data;
  const updated = await prisma.goal.update({
    where: { id: req.params.goalId },
    data: { ...rest, ...(deadline ? { deadline: new Date(deadline) } : {}) },
  });
  await writeAudit('Goal', updated.id, req.user!.userId, existing, updated);
  res.json(updated);
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId } });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  await prisma.goal.delete({ where: { id: req.params.goalId } });
  await writeAudit('Goal', goal.id, req.user!.userId, goal, null);
  res.status(204).send();
}

export async function logActual(req: AuthRequest, res: Response) {
  const schema = z.object({
    quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
    actualValue: z.number().min(0),
    completedDate: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId }, include: { sheet: true } });
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  // Cycle gate — admins bypass
  if (!req.adminOverride && req.user?.role !== 'ADMIN') {
    const cycle = await getActiveCycle(goal.sheet.cycleYear);
    if (!isQuarterWritable(parsed.data.quarter, cycle)) {
      return res.status(403).json({
        error: `Quarter ${parsed.data.quarter} is not writable. Current period: ${cycle.activePeriod}`,
      });
    }
  }

  // Compute score server-side before persisting
  const completedDate = parsed.data.completedDate ? new Date(parsed.data.completedDate) : undefined;
  const scoreValue = computeScore(
    buildScoringInput({
      scoringType: goal.scoringType,
      target: goal.target,
      actual: parsed.data.actualValue,
      deadline: goal.deadline,
      completedDate: completedDate ?? null,
    })
  );

  const actual = await prisma.goalActual.upsert({
    where: { goalId_quarter: { goalId: req.params.goalId, quarter: parsed.data.quarter } },
    update: { actualValue: parsed.data.actualValue, score: scoreValue, loggedAt: new Date(), ...(completedDate ? { completedDate } : {}) },
    create: { goalId: req.params.goalId, quarter: parsed.data.quarter, actualValue: parsed.data.actualValue, score: scoreValue, ...(completedDate ? { completedDate } : {}) },
  });

  // Fan out to shared goals
  if (goal.isShared && goal.sharedOwnerId) {
    const linked = await prisma.goal.findMany({
      where: { sharedOwnerId: goal.sharedOwnerId, id: { not: goal.id } },
    });
    await Promise.all(
      linked.map((lg) =>
        prisma.goalActual.upsert({
          where: { goalId_quarter: { goalId: lg.id, quarter: parsed.data.quarter } },
          update: { actualValue: parsed.data.actualValue, score: scoreValue, loggedAt: new Date() },
          create: { goalId: lg.id, quarter: parsed.data.quarter, actualValue: parsed.data.actualValue, score: scoreValue },
        })
      )
    );
  }

  // Auto-update goal status based on best quarter score
  const allActuals = await prisma.goalActual.findMany({ where: { goalId: req.params.goalId } });
  const bestScore = Math.max(...allActuals.map((a) => a.score));
  const newStatus: GoalStatus = bestScore >= 1 ? GoalStatus.COMPLETED : GoalStatus.ON_TRACK;
  await prisma.goal.update({ where: { id: req.params.goalId }, data: { status: newStatus } });

  res.json({ ...actual, score: scoreValue });
}

export async function updateGoalStatus(req: AuthRequest, res: Response) {
  const schema = z.object({ status: z.nativeEnum(GoalStatus) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.goal.update({
    where: { id: req.params.goalId },
    data: { status: parsed.data.status },
  });
  res.json(updated);
}

export async function getQuarterlyProgress(req: AuthRequest, res: Response) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: req.params.sheetId },
    include: { goals: { include: { actuals: { orderBy: { quarter: 'asc' } } } } },
  });
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

  const cycle = await getActiveCycle(sheet.cycleYear);

  const rows = sheet.goals.map((g) => {
    const byQuarter = Object.fromEntries(g.actuals.map((a) => [a.quarter, { value: a.actualValue, score: a.score }]));
    return {
      goalId: g.id,
      title: g.title,
      thrustArea: g.thrustArea,
      uomType: g.uomType,
      scoringType: g.scoringType,
      target: g.target,
      weightage: g.weightage,
      status: g.status,
      actuals: byQuarter,
    };
  });

  res.json({ rows, activePeriod: cycle.activePeriod, writableQuarter: cycle.writableQuarter });
}
