import { ScoringType } from '@prisma/client';

export type ScoringInput =
  | { type: 'MIN'; target: number; actual: number }
  | { type: 'MAX'; target: number; actual: number }
  | { type: 'TIMELINE'; deadline: Date; completed: Date }
  | { type: 'ZERO'; actual: number };

/**
 * Pure function — returns 0–1 score.
 * MIN: lower actual is better (e.g. defect count)
 * MAX: higher actual is better (e.g. revenue)
 * TIMELINE: completed on/before deadline = 1, else proportional penalty
 * ZERO: any non-zero actual = 0 (e.g. zero-incident target)
 */
export function computeScore(input: ScoringInput): number {
  switch (input.type) {
    case 'MAX':
      if (input.target === 0) return input.actual === 0 ? 1 : 0;
      return Math.min(input.actual / input.target, 1);

    case 'MIN':
      if (input.target === 0) return input.actual === 0 ? 1 : 0;
      // Score = 1 when actual <= target, degrades linearly above
      return input.actual <= input.target ? 1 : Math.max(0, 1 - (input.actual - input.target) / input.target);

    case 'TIMELINE': {
      const deadlineMs = input.deadline.getTime();
      const completedMs = input.completed.getTime();
      if (completedMs <= deadlineMs) return 1;
      // Each day late reduces score by 1/30 (capped at 0)
      const daysLate = (completedMs - deadlineMs) / 86_400_000;
      return Math.max(0, 1 - daysLate / 30);
    }

    case 'ZERO':
      return input.actual === 0 ? 1 : 0;
  }
}

export function scoringTypeFromPrisma(t: ScoringType): ScoringInput['type'] {
  return t as ScoringInput['type'];
}

export function computeWeightedScore(
  goals: Array<{ scoringType: ScoringType; target: number; actual: number; weightage: number; deadline?: Date | null; completedDate?: Date | null }>
): number {
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  if (totalWeight === 0) return 0;

  const weighted = goals.reduce((s, g) => {
    const input = buildScoringInput(g);
    return s + computeScore(input) * g.weightage;
  }, 0);

  return weighted / totalWeight;
}

export function buildScoringInput(g: {
  scoringType: ScoringType;
  target: number;
  actual: number;
  deadline?: Date | null;
  completedDate?: Date | null;
}): ScoringInput {
  switch (g.scoringType) {
    case ScoringType.MIN:
      return { type: 'MIN', target: g.target, actual: g.actual };
    case ScoringType.TIMELINE:
      return {
        type: 'TIMELINE',
        deadline: g.deadline ?? new Date(),
        completed: g.completedDate ?? new Date(),
      };
    case ScoringType.ZERO:
      return { type: 'ZERO', actual: g.actual };
    case ScoringType.MAX:
    default:
      return { type: 'MAX', target: g.target, actual: g.actual };
  }
}
