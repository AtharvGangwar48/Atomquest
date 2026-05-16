import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export async function exportAchievementReport(req: AuthRequest, res: Response) {
  const schema = z.object({
    cycleYear: z.coerce.number().int().optional(),
    managerId: z.string().uuid().optional(),
  });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { cycleYear, managerId } = parsed.data;
  const { userId, role } = req.user!;

  // Build sheet filter based on role
  const sheetWhere: Record<string, unknown> = {};
  if (cycleYear) sheetWhere.cycleYear = cycleYear;
  if (role === 'MANAGER') sheetWhere.employee = { managerId: userId };
  else if (role === 'EMPLOYEE') sheetWhere.employeeId = userId;
  else if (managerId) sheetWhere.employee = { managerId };

  const sheets = await prisma.goalSheet.findMany({
    where: sheetWhere,
    include: {
      employee: { select: { name: true, email: true } },
      goals: {
        include: { actuals: { orderBy: { quarter: 'asc' } } },
      },
    },
    orderBy: [{ cycleYear: 'desc' }, { employee: { name: 'asc' } }],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AtomQuest';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Achievement Report');

  // Header row
  ws.columns = [
    { header: 'Employee', key: 'employee', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Year', key: 'year', width: 8 },
    { header: 'Sheet Status', key: 'sheetStatus', width: 14 },
    { header: 'Thrust Area', key: 'thrustArea', width: 22 },
    { header: 'Goal Title', key: 'title', width: 30 },
    { header: 'UOM', key: 'uom', width: 12 },
    { header: 'Scoring', key: 'scoring', width: 12 },
    { header: 'Target', key: 'target', width: 10 },
    { header: 'Weightage %', key: 'weightage', width: 12 },
    { header: 'Q1 Actual', key: 'q1', width: 12 },
    { header: 'Q1 Score %', key: 'q1score', width: 12 },
    { header: 'Q2 Actual', key: 'q2', width: 12 },
    { header: 'Q2 Score %', key: 'q2score', width: 12 },
    { header: 'Q3 Actual', key: 'q3', width: 12 },
    { header: 'Q3 Score %', key: 'q3score', width: 12 },
    { header: 'Q4 Actual', key: 'q4', width: 12 },
    { header: 'Q4 Score %', key: 'q4score', width: 12 },
    { header: 'Best Score %', key: 'bestScore', width: 13 },
    { header: 'Goal Status', key: 'goalStatus', width: 13 },
  ];

  // Style header
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 20;

  // Data rows
  for (const sheet of sheets) {
    for (const goal of sheet.goals) {
      const byQ = Object.fromEntries(goal.actuals.map((a) => [a.quarter, a]));
      const scores = goal.actuals.map((a) => a.score);
      const bestScore = scores.length ? Math.max(...scores) : 0;

      ws.addRow({
        employee: sheet.employee.name,
        email: sheet.employee.email,
        year: sheet.cycleYear,
        sheetStatus: sheet.status,
        thrustArea: goal.thrustArea,
        title: goal.title,
        uom: goal.uomType,
        scoring: goal.scoringType,
        target: goal.target,
        weightage: goal.weightage,
        q1: byQ['Q1']?.actualValue ?? '',
        q1score: byQ['Q1'] ? Math.round(byQ['Q1'].score * 100) : '',
        q2: byQ['Q2']?.actualValue ?? '',
        q2score: byQ['Q2'] ? Math.round(byQ['Q2'].score * 100) : '',
        q3: byQ['Q3']?.actualValue ?? '',
        q3score: byQ['Q3'] ? Math.round(byQ['Q3'].score * 100) : '',
        q4: byQ['Q4']?.actualValue ?? '',
        q4score: byQ['Q4'] ? Math.round(byQ['Q4'].score * 100) : '',
        bestScore: Math.round(bestScore * 100),
        goalStatus: goal.status,
      });
    }
  }

  // Freeze header, auto-filter
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'T1' };

  // Alternate row shading
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  const filename = `achievement-report-${cycleYear ?? 'all'}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}

export async function getCompletionDashboard(req: AuthRequest, res: Response) {
  const cycleYear = req.query.cycleYear ? Number(req.query.cycleYear) : new Date().getFullYear();
  const { userId, role } = req.user!;

  const sheetWhere: Record<string, unknown> = { cycleYear };
  if (role === 'MANAGER') sheetWhere.employee = { managerId: userId };

  const sheets = await prisma.goalSheet.findMany({
    where: sheetWhere,
    include: {
      employee: { select: { id: true, name: true, email: true } },
      goals: { include: { actuals: true } },
    },
  });

  const summary = sheets.map((sheet) => {
    const totalGoals = sheet.goals.length;
    const completed = sheet.goals.filter((g) => g.status === 'COMPLETED').length;
    const onTrack = sheet.goals.filter((g) => g.status === 'ON_TRACK').length;

    const allActuals = sheet.goals.flatMap((g) => g.actuals);
    const avgScore = allActuals.length
      ? allActuals.reduce((s, a) => s + a.score, 0) / allActuals.length
      : 0;

    return {
      employeeId: sheet.employee.id,
      employeeName: sheet.employee.name,
      employeeEmail: sheet.employee.email,
      sheetId: sheet.id,
      sheetStatus: sheet.status,
      totalGoals,
      completed,
      onTrack,
      pending: totalGoals - completed - onTrack,
      avgScore: Math.round(avgScore * 100),
    };
  });

  // Aggregate totals
  const totals = {
    totalEmployees: summary.length,
    sheetsApproved: summary.filter((s) => s.sheetStatus === 'APPROVED').length,
    sheetsSubmitted: summary.filter((s) => s.sheetStatus === 'SUBMITTED').length,
    sheetsDraft: summary.filter((s) => ['DRAFT', 'REWORK'].includes(s.sheetStatus)).length,
    avgScore: summary.length ? Math.round(summary.reduce((s, e) => s + e.avgScore, 0) / summary.length) : 0,
  };

  res.json({ cycleYear, totals, employees: summary });
}
