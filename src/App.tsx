import { useState, useMemo, useRef } from 'react';
import { useProblems } from './hooks/useProblems';
import { useNotifications } from './hooks/useNotifications';
import { useEmailReminder } from './hooks/useEmailReminder';
import { ProblemCard } from './components/ProblemCard';
import { AddProblemModal } from './components/AddProblemModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsGrid } from './components/StatsGrid';
import { StreakBar } from './components/StreakBar';
import { DaySchedule } from './components/DaySchedule';
import type { Tab } from './types';
import { isOverdue, isDueToday, isMastered, todayStr } from './utils/spacedRepetition';
import { exportData, parseImport } from './utils/storage';

export default function App() {
  const { state, addProblem, editProblem, removeProblem, markRevised, updateConfidence, toggleDarkMode, importState, updateEmailSettings } =
    useProblems();
  const { overdueCount, dueTodayCount } = useNotifications(state.problems);
  useEmailReminder(state.problems, state.emailSettings);

  const [tab, setTab] = useState<Tab>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingProblem, setEditingProblem] = useState<import('./types').Problem | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [importError, setImportError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => Array.from(new Set(state.problems.map(p => p.category))).sort(),
    [state.problems]
  );

  const filteredProblems = useMemo(() => {
    return state.problems.filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterDifficulty !== 'all' && p.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [state.problems, filterCategory, filterDifficulty]);

  const overdueProblems  = useMemo(() => state.problems.filter(isOverdue), [state.problems]);
  const dueTodayProblems = useMemo(() => state.problems.filter(isDueToday), [state.problems]);
  const upcomingProblems = useMemo(() => {
    const today = todayStr();
    return state.problems
      .filter(p => !isOverdue(p) && !isDueToday(p) && !isMastered(p) && p.nextRevision && p.nextRevision > today)
      .sort((a, b) => (a.nextRevision ?? '').localeCompare(b.nextRevision ?? ''))
      .slice(0, 3);
  }, [state.problems]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseImport(ev.target?.result as string);
        importState(parsed);
        setImportError(null);
      } catch {
        setImportError('Invalid backup file. Please choose a valid JSON export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const cardProps = { onMarkRevised: markRevised, onRemove: removeProblem, onUpdateConfidence: updateConfidence, onEdit: setEditingProblem };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'all', label: 'All Problems' },
    { id: 'schedule', label: 'Schedule' },
  ];

  return (
    <div className={state.darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">

        {/* Notification banner */}
        {(overdueCount > 0 || dueTodayCount > 0) && (
          <div
            className={`px-4 py-2.5 text-center text-sm font-medium ${
              overdueCount > 0
                ? 'bg-red-500 text-white'
                : 'bg-amber-400 text-amber-900'
            }`}
          >
            {overdueCount > 0
              ? `⚠️ ${overdueCount} overdue problem${overdueCount > 1 ? 's' : ''} need revision!`
              : `📚 ${dueTodayCount} problem${dueTodayCount > 1 ? 's' : ''} due today!`}
            {' '}
            <button
              onClick={() => setTab('today')}
              className="underline font-semibold hover:opacity-80 transition-opacity"
            >
              Review now
            </button>
          </div>
        )}

        {/* Import error toast */}
        {importError && (
          <div className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-4 py-2 text-sm text-center flex justify-between items-center">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="ml-4 font-bold">✕</button>
          </div>
        )}

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                🧠 NeetCode Tracker
              </h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                Spaced repetition for DSA mastery
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Export */}
              <button
                onClick={() => exportData(state)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Export data as JSON"
              >
                Export ↓
              </button>

              {/* Import */}
              <button
                onClick={() => importRef.current?.click()}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Import data from JSON"
              >
                Import ↑
              </button>
              <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

              {/* Email settings */}
              <button
                onClick={() => setShowSettings(true)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  state.emailSettings.enabled
                    ? 'border-blue-400 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={state.emailSettings.enabled ? 'Email reminders ON' : 'Set up email reminders'}
              >
                {state.emailSettings.enabled ? '📧 On' : '📧'}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Toggle dark mode"
                aria-label="Toggle dark mode"
              >
                {state.darkMode ? '☀️' : '🌙'}
              </button>

              {/* Add Problem */}
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
              >
                + Add Problem
              </button>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="max-w-5xl mx-auto px-4 flex border-t border-gray-100 dark:border-gray-700">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t.label}
                {t.id === 'today' && overdueCount + dueTodayCount > 0 && (
                  <span className={`ml-1.5 inline-flex items-center justify-center text-xs w-5 h-5 rounded-full ${
                    overdueCount > 0
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                  }`}>
                    {overdueCount + dueTodayCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <StatsGrid problems={state.problems} />
          <StreakBar activeDates={state.activeDates} />

          {/* ── TODAY TAB ── */}
          {tab === 'today' && (
            <div className="space-y-8">
              {/* Overdue */}
              {overdueProblems.length > 0 && (
                <section>
                  <SectionHeading
                    emoji="🔴"
                    title="Overdue"
                    count={overdueProblems.length}
                    countColor="text-red-500"
                  />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {overdueProblems.map(p => (
                      <ProblemCard key={p.id} problem={p} {...cardProps} />
                    ))}
                  </div>
                </section>
              )}

              {/* Due Today */}
              {dueTodayProblems.length > 0 && (
                <section>
                  <SectionHeading
                    emoji="🟡"
                    title="Due Today"
                    count={dueTodayProblems.length}
                    countColor="text-amber-500"
                  />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dueTodayProblems.map(p => (
                      <ProblemCard key={p.id} problem={p} {...cardProps} />
                    ))}
                  </div>
                </section>
              )}

              {/* All caught up */}
              {overdueProblems.length === 0 && dueTodayProblems.length === 0 && (
                <div className="text-center py-14">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">All caught up!</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No problems due today.</p>
                </div>
              )}

              {/* Upcoming */}
              {upcomingProblems.length > 0 && (
                <section>
                  <SectionHeading emoji="📅" title="Coming Up" count={upcomingProblems.length} countColor="text-gray-400" />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {upcomingProblems.map(p => (
                      <ProblemCard key={p.id} problem={p} {...cardProps} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── ALL PROBLEMS TAB ── */}
          {tab === 'all' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <span className="text-sm text-gray-400 dark:text-gray-500">
                  {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredProblems.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProblems.map(p => (
                    <ProblemCard key={p.id} problem={p} {...cardProps} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                  No problems match the selected filters.
                </div>
              )}
            </div>
          )}

          {/* ── SCHEDULE TAB ── */}
          {tab === 'schedule' && (
            <DaySchedule problems={state.problems} {...cardProps} />
          )}
        </main>

        {/* Add Problem Modal */}
        {showAddModal && (
          <AddProblemModal
            onAdd={addProblem}
            onClose={() => setShowAddModal(false)}
            existingCategories={categories}
          />
        )}

        {/* Edit Problem Modal */}
        {editingProblem && (
          <AddProblemModal
            problem={editingProblem}
            onAdd={addProblem}
            onEdit={editProblem}
            onClose={() => setEditingProblem(null)}
            existingCategories={categories}
          />
        )}

        {/* Email Settings Modal */}
        {showSettings && (
          <SettingsModal
            settings={state.emailSettings}
            problems={state.problems}
            onSave={updateEmailSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

interface SectionHeadingProps {
  emoji: string;
  title: string;
  count: number;
  countColor: string;
}

function SectionHeading({ emoji, title, count, countColor }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
      <span>{emoji}</span>
      <span>{title}</span>
      <span className={`text-xs font-normal ${countColor}`}>({count})</span>
    </h2>
  );
}
