import { Problem } from '../types';
import { ProblemCard } from './ProblemCard';

interface Props {
  problems: Problem[];
  onMarkRevised: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateConfidence: (id: string, rating: number) => void;
  onEdit: (problem: Problem) => void;
}

function formatDayLabel(dateStr: string, offset: number): string {
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function DaySchedule({ problems, onMarkRevised, onRemove, onUpdateConfidence, onEdit }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dateStr,
      label: formatDayLabel(dateStr, i),
      problems: problems.filter(p => p.nextRevision === dateStr),
    };
  });

  return (
    <div className="space-y-8">
      {days.map(day => (
        <section key={day.dateStr}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{day.label}</h3>
            <span className="text-xs text-gray-400">{day.dateStr}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              day.problems.length > 0
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {day.problems.length} {day.problems.length === 1 ? 'problem' : 'problems'}
            </span>
          </div>

          {day.problems.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {day.problems.map(p => (
                <ProblemCard
                  key={p.id}
                  problem={p}
                  onMarkRevised={onMarkRevised}
                  onRemove={onRemove}
                  onUpdateConfidence={onUpdateConfidence}
                  onEdit={onEdit}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-600 italic">No problems scheduled</p>
          )}
        </section>
      ))}
    </div>
  );
}
