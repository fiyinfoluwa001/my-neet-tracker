import { useState, useCallback, useEffect } from 'react';
import { Problem, AppState, Difficulty } from '../types';
import { loadState, saveState } from '../utils/storage';
import { advanceStage, computeFirstNextRevision, todayStr } from '../utils/spacedRepetition';

// Pre-loaded problems — staggered across upcoming dates so you get 1-2 revisions
// per day rather than all 14 at once. Stages reflect how "established" each
// problem is in the repetition cycle.
const PRELOADED: Problem[] = [
  // Arrays & Hashing
  { id: 'pre-01', name: 'Contains Duplicate',           difficulty: 'easy',   category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null,         nextRevision: '2026-09-08', confidence: 3, revisedDates: [] },
  { id: 'pre-02', name: 'Valid Anagram',                difficulty: 'easy',   category: 'Arrays & Hashing', dateSolved: '2026-09-05', stage: 2, lastRevised: '2026-09-06', nextRevision: '2026-09-09', confidence: 3, revisedDates: ['2026-09-06'] },
  { id: 'pre-03', name: 'Two Sum',                      difficulty: 'easy',   category: 'Arrays & Hashing', dateSolved: '2026-09-04', stage: 2, lastRevised: '2026-09-05', nextRevision: '2026-09-10', confidence: 3, revisedDates: ['2026-09-05'] },
  { id: 'pre-04', name: 'Group Anagrams',               difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-03', stage: 3, lastRevised: '2026-09-07', nextRevision: '2026-09-11', confidence: 3, revisedDates: ['2026-09-04', '2026-09-07'] },
  { id: 'pre-05', name: 'Top K Frequent Elements',      difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-02', stage: 3, lastRevised: '2026-09-06', nextRevision: '2026-09-13', confidence: 3, revisedDates: ['2026-09-03', '2026-09-06'] },
  { id: 'pre-06', name: 'Encode and Decode Strings',    difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-01', stage: 3, lastRevised: '2026-09-05', nextRevision: '2026-09-15', confidence: 3, revisedDates: ['2026-09-02', '2026-09-05'] },
  { id: 'pre-07', name: 'Product of Array Except Self', difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-08-30', stage: 4, lastRevised: '2026-09-06', nextRevision: '2026-09-17', confidence: 3, revisedDates: ['2026-08-31', '2026-09-02', '2026-09-06'] },
  { id: 'pre-08', name: 'Valid Sudoku',                 difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-08-28', stage: 4, lastRevised: '2026-09-04', nextRevision: '2026-09-20', confidence: 3, revisedDates: ['2026-08-29', '2026-08-31', '2026-09-04'] },
  { id: 'pre-09', name: 'Longest Consecutive Sequence', difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-08-25', stage: 4, lastRevised: '2026-09-01', nextRevision: '2026-09-23', confidence: 3, revisedDates: ['2026-08-26', '2026-08-28', '2026-09-01'] },
  // Two Pointers
  { id: 'pre-10', name: 'Valid Palindrome',             difficulty: 'easy',   category: 'Two Pointers', dateSolved: '2026-08-22', stage: 5, lastRevised: '2026-09-05', nextRevision: '2026-09-26', confidence: 3, revisedDates: ['2026-08-23', '2026-08-25', '2026-08-29', '2026-09-05'] },
  { id: 'pre-11', name: 'Two Sum II',                   difficulty: 'medium', category: 'Two Pointers', dateSolved: '2026-08-20', stage: 5, lastRevised: '2026-09-03', nextRevision: '2026-09-29', confidence: 3, revisedDates: ['2026-08-21', '2026-08-23', '2026-08-27', '2026-09-03'] },
  { id: 'pre-12', name: '3Sum',                         difficulty: 'medium', category: 'Two Pointers', dateSolved: '2026-08-18', stage: 5, lastRevised: '2026-09-01', nextRevision: '2026-10-02', confidence: 3, revisedDates: ['2026-08-19', '2026-08-21', '2026-08-25', '2026-09-01'] },
  { id: 'pre-13', name: 'Container With Most Water',    difficulty: 'medium', category: 'Two Pointers', dateSolved: '2026-08-15', stage: 6, lastRevised: '2026-09-06', nextRevision: '2026-10-06', confidence: 4, revisedDates: ['2026-08-16', '2026-08-18', '2026-08-22', '2026-08-29', '2026-09-06'] },
  { id: 'pre-14', name: 'Trapping Rain Water',          difficulty: 'hard',   category: 'Two Pointers', dateSolved: '2026-08-12', stage: 6, lastRevised: '2026-09-03', nextRevision: '2026-10-09', confidence: 4, revisedDates: ['2026-08-13', '2026-08-15', '2026-08-19', '2026-08-26', '2026-09-03'] },
];

const DEFAULT_STATE: AppState = {
  problems: PRELOADED,
  darkMode: false,
  activeDates: ['2026-09-06'],
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
    (name: string, difficulty: Difficulty, category: string, dateSolved: string) => {
      const problem: Problem = {
        id: genId(),
        name,
        difficulty,
        category,
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
    setState(prev => ({
      ...prev,
      problems: prev.problems.map(p => (p.id === id ? { ...p, ...advanceStage(p) } : p)),
      activeDates: prev.activeDates.includes(today)
        ? prev.activeDates
        : [...prev.activeDates, today],
    }));
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

  const importState = useCallback((newState: AppState) => {
    setState(newState);
  }, []);

  return { state, addProblem, removeProblem, markRevised, updateConfidence, toggleDarkMode, importState };
}
