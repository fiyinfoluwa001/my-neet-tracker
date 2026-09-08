import { Problem } from '../types';
import { isOverdue, isDueToday, isMastered, getDaysUntilRevision } from '../utils/spacedRepetition';

interface Props {
  problem: Problem;
  onMarkRevised: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateConfidence: (id: string, rating: number) => void;
  onEdit: (problem: Problem) => void;
}

const DIFFICULTY_STYLES = {
  easy:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  hard:   'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
} as const;

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

export function ProblemCard({ problem, onMarkRevised, onRemove, onUpdateConfidence, onEdit }: Props) {
  const mastered  = isMastered(problem);
  const overdue   = isOverdue(problem);
  const dueToday  = isDueToday(problem);
  const daysUntil = getDaysUntilRevision(problem);

  const borderColor = mastered
    ? 'border-l-gray-300 dark:border-l-gray-600'
    : overdue
    ? 'border-l-red-500'
    : dueToday
    ? 'border-l-amber-400'
    : 'border-l-emerald-400';

  const urgencyText = mastered
    ? null
    : overdue
    ? <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Overdue {Math.abs(daysUntil!)}d</span>
    : dueToday
    ? <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Due Today</span>
    : <span className="text-xs text-gray-400 dark:text-gray-500">in {daysUntil}d</span>;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 ${borderColor} p-4 flex flex-col gap-3 animate-fade-in`}>
      {/* Header row */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate" title={problem.name}>
            {problem.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_STYLES[problem.difficulty]}`}>
              {DIFFICULTY_LABELS[problem.difficulty]}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {problem.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <button
            onClick={() => onEdit(problem)}
            className="text-gray-300 hover:text-blue-400 dark:text-gray-600 dark:hover:text-blue-400 transition-colors text-sm leading-none"
            title="Edit problem"
            aria-label="Edit problem"
          >
            ✏
          </button>
          <button
            onClick={() => onRemove(problem.id)}
            className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors text-sm leading-none"
            title="Remove problem"
            aria-label="Remove problem"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stage + urgency */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {mastered ? '🏆 Mastered' : `Stage ${problem.stage}/6`}
        </span>
        {urgencyText}
      </div>

      {/* Confidence stars */}
      <div className="flex items-center gap-0.5">
        <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Confidence</span>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onUpdateConfidence(problem.id, star)}
            className={`text-base transition-colors ${star <= problem.confidence ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'} hover:text-amber-300`}
            aria-label={`Set confidence to ${star}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-gray-700">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Solved {problem.dateSolved}
        </span>
        {!mastered && (
          <button
            onClick={() => onMarkRevised(problem.id)}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
              overdue || dueToday
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Mark Revised ✓
          </button>
        )}
      </div>
    </div>
  );
}
