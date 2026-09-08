export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  id: string;
  name: string;
  difficulty: Difficulty;
  categories: string[];
  dateSolved: string;    // YYYY-MM-DD
  stage: number;         // 1–6 active, 7+ = mastered
  lastRevised: string | null;
  nextRevision: string | null; // YYYY-MM-DD
  confidence: number;    // 1–5
  revisedDates: string[];
}

export interface EmailSettings {
  enabled: boolean;
  recipientEmail: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export interface AppState {
  problems: Problem[];
  darkMode: boolean;
  activeDates: string[]; // YYYY-MM-DD dates when user was active
  emailSettings: EmailSettings;
}

export type Tab = 'today' | 'all' | 'schedule';
export type FilterDifficulty = 'all' | Difficulty;
