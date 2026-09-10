import { useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Problem, EmailSettings } from '../types';
import { isOverdue, isDueToday, todayStr } from '../utils/spacedRepetition';

// WAT = UTC+1. Cron fires at 09:00 UTC (10am WAT) and 19:00 UTC (8pm WAT).
// Browser fallback kicks in 30 min after the scheduled window opens, giving
// the cron time to fire first.
const MORNING_FALLBACK_HOUR = 10; // 10:30am WAT → we check at 10am local
const EVENING_FALLBACK_HOUR = 20; // 8pm WAT

type Slot = 'morning' | 'evening';

function currentSlot(): Slot | null {
  const hour = new Date().getHours();
  if (hour >= MORNING_FALLBACK_HOUR && hour < EVENING_FALLBACK_HOUR) return 'morning';
  if (hour >= EVENING_FALLBACK_HOUR) return 'evening';
  return null; // too early — cron will handle it, don't touch
}

function fallbackKey(slot: Slot): string {
  return `browser-fallback-${todayStr()}-${slot}`;
}

function formatProblemLine(p: Problem, isOverdueP: boolean): string {
  const flag = isOverdueP ? '⚠️ OVERDUE' : '📅 Due Today';
  return `${flag} — ${p.name} (${p.difficulty}, ${p.categories.join(' · ')}, Stage ${p.stage}/6)`;
}

async function cronAlreadySent(slot: Slot): Promise<boolean> {
  try {
    const res = await fetch(`/api/sent-today?slot=${slot}`);
    const data = (await res.json()) as { sent: boolean; configured: boolean };
    // If Redis isn't configured yet, `configured` is false — treat as "not sent"
    // so the browser can act as fallback
    return data.configured && data.sent;
  } catch {
    // API unreachable (local dev or network error) → let browser send
    return false;
  }
}

async function sendFallbackEmail(
  problems: Problem[],
  settings: EmailSettings,
  slot: Slot
): Promise<void> {
  const key = fallbackKey(slot);
  if (localStorage.getItem(key)) return; // already sent this slot today

  const alreadySent = await cronAlreadySent(slot);
  if (alreadySent) return; // cron handled it — nothing to do

  const overdueList  = problems.filter(isOverdue);
  const dueTodayList = problems.filter(isDueToday);
  const allDue = [...overdueList, ...dueTodayList];
  if (allDue.length === 0) return;

  const problemsText = [
    ...overdueList.map(p  => formatProblemLine(p, true)),
    ...dueTodayList.map(p => formatProblemLine(p, false)),
  ].join('\n');

  const { recipientEmail, serviceId, templateId, publicKey } = settings;

  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email:      recipientEmail,
      date:          todayStr(),
      problem_count: allDue.length,
      overdue_count: overdueList.length,
      due_count:     dueTodayList.length,
      problems_list: problemsText,
    },
    publicKey
  );

  // Mark this slot as sent so the fallback doesn't fire again today
  localStorage.setItem(key, '1');
}

export function useEmailReminder(problems: Problem[], settings: EmailSettings) {
  // Keep a ref so the async callback always reads the latest problems without
  // re-triggering the effect on every problem change
  const problemsRef = useRef(problems);
  useEffect(() => { problemsRef.current = problems; }, [problems]);

  useEffect(() => {
    const { enabled, recipientEmail, serviceId, templateId, publicKey } = settings;
    if (!enabled || !recipientEmail || !serviceId || !templateId || !publicKey) return;

    const slot = currentSlot();
    if (!slot) return; // before 10am — cron hasn't fired yet, stay quiet

    sendFallbackEmail(problemsRef.current, settings, slot).catch(err => {
      console.error('Fallback email failed:', err);
    });
  }, [settings]);
}
