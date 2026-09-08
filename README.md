# My Neet Tracker

**🚀 Live app: [my-neet-tracker-git-main-boluwatife010s-projects.vercel.app](https://my-neet-tracker-git-main-boluwatife010s-projects.vercel.app/)**

A personal spaced-repetition revision tracker firstly for the NeetCode 150 problem set (once done with the 150 problems continue and expand this application to fit in Leet and HackerRank). The basic idea is to solve a problem once and then I let the app remind me when to revisit it as increasing intervals drive the knowledge into long-term memory.

## Features

- **Spaced Repetition** — 6-stage schedule (1 → 2 → 4 → 7 → 14 → 30 days) it automatically advances each time you mark a problem as revised. After stage 6 the problem is marked **Mastered** (or something).
- **Confidence Rating** — 1–5 star rating per problem, editable anytime.
- **Dashboard** — stats cards (total / due today / overdue / mastered), 30-day activity streak bar, and urgency-colour-coded problem cards.
- **Three Views** — _Today_ (overdue + due today + coming-up), _All Problems_ (filterable by category & difficulty), _Schedule_ (next 7 days).
- **Browser Notifications** — requests permission on first visit; sends a daily notification when problems are due or overdue.
- **Export / Import** — one-click JSON backup and restore.
- **Pre-loaded** — ships with all 14 of my first 14 solved problems already in the tracker.

## Problem Schedule

| Stage | Interval |
| ----- | -------- |
| 1     | 1 day    |
| 2     | 2 days   |
| 3     | 4 days   |
| 4     | 7 days   |
| 5     | 14 days  |
| 6     | 30 days  |
| 7+    | Mastered |

## Tech Stack

| Layer       | Technology            |
| ----------- | --------------------- |
| Framework   | React 18 + TypeScript |
| Build tool  | Vite 5                |
| Styling     | Tailwind CSS 3        |
| Persistence | localStorage (no BE)  |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm 9+

### Install & run

```bash
# Clone or download the repo
cd MyNeetTracker

# Install dependencies
npm install

# Start the dev server (http://localhost:5173)
npm run dev
```

### Build for production

```bash
npm run build    # outputs to dist/
npm run preview  # serve the dist/ folder locally
```

## Project Structure

```
src/
├── components/
│   ├── AddProblemModal.tsx   # Modal form for adding a new problem
│   ├── DaySchedule.tsx       # 7-day schedule view
│   ├── ProblemCard.tsx       # Individual problem card with all controls
│   ├── StatsGrid.tsx         # Dashboard stats (4 stat tiles)
│   └── StreakBar.tsx         # 30-day activity streak bar
├── hooks/
│   ├── useProblems.ts        # All problem state + localStorage sync
│   └── useNotifications.ts   # Browser Notification API wrapper
├── types/
│   └── index.ts              # Shared TypeScript types
├── utils/
│   ├── spacedRepetition.ts   # Stage intervals, due/overdue helpers
│   └── storage.ts            # localStorage read/write, export/import
├── App.tsx                   # Root component — layout, tabs, routing
└── main.tsx                  # React entry point
```

## Data Backup

Click **Export ↓** in the header to download your data as JSON. To restore, click **Import ↑** and choose the file. All data lives in `localStorage` under the key `neetcode-tracker-v1`.

## Pre-loaded Problems

| Category         | Problems                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Arrays & Hashing | Contains Duplicate · Valid Anagram · Two Sum · Group Anagrams · Top K Frequent Elements · Encode and Decode Strings · Product of Array Except Self · Valid Sudoku · Longest Consecutive Sequence |
| Two Pointers     | Valid Palindrome · Two Sum II · 3Sum · Container With Most Water · Trapping Rain Water                                                                                                           |
