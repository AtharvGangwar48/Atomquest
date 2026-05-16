import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ActivePeriod = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface CycleWindow {
  activePeriod: ActivePeriod;
  cycleYear: number;
  writableQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null; // null during GOAL_SETTING
}

/**
 * Derives the active period from CycleConfig for the given year.
 * Falls back to calendar quarters if no config exists.
 */
export async function getActiveCycle(year?: number): Promise<CycleWindow> {
  const now = new Date();
  const cycleYear = year ?? now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  const config = await prisma.cycleConfig.findUnique({ where: { cycleYear } });

  const gs = config?.goalSettingStart ?? 1;
  const q1 = config?.q1Start ?? 1;
  const q2 = config?.q2Start ?? 4;
  const q3 = config?.q3Start ?? 7;
  const q4 = config?.q4Start ?? 10;

  let activePeriod: ActivePeriod;
  if (month >= q4) activePeriod = 'Q4';
  else if (month >= q3) activePeriod = 'Q3';
  else if (month >= q2) activePeriod = 'Q2';
  else if (month >= q1) activePeriod = 'Q1';
  else if (month >= gs) activePeriod = 'GOAL_SETTING';
  else activePeriod = 'GOAL_SETTING';

  const writableQuarter = activePeriod === 'GOAL_SETTING' ? null : activePeriod as 'Q1' | 'Q2' | 'Q3' | 'Q4';

  return { activePeriod, cycleYear, writableQuarter };
}

/**
 * Returns true if the requested quarter is writable in the current cycle.
 * Admins bypass this check at the controller level.
 */
export function isQuarterWritable(requestedQuarter: string, window: CycleWindow): boolean {
  return window.writableQuarter === requestedQuarter;
}

const QUARTER_ORDER: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

/**
 * Returns quarters that are read-only (already past) vs the current writable one.
 */
export function getPastQuarters(currentQuarter: string | null): string[] {
  if (!currentQuarter) return [];
  const current = QUARTER_ORDER[currentQuarter] ?? 0;
  return Object.keys(QUARTER_ORDER).filter((q) => QUARTER_ORDER[q] < current);
}
