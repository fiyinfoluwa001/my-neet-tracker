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

// How many days past the due date is this problem?
export function getDaysOverdue(problem: Problem): number {
  if (!problem.nextRevision || isMastered(problem)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(problem.nextRevision);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000));
}

// Option C penalty rules:
//   0–3 days overdue  → advance stage normally
//   4–7 days overdue  → stay at same stage (missed the window, redo it)
//   8+ days overdue   → drop back one stage (likely forgotten it)
export type RevisionOutcome = 'advanced' | 'held' | 'regressed';

export function advanceStage(problem: Problem): Partial<Problem> & { outcome: RevisionOutcome } {
  const today = todayStr();
  const daysOverdue = getDaysOverdue(problem);

  let newStage: number;
  let outcome: RevisionOutcome;

  if (daysOverdue <= 3) {
    newStage = problem.stage + 1;
    outcome = 'advanced';
  } else if (daysOverdue <= 7) {
    newStage = problem.stage;       // stay — redo the same interval from today
    outcome = 'held';
  } else {
    newStage = Math.max(1, problem.stage - 1);
    outcome = 'regressed';
  }

  const interval = STAGE_INTERVALS[newStage];
  const nextRevision = interval != null ? addDays(today, interval) : null;

  return {
    stage: newStage,
    lastRevised: today,
    nextRevision,
    revisedDates: [...problem.revisedDates, today],
    outcome,
  };
}

export function computeFirstNextRevision(dateSolved: string): string {
  return addDays(dateSolved, STAGE_INTERVALS[1]);
}
