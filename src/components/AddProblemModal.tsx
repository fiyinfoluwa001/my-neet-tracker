import { useState } from 'react';
import { Difficulty } from '../types';

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
  onAdd: (name: string, difficulty: Difficulty, category: string, dateSolved: string) => void;
  onClose: () => void;
  existingCategories: string[];
}

export function AddProblemModal({ onAdd, onClose, existingCategories }: Props) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [category, setCategory] = useState(existingCategories[0] ?? NEETCODE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [dateSolved, setDateSolved] = useState(new Date().toISOString().split('T')[0]);

  // Merge known categories without duplicates, preserving order
  const allCategories = Array.from(
    new Set([...existingCategories, ...NEETCODE_CATEGORIES])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalCategory =
      category === '__custom__' ? customCategory.trim() : category;
    if (!finalCategory) return;
    onAdd(name.trim(), difficulty, finalCategory, dateSolved);
    onClose();
  };

  const inputCls =
    'w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Problem</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Problem Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              placeholder="e.g. Longest Substring Without Repeating"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Difficulty)}
                className={inputCls}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Solved
              </label>
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

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className={inputCls}
            >
              {allCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">+ New Category…</option>
            </select>
          </div>

          {category === '__custom__' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className={inputCls}
                placeholder="e.g. Binary Search"
                required
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Add Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
