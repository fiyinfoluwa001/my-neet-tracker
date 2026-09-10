import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addDays,
  todayStr,
  isMastered,
  isOverdue,
  isDueToday,
  getDaysOverdue,
  getDaysUntilRevision,
  advanceStage,
  computeFirstNextRevision,
  STAGE_INTERVALS,
  MAX_STAGE,
} from './spacedRepetition';
import type { Problem } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    id: 'test-1',
    name: 'Test Problem',
    difficulty: 'easy',
    categories: ['Arrays & Hashing'],
    dateSolved: '2026-09-01',
    stage: 1,
    lastRevised: null,
    nextRevision: todayStr(),
    confidence: 3,
    revisedDates: [],
    ...overrides,
  };
}

// Pin "today" to a fixed date so tests are deterministic
function mockToday(dateStr: string) {
  const fixed = new Date(dateStr + 'T12:00:00Z');
  vi.useFakeTimers();
  vi.setSystemTime(fixed);
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// ─── addDays ────────────────────────────────────────────────────────────────

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-09-01', 1)).toBe('2026-09-02');
    expect(addDays('2026-09-01', 7)).toBe('2026-09-08');
    expect(addDays('2026-09-01', 30)).toBe('2026-10-01');
  });

  it('handles month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('handles year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

// ─── isMastered ─────────────────────────────────────────────────────────────

describe('isMastered', () => {
  it('returns false for stages 1–6', () => {
    for (let stage = 1; stage <= MAX_STAGE; stage++) {
      expect(isMastered(makeProblem({ stage }))).toBe(false);
    }
  });

  it('returns true for stage 7+', () => {
    expect(isMastered(makeProblem({ stage: 7 }))).toBe(true);
    expect(isMastered(makeProblem({ stage: 10 }))).toBe(true);
  });
});

// ─── isOverdue / isDueToday ──────────────────────────────────────────────────

describe('isOverdue', () => {
  it('is true when nextRevision is before today', () => {
    mockToday('2026-09-10');
    expect(isOverdue(makeProblem({ nextRevision: '2026-09-09' }))).toBe(true);
    expect(isOverdue(makeProblem({ nextRevision: '2026-08-01' }))).toBe(true);
  });

  it('is false when nextRevision is today', () => {
    mockToday('2026-09-10');
    expect(isOverdue(makeProblem({ nextRevision: '2026-09-10' }))).toBe(false);
  });

  it('is false when nextRevision is in the future', () => {
    mockToday('2026-09-10');
    expect(isOverdue(makeProblem({ nextRevision: '2026-09-11' }))).toBe(false);
  });

  it('is false for mastered problems', () => {
    mockToday('2026-09-10');
    expect(isOverdue(makeProblem({ stage: 7, nextRevision: '2026-09-01' }))).toBe(false);
  });

  it('is false when nextRevision is null', () => {
    expect(isOverdue(makeProblem({ nextRevision: null }))).toBe(false);
  });
});

describe('isDueToday', () => {
  it('is true only when nextRevision equals today', () => {
    mockToday('2026-09-10');
    expect(isDueToday(makeProblem({ nextRevision: '2026-09-10' }))).toBe(true);
  });

  it('is false for overdue problems', () => {
    mockToday('2026-09-10');
    expect(isDueToday(makeProblem({ nextRevision: '2026-09-09' }))).toBe(false);
  });

  it('is false for future problems', () => {
    mockToday('2026-09-10');
    expect(isDueToday(makeProblem({ nextRevision: '2026-09-11' }))).toBe(false);
  });

  it('is false for mastered problems', () => {
    mockToday('2026-09-10');
    expect(isDueToday(makeProblem({ stage: 7, nextRevision: '2026-09-10' }))).toBe(false);
  });
});

// ─── getDaysOverdue ──────────────────────────────────────────────────────────

describe('getDaysOverdue', () => {
  it('returns 0 when due today', () => {
    mockToday('2026-09-10');
    expect(getDaysOverdue(makeProblem({ nextRevision: '2026-09-10' }))).toBe(0);
  });

  it('returns 0 when due in the future', () => {
    mockToday('2026-09-10');
    expect(getDaysOverdue(makeProblem({ nextRevision: '2026-09-15' }))).toBe(0);
  });

  it('returns correct number of overdue days', () => {
    mockToday('2026-09-10');
    expect(getDaysOverdue(makeProblem({ nextRevision: '2026-09-07' }))).toBe(3);
    expect(getDaysOverdue(makeProblem({ nextRevision: '2026-09-03' }))).toBe(7);
    expect(getDaysOverdue(makeProblem({ nextRevision: '2026-09-02' }))).toBe(8);
  });

  it('returns 0 for mastered problems', () => {
    mockToday('2026-09-10');
    expect(getDaysOverdue(makeProblem({ stage: 7, nextRevision: '2026-09-01' }))).toBe(0);
  });
});

// ─── getDaysUntilRevision ────────────────────────────────────────────────────

describe('getDaysUntilRevision', () => {
  it('returns negative for overdue', () => {
    mockToday('2026-09-10');
    expect(getDaysUntilRevision(makeProblem({ nextRevision: '2026-09-07' }))).toBe(-3);
  });

  it('returns 0 for due today', () => {
    mockToday('2026-09-10');
    expect(getDaysUntilRevision(makeProblem({ nextRevision: '2026-09-10' }))).toBe(0);
  });

  it('returns positive for future', () => {
    mockToday('2026-09-10');
    expect(getDaysUntilRevision(makeProblem({ nextRevision: '2026-09-17' }))).toBe(7);
  });

  it('returns null when nextRevision is null', () => {
    expect(getDaysUntilRevision(makeProblem({ nextRevision: null }))).toBeNull();
  });
});

// ─── advanceStage — Option C penalty logic ───────────────────────────────────

describe('advanceStage', () => {
  describe('on time (0–3 days overdue) → advances stage', () => {
    it('advances from stage 1 to 2 when due today', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 1, nextRevision: '2026-09-10' });
      const result = advanceStage(p);
      expect(result.stage).toBe(2);
      expect(result.outcome).toBe('advanced');
      expect(result.nextRevision).toBe(addDays('2026-09-10', STAGE_INTERVALS[2]));
    });

    it('advances from stage 3 to 4 when 2 days late', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 3, nextRevision: '2026-09-08' }); // 2 days late
      const result = advanceStage(p);
      expect(result.stage).toBe(4);
      expect(result.outcome).toBe('advanced');
    });

    it('advances from stage 3 to 4 when exactly 3 days late (boundary)', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 3, nextRevision: '2026-09-07' }); // 3 days late
      const result = advanceStage(p);
      expect(result.stage).toBe(4);
      expect(result.outcome).toBe('advanced');
    });
  });

  describe('missed window (4–7 days overdue) → stage held', () => {
    it('holds stage when 4 days late (boundary)', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 3, nextRevision: '2026-09-06' }); // 4 days late
      const result = advanceStage(p);
      expect(result.stage).toBe(3);
      expect(result.outcome).toBe('held');
      expect(result.nextRevision).toBe(addDays('2026-09-10', STAGE_INTERVALS[3]));
    });

    it('holds stage when 7 days late (boundary)', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 4, nextRevision: '2026-09-03' }); // 7 days late
      const result = advanceStage(p);
      expect(result.stage).toBe(4);
      expect(result.outcome).toBe('held');
    });
  });

  describe('forgotten (8+ days overdue) → stage regressed', () => {
    it('drops from stage 4 to stage 3 when 8 days late (boundary)', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 4, nextRevision: '2026-09-02' }); // 8 days late
      const result = advanceStage(p);
      expect(result.stage).toBe(3);
      expect(result.outcome).toBe('regressed');
      expect(result.nextRevision).toBe(addDays('2026-09-10', STAGE_INTERVALS[3]));
    });

    it('drops from stage 6 to stage 5 when very late', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 6, nextRevision: '2026-08-01' }); // 40 days late
      const result = advanceStage(p);
      expect(result.stage).toBe(5);
      expect(result.outcome).toBe('regressed');
    });

    it('never drops below stage 1', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 1, nextRevision: '2026-08-01' }); // very overdue
      const result = advanceStage(p);
      expect(result.stage).toBe(1);
      expect(result.outcome).toBe('regressed');
    });
  });

  describe('mastering', () => {
    it('moves from stage 6 to stage 7 (mastered) when on time', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 6, nextRevision: '2026-09-10' });
      const result = advanceStage(p);
      expect(result.stage).toBe(7);
      expect(result.outcome).toBe('advanced');
      expect(result.nextRevision).toBeNull(); // no more revisions
    });
  });

  describe('revision tracking', () => {
    it('appends today to revisedDates', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 2, nextRevision: '2026-09-10', revisedDates: ['2026-09-08'] });
      const result = advanceStage(p);
      expect(result.revisedDates).toEqual(['2026-09-08', '2026-09-10']);
    });

    it('sets lastRevised to today', () => {
      mockToday('2026-09-10');
      const p = makeProblem({ stage: 1, nextRevision: '2026-09-10' });
      expect(advanceStage(p).lastRevised).toBe('2026-09-10');
    });
  });
});

// ─── computeFirstNextRevision ────────────────────────────────────────────────

describe('computeFirstNextRevision', () => {
  it('schedules first revision 1 day after solving', () => {
    expect(computeFirstNextRevision('2026-09-10')).toBe('2026-09-11');
  });

  it('handles end of month', () => {
    expect(computeFirstNextRevision('2026-09-30')).toBe('2026-10-01');
  });
});
