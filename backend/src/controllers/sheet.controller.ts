import { Response } from 'express';
import { PrismaClient, SheetStatus } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { writeAudit } from '../services/audit.service';
import { computeWeightedScore, buildScoringInput } from '../services/scoring.service';
import { notifyManagerSheetSubmitted } from '../services/teams.service';

const prisma = new PrismaClient();

const VALID_TRANSITIONS: Record<SheetStatus, SheetStatus[]> = {
  DRAFT: [SheetStatus.SUBMITTED],
  SUBMITTED: [SheetStatus.APPROVED, SheetStatus.REWORK],
  APPROVED: [],
  REWORK: [SheetStatus.SUBMITTED],
};

export async function createSheet(req: AuthRequest, res: Response) {
  const schema = z.object({ cycleYear: z.number().int().min(2020).max(2100) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const employeeId = req.user!.userId;
  const sheet = await prisma.goalSheet.create({
    data: { employeeId, cycleYear: parsed.data.cycleYear },
  });
  await writeAudit('GoalSheet', sheet.id, employeeId, null, sheet);
  res.status(201).json(sheet);
}

export async function getMySheets(req: AuthRequest, res: Response) {
  const sheets = await prisma.goalSheet.findMany({
    where: { employeeId: req.user!.userId },
    include: { goals: { include: { actuals: true } } },
    orderBy: { cycleYear: 'desc' },
  });
  res.json(sheets);
}

export async function getSheetById(req: AuthRequest, res: Response) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: req.params.sheetId },
    include: { goals: { include: { actuals: true } }, checkinComments: true, employee: { select: { id: true, name: true, email: true } } },
  });
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

  // Employees can only see their own; managers see their reports'
  const { userId, role } = req.user!;
  if (role === 'EMPLOYEE' && sheet.employeeId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (role === 'MANAGER') {
    const report = await prisma.user.findFirst({ where: { id: sheet.employeeId, managerId: userId } });
    if (!report) return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(sheet);
}

export async function transitionSheet(req: AuthRequest, res: Response) {
  const schema = z.object({ status: z.nativeEnum(SheetStatus) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const sheet = await prisma.goalSheet.findUnique({ where: { id: req.params.sheetId } });
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

  const allowed = VALID_TRANSITIONS[sheet.status];
  if (!allowed.includes(parsed.data.status)) {
    return res.status(400).json({ error: `Cannot transition from ${sheet.status} to ${parsed.data.status}` });
  }

  // Only manager/admin can approve or send to rework
  const { role, userId } = req.user!;
  const managerOnlyStatuses: SheetStatus[] = [SheetStatus.APPROVED, SheetStatus.REWORK];
  if (managerOnlyStatuses.includes(parsed.data.status) && role === 'EMPLOYEE') {
    return res.status(403).json({ error: 'Only managers can approve or request rework' });
  }

  const updated = await prisma.goalSheet.update({
    where: { id: req.params.sheetId },
    data: { status: parsed.data.status },
  });
  await writeAudit('GoalSheet', sheet.id, userId, { status: sheet.status }, { status: parsed.data.status });

  // Fire Teams notification when employee submits for approval
  if (parsed.data.status === SheetStatus.SUBMITTED) {
    const fullSheet = await prisma.goalSheet.findUnique({
      where: { id: req.params.sheetId },
      include: {
        employee: { select: { name: true, manager: { select: { id: true } } } },
        goals: true,
      },
    });
    const managerWebhook = process.env.TEAMS_MANAGER_WEBHOOK ?? '';
    if (fullSheet && managerWebhook) {
      notifyManagerSheetSubmitted({
        managerWebhook,
        employeeName: fullSheet.employee.name,
        cycleYear: fullSheet.cycleYear,
        sheetId: fullSheet.id,
        goalCount: fullSheet.goals.length,
      }).catch((e) => console.error('[Teams]', e));
    }
  }

  res.json(updated);
}

export async function getTeamSheets(req: AuthRequest, res: Response) {
  const { userId, role } = req.user!;
  const where = role === 'ADMIN' ? {} : { employee: { managerId: userId } };

  const sheets = await prisma.goalSheet.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true } },
      goals: { include: { actuals: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(sheets);
}

export async function getSheetScore(req: AuthRequest, res: Response) {
  const sheet = await prisma.goalSheet.findUnique({
    where: { id: req.params.sheetId },
    include: { goals: { include: { actuals: true } } },
  });
  if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

  const quarter = req.query.quarter as string | undefined;

  const goalsWithActuals = sheet.goals.map((g) => {
    const actualEntry = quarter
      ? g.actuals.find((a) => a.quarter === quarter)
      : g.actuals.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
    return {
      scoringType: g.scoringType,
      target: g.target,
      actual: actualEntry?.actualValue ?? 0,
      weightage: g.weightage,
      deadline: g.deadline,
      completedDate: actualEntry?.completedDate ?? null,
    };
  });

  const score = computeWeightedScore(goalsWithActuals);
  res.json({ score, percentage: Math.round(score * 100) });
}
