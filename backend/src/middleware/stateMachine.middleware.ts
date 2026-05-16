import { Response, NextFunction } from 'express';
import { PrismaClient, SheetStatus } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

/**
 * Blocks writes to goals whose sheet is APPROVED unless:
 *   1. Admin override token is present, OR
 *   2. A valid (non-expired) GoalUnlock record exists for the sheet
 */
export async function guardApprovedSheet(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.adminOverride) return next();

  try {
    let sheetId = req.params.sheetId;

    if (!sheetId && req.params.goalId) {
      const goal = await prisma.goal.findUnique({ where: { id: req.params.goalId }, select: { sheetId: true } });
      sheetId = goal?.sheetId ?? '';
    }

    if (!sheetId) return next();

    const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId }, select: { status: true } });
    if (sheet?.status !== SheetStatus.APPROVED) return next();

    // Check for a valid unlock grant
    const unlock = await prisma.goalUnlock.findFirst({
      where: { sheetId, expiresAt: { gt: new Date() } },
    });

    if (unlock) return next();

    return res.status(403).json({
      error: 'Goal sheet is APPROVED. Request an admin unlock to modify.',
    });
  } catch {
    res.status(500).json({ error: 'State machine check failed' });
  }
}
