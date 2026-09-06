import { Problem } from '../types';
import { isOverdue, isDueToday, isMastered } from '../utils/spacedRepetition';

interface Props {
  problems: Problem[];
}

interface StatCard {
  label: string;
  value: number;
  textColor: string;
  bgColor: string;
  icon: string;
}

export function StatsGrid({ problems }: Props) {
  const cards: StatCard[] = [
    {
      label: 'Total Solved',
      value: problems.length,
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: '📚',
    },
    {
      label: 'Due Today',
      value: problems.filter(isDueToday).length,
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      icon: '📅',
    },
    {
      label: 'Overdue',
      value: problems.filter(isOverdue).length,
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      icon: '⚠️',
    },
    {
      label: 'Mastered',
      value: problems.filter(isMastered).length,
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: '🏆',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.label}
          className={`${card.bgColor} rounded-xl p-4 border border-gray-100 dark:border-gray-700`}
        >
          <div className="text-2xl mb-1">{card.icon}</div>
          <div className={`text-3xl font-bold ${card.textColor}`}>{card.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
