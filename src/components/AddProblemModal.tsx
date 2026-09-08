import { useState } from 'react';
import { Difficulty, Problem } from '../types';

const NEETCODE_CATEGORIES = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Advanced Graphs',
  'Dynamic Programming (1D)',
  'Dynamic Programming (2D)',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
];

interface Props {
  onAdd: (name: string, difficulty: Difficulty, categories: string[], dateSolved: string) => void;
  onClose: () => void;
  existingCategories: string[];
  problem?: Problem;
  onEdit?: (id: string, name: string, difficulty: Difficulty, categories: string[], dateSolved: string) => void;
}

export function AddProblemModal({ onAdd, onEdit, onClose, existingCategories, problem }: Props) {
  const isEdit = Boolean(problem);

  const [name, setName]               = useState(problem?.name ?? '');
  const [difficulty, setDifficulty]   = useState<Difficulty>(problem?.difficulty ?? 'medium');
  const [dateSolved, setDateSolved]   = useState(problem?.dateSolved ?? new Date().toISOString().split('T')[0]);
  const [selectedCats, setSelectedCats] = useState<string[]>(problem?.categories ?? []);
  const [customCat, setCustomCat]     = useState('');
  const [showCustom, setShowCustom]   = useState(false);

  // Merge known categories without duplicates
  const allCategories = Array.from(new Set([...existingCategories, ...NEETCODE_CATEGORIES]));

  const toggle = (cat: string) =>
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );

  const addCustom = () => {
    const trimmed = customCat.trim();
    if (!trimmed || selectedCats.includes(trimmed)) return;
    setSelectedCats(prev => [...prev, trimmed]);
    setCustomCat('');
    setShowCustom(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedCats.length === 0) return;
    if (isEdit && problem && onEdit) {
      onEdit(problem.id, name.trim(), difficulty, selectedCats, dateSolved);
    } else {
      onAdd(name.trim(), difficulty, selectedCats, dateSolved);
    }
    onClose();
  };

  const inputCls =
    'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Problem' : 'Add Problem'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Problem Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Best Time to Buy and Sell Stock"
              required
              autoFocus
            />
          </div>

          {/* Difficulty + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className={inputCls}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date Solved</label>
              <input
                type="date"
                value={dateSolved}
                onChange={e => setDateSolved(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Topic tags */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topics / Categories *
              <span className="ml-1 font-normal text-gray-400">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedCats.includes(cat)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {selectedCats.includes(cat) && <span className="mr-1">✓</span>}
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustom(v => !v)}
                className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 transition-colors"
              >
                + Custom
              </button>
            </div>

            {/* Custom category input */}
            {showCustom && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                  className={`${inputCls} flex-1`}
                  placeholder="e.g. Union Find"
                  autoFocus
                />
                <button type="button" onClick={addCustom} className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">Add</button>
              </div>
            )}

            {/* Selected summary */}
            {selectedCats.length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Selected: {selectedCats.join(' · ')}
              </p>
            )}
            {selectedCats.length === 0 && (
              <p className="text-xs text-red-400 mt-1">Pick at least one topic.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={selectedCats.length === 0} className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
              {isEdit ? 'Save Changes' : 'Add Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
