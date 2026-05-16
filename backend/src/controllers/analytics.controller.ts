import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

// Use read replica if configured, otherwise reuse the primary client
import { prisma as primaryDb } from '../index';

function getAnalyticsDb() {
  const readUrl = process.env.DATABASE_READ_URL;
  if (readUrl && readUrl.trim() !== '') {
    return new PrismaClient({ datasources: { db: { url: readUrl } } });
  }
  return primaryDb;
}

export async function getQoQTrends(req: AuthRequest, res: Response) {
  const cycleYear = req.query.cycleYear ? Number(req.query.cycleYear) : new Date().getFullYear();
  const { userId, role } = req.user!;

  const sheetWhere: Record<string, unknown> = { cycleYear, status: 'APPROVED' };
  if (role === 'MANAGER') sheetWhere.employee = { managerId: userId };
  else if (role === 'EMPLOYEE') sheetWhere.employeeId = userId;

  const sheets = await getAnalyticsDb().goalSheet.findMany({
    where: sheetWhere,
    include: { goals: { include: { actuals: true } } },
  });

  // Pivot: for each quarter, compute average weighted score across all sheets
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
  const trends = quarters.map((q) => {
    const sheetScores: number[] = [];

    for (const sheet of sheets) {
      const totalWeight = sheet.goals.reduce((s, g) => s + g.weightage, 0);
      if (totalWeight === 0) continue;

      const weighted = sheet.goals.reduce((s, g) => {
        const actual = g.actuals.find((a) => a.quarter === q);
        return s + (actual?.score ?? 0) * g.weightage;
      }, 0);

      sheetScores.push(weighted / totalWeight);
    }

    const avg = sheetScores.length
      ? sheetScores.reduce((s, v) => s + v, 0) / sheetScores.length
      : 0;

    return { quarter: q, avgScore: Math.round(avg * 100), count: sheetScores.length };
  });

  res.json({ cycleYear, trends });
}

export async function getCompletionHeatmap(req: AuthRequest, res: Response) {
  const cycleYear = req.query.cycleYear ? Number(req.query.cycleYear) : new Date().getFullYear();
  const { userId, role } = req.user!;

  const sheetWhere: Record<string, unknown> = { cycleYear };
  if (role === 'MANAGER') sheetWhere.employee = { managerId: userId };

  const sheets = await getAnalyticsDb().goalSheet.findMany({
    where: sheetWhere,
    include: { goals: { include: { actuals: true } } },
  });

  // Group by thrustArea × quarter → avg score
  const map: Record<string, Record<string, number[]>> = {};

  for (const sheet of sheets) {
    for (const goal of sheet.goals) {
      if (!map[goal.thrustArea]) map[goal.thrustArea] = {};
      for (const actual of goal.actuals) {
        if (!map[goal.thrustArea][actual.quarter]) map[goal.thrustArea][actual.quarter] = [];
        map[goal.thrustArea][actual.quarter].push(actual.score);
      }
    }
  }

  const heatmap = Object.entries(map).map(([thrustArea, quarters]) => ({
    thrustArea,
    ...Object.fromEntries(
      Object.entries(quarters).map(([q, scores]) => [
        q,
        Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100),
      ])
    ),
  }));

  res.json({ cycleYear, heatmap });
}

export async function getUomBreakdown(req: AuthRequest, res: Response) {
  const cycleYear = req.query.cycleYear ? Number(req.query.cycleYear) : new Date().getFullYear();
  const { userId, role } = req.user!;

  const sheetWhere: Record<string, unknown> = { cycleYear };
  if (role === 'MANAGER') sheetWhere.employee = { managerId: userId };
  else if (role === 'EMPLOYEE') sheetWhere.employeeId = userId;

  const goals = await getAnalyticsDb().goal.findMany({
    where: { sheet: sheetWhere },
    select: { uomType: true, scoringType: true, status: true },
  });

  // UoM distribution
  const uomCounts: Record<string, number> = {};
  const scoringCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};

  for (const g of goals) {
    uomCounts[g.uomType] = (uomCounts[g.uomType] ?? 0) + 1;
    scoringCounts[g.scoringType] = (scoringCounts[g.scoringType] ?? 0) + 1;
    statusCounts[g.status] = (statusCounts[g.status] ?? 0) + 1;
  }

  const toSlices = (counts: Record<string, number>) =>
    Object.entries(counts).map(([name, value]) => ({ name, value }));

  res.json({
    cycleYear,
    totalGoals: goals.length,
    uomBreakdown: toSlices(uomCounts),
    scoringBreakdown: toSlices(scoringCounts),
    statusBreakdown: toSlices(statusCounts),
  });
}

export async function getEscalationLogs(req: AuthRequest, res: Response) {
  const logs = await getAnalyticsDb().escalationLog.findMany({
    include: {
      rule: { select: { name: true, triggerEvent: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { sentAt: 'desc' },
    take: 100,
  });
  res.json(logs);
}
