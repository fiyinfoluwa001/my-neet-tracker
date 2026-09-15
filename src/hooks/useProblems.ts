import { useState, useCallback, useEffect } from 'react';
import { Problem, AppState, Difficulty, EmailSettings } from '../types';
import { loadState, saveState } from '../utils/storage';
import { advanceStage, computeFirstNextRevision, findAvailableDate, todayStr } from '../utils/spacedRepetition';

// Pre-loaded problems — 2 per day from Sep 14 onward (max 3/day including the
// 1 new problem you add daily). Overdue problems are redistributed so nothing
// piles up. After you mark each one revised it enters the normal SR cycle.
const PRELOADED: Problem[] = [
  // Sep 15 — 2 problems
  { id: 'pre-08', name: 'Valid Sudoku',                 difficulty: 'medium', categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-15', confidence: 3, revisedDates: [] },
  { id: 'pre-01', name: 'Contains Duplicate',           difficulty: 'easy',   categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-15', confidence: 3, revisedDates: [] },
  // Sep 16 — 2 problems
  { id: 'pre-09', name: 'Longest Consecutive Sequence', difficulty: 'medium', categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-16', confidence: 3, revisedDates: [] },
  { id: 'pre-02', name: 'Valid Anagram',                difficulty: 'easy',   categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-16', confidence: 3, revisedDates: [] },
  // Sep 17 — 2 problems
  { id: 'pre-10', name: 'Valid Palindrome',             difficulty: 'easy',   categories: ['Two Pointers'],    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-17', confidence: 3, revisedDates: [] },
  { id: 'pre-03', name: 'Two Sum',                      difficulty: 'easy',   categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-17', confidence: 3, revisedDates: [] },
  // Sep 18 — 2 problems
  { id: 'pre-11', name: 'Two Sum II',                   difficulty: 'medium', categories: ['Two Pointers'],    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-18', confidence: 3, revisedDates: [] },
  { id: 'pre-04', name: 'Group Anagrams',               difficulty: 'medium', categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-18', confidence: 3, revisedDates: [] },
  // Sep 19 — 2 problems
  { id: 'pre-12', name: '3Sum',                         difficulty: 'medium', categories: ['Two Pointers'],    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-19', confidence: 3, revisedDates: [] },
  { id: 'pre-05', name: 'Top K Frequent Elements',      difficulty: 'medium', categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-19', confidence: 3, revisedDates: [] },
  // Sep 20 — 2 problems
  { id: 'pre-13', name: 'Container With Most Water',    difficulty: 'medium', categories: ['Two Pointers'],    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-20', confidence: 3, revisedDates: [] },
  { id: 'pre-06', name: 'Encode and Decode Strings',    difficulty: 'medium', categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-20', confidence: 3, revisedDates: [] },
  // Sep 21 — 2 problems
  { id: 'pre-14', name: 'Trapping Rain Water',          difficulty: 'hard',   categories: ['Two Pointers'],    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-21', confidence: 3, revisedDates: [] },
  { id: 'pre-07', name: 'Product of Array Except Self', difficulty: 'medium', categories: ['Arrays & Hashing'], dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-21', confidence: 3, revisedDates: [] },
];

const DEFAULT_STATE: AppState = {
  problems: PRELOADED,
  darkMode: false,
  activeDates: [
    '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09',
    '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14',
  ],
  emailSettings: {
    enabled: false,
    recipientEmail: '',
    serviceId: '',
    templateId: '',
    publicKey: '',
  },
};

let _idSeq = Date.now();
function genId(): string {
  return `p-${++_idSeq}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useProblems() {
  const [state, setState] = useState<AppState>(() => loadState() ?? DEFAULT_STATE);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Sync problems + email settings to the backend (powers the 10am cron email).
  // Debounced 2s so rapid changes don't spam the API. Fails silently in local dev.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problems: state.problems,
          emailSettings: state.emailSettings,
        }),
      }).catch(() => { /* offline or local dev — ignore */ });
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.problems, state.emailSettings]);

  // Mark today as active whenever the hook mounts
  useEffect(() => {
    const today = todayStr();
    setState(prev =>
      prev.activeDates.includes(today)
        ? prev
        : { ...prev, activeDates: [...prev.activeDates, today] }
    );
  }, []);

  const addProblem = useCallback(
    (name: string, difficulty: Difficulty, categories: string[], dateSolved: string) => {
      const problem: Problem = {
        id: genId(),
        name,
        difficulty,
        categories,
        dateSolved,
        stage: 1,
        lastRevised: null,
        nextRevision: computeFirstNextRevision(dateSolved),
        confidence: 3,
        revisedDates: [],
      };
      setState(prev => ({ ...prev, problems: [...prev.problems, problem] }));
    },
    []
  );

  const removeProblem = useCallback((id: string) => {
    setState(prev => ({ ...prev, problems: prev.problems.filter(p => p.id !== id) }));
  }, []);

  const markRevised = useCallback((id: string) => {
    const today = todayStr();
    setState(prev => {
      const problems = prev.problems.map(p => {
        if (p.id !== id) return p;
        const { outcome, ...rest } = advanceStage(p);
        // Shift the next revision date if that day already has 2 SR problems
        const nextRevision = rest.nextRevision
          ? findAvailableDate(prev.problems, rest.nextRevision, id)
          : null;
        return { ...p, ...rest, nextRevision, lastOutcome: outcome };
      });
      return {
        ...prev,
        problems,
        activeDates: prev.activeDates.includes(today)
          ? prev.activeDates
          : [...prev.activeDates, today],
      };
    });
  }, []);

  const updateConfidence = useCallback((id: string, confidence: number) => {
    setState(prev => ({
      ...prev,
      problems: prev.problems.map(p => (p.id === id ? { ...p, confidence } : p)),
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const editProblem = useCallback(
    (id: string, name: string, difficulty: Difficulty, categories: string[], dateSolved: string) => {
      setState(prev => ({
        ...prev,
        problems: prev.problems.map(p =>
          p.id === id ? { ...p, name, difficulty, categories, dateSolved } : p
        ),
      }));
    },
    []
  );

  const importState = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  const updateEmailSettings = useCallback((settings: EmailSettings) => {
    setState(prev => ({ ...prev, emailSettings: settings }));
  }, []);

  const updateConceptReview = useCallback((id: string, flag: boolean, notes: string) => {
    setState(prev => ({
      ...prev,
      problems: prev.problems.map(p =>
        p.id === id ? { ...p, needsConceptReview: flag, conceptNotes: notes } : p
      ),
    }));
  }, []);

  return { state, addProblem, editProblem, removeProblem, markRevised, updateConfidence, toggleDarkMode, importState, updateEmailSettings, updateConceptReview };
}
