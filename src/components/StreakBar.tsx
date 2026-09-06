interface Props {
  activeDates: string[];
}

export function StreakBar({ activeDates }: Props) {
  const today = new Date();

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split('T')[0];
    return { dateStr, active: activeDates.includes(dateStr) };
  });

  // Count consecutive active days ending today
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].active) streak++;
    else break;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity (Last 30 Days)</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          🔥 <span className="font-semibold text-orange-500">{streak}</span> day streak
        </span>
      </div>
      <div className="flex gap-1">
        {days.map(day => (
          <div
            key={day.dateStr}
            title={day.dateStr}
            className={`flex-1 h-5 rounded-sm transition-colors ${
              day.active
                ? 'bg-emerald-400 dark:bg-emerald-500'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-gray-400">30d ago</span>
        <span className="text-xs text-gray-400">Today</span>
      </div>
    </div>
  );
}
