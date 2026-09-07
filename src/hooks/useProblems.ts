import { useState, useCallback, useEffect } from 'react';
import { Problem, AppState, Difficulty, EmailSettings } from '../types';
import { loadState, saveState } from '../utils/storage';
import { advanceStage, computeFirstNextRevision, todayStr } from '../utils/spacedRepetition';

// Pre-loaded problems — one due per day for 14 days so you tackle them one at a
// time. All Stage 1 (first revision). After you mark each one revised it enters
// the normal spaced repetition cycle (Stage 2 → 3 → … → Mastered).
const PRELOADED: Problem[] = [
  // Arrays & Hashing
  { id: 'pre-01', name: 'Contains Duplicate',           difficulty: 'easy',   category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-07', confidence: 3, revisedDates: [] },
  { id: 'pre-02', name: 'Valid Anagram',                difficulty: 'easy',   category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-08', confidence: 3, revisedDates: [] },
  { id: 'pre-03', name: 'Two Sum',                      difficulty: 'easy',   category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-09', confidence: 3, revisedDates: [] },
  { id: 'pre-04', name: 'Group Anagrams',               difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-10', confidence: 3, revisedDates: [] },
  { id: 'pre-05', name: 'Top K Frequent Elements',      difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-11', confidence: 3, revisedDates: [] },
  { id: 'pre-06', name: 'Encode and Decode Strings',    difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-12', confidence: 3, revisedDates: [] },
  { id: 'pre-07', name: 'Product of Array Except Self', difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-13', confidence: 3, revisedDates: [] },
  { id: 'pre-08', name: 'Valid Sudoku',                 difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-14', confidence: 3, revisedDates: [] },
  { id: 'pre-09', name: 'Longest Consecutive Sequence', difficulty: 'medium', category: 'Arrays & Hashing', dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-15', confidence: 3, revisedDates: [] },
  // Two Pointers
  { id: 'pre-10', name: 'Valid Palindrome',             difficulty: 'easy',   category: 'Two Pointers',    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-16', confidence: 3, revisedDates: [] },
  { id: 'pre-11', name: 'Two Sum II',                   difficulty: 'medium', category: 'Two Pointers',    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-17', confidence: 3, revisedDates: [] },
  { id: 'pre-12', name: '3Sum',                         difficulty: 'medium', category: 'Two Pointers',    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-18', confidence: 3, revisedDates: [] },
  { id: 'pre-13', name: 'Container With Most Water',    difficulty: 'medium', category: 'Two Pointers',    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-19', confidence: 3, revisedDates: [] },
  { id: 'pre-14', name: 'Trapping Rain Water',          difficulty: 'hard',   category: 'Two Pointers',    dateSolved: '2026-09-06', stage: 1, lastRevised: null, nextRevision: '2026-09-20', confidence: 3, revisedDates: [] },
];

const DEFAULT_STATE: AppState = {
  problems: PRELOADED,
  darkMode: false,
  activeDates: ['2026-09-06'],
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

  const updateEmailSettings = useCallback((settings: EmailSettings) => {
    setState(prev => ({ ...prev, emailSettings: settings }));
  }, []);

  return { state, addProblem, removeProblem, markRevised, updateConfidence, toggleDarkMode, importState, updateEmailSettings };
}
