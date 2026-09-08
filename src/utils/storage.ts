import { AppState } from '../types';

const STORAGE_KEY = 'neetcode-tracker-v3';

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AppState;

    // Migrate: single `category: string` → `categories: string[]`
    if (Array.isArray(data.problems)) {
      data.problems = data.problems.map((p: AppState['problems'][number] & { category?: string }) => {
        if (!p.categories) {
          return { ...p, categories: p.category ? [p.category] : [] };
        }
        return p;
      });
    }

    return data;
  } catch {
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist state', e);
  }
}

export function exportData(state: AppState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `neetcode-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImport(raw: string): AppState {
  const data = JSON.parse(raw) as AppState;
  if (!Array.isArray(data.problems)) throw new Error('Invalid backup: missing problems array');
  return data;
}
