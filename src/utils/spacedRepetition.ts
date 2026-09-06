import { Problem } from '../types';

// Days to wait before next revision at each stage
export const STAGE_INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
  6: 30,
};

export const MAX_STAGE = 6;

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function isMastered(problem: Problem): boolean {
  return problem.stage > MAX_STAGE;
}

export function isOverdue(problem: Problem): boolean {
  if (isMastered(problem) || !problem.nextRevision) return false;
  return problem.nextRevision < todayStr();
}

export function isDueToday(problem: Problem): boolean {
  if (isMastered(problem) || !problem.nextRevision) return false;
  return problem.nextRevision === todayStr();
}

export function getDaysUntilRevision(problem: Problem): number | null {
  if (!problem.nextRevision) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(problem.nextRevision);
  next.setHours(0, 0, 0, 0);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

export function advanceStage(problem: Problem): Partial<Problem> {
  const today = todayStr();
  const newStage = problem.stage + 1;
  const interval = STAGE_INTERVALS[newStage];
  const nextRevision = interval != null ? addDays(today, interval) : null;

  return {
    stage: newStage,
    lastRevised: today,
    nextRevision,
    revisedDates: [...problem.revisedDates, today],
  };
}

export function computeFirstNextRevision(dateSolved: string): string {
  // Stage 1 → 1 day after solving
  return addDays(dateSolved, STAGE_INTERVALS[1]);
}
