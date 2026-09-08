import { useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { Problem, EmailSettings } from '../types';
import { isOverdue, isDueToday, todayStr } from '../utils/spacedRepetition';

const EMAIL_LAST_SENT_KEY = 'email-reminder-last-sent';

function formatProblemLine(p: Problem, isOverdueP: boolean): string {
  const flag = isOverdueP ? '⚠️ OVERDUE' : '📅 Due Today';
  return `${flag} — ${p.name} (${p.difficulty}, ${p.categories.join(' · ')}, Stage ${p.stage}/6)`;
}

export function useEmailReminder(problems: Problem[], settings: EmailSettings) {
  useEffect(() => {
    const { enabled, recipientEmail, serviceId, templateId, publicKey } = settings;
    if (!enabled || !recipientEmail || !serviceId || !templateId || !publicKey) return;

    const today = todayStr();
    if (localStorage.getItem(EMAIL_LAST_SENT_KEY) === today) return;

    const overdueList  = problems.filter(isOverdue);
    const dueTodayList = problems.filter(isDueToday);
    const allDue = [...overdueList, ...dueTodayList];
    if (allDue.length === 0) return;

    const problemsText = [
      ...overdueList.map(p => formatProblemLine(p, true)),
      ...dueTodayList.map(p => formatProblemLine(p, false)),
    ].join('\n');

    emailjs
      .send(
        serviceId,
        templateId,
        {
          to_email:      recipientEmail,
          date:          today,
          problem_count: allDue.length,
          overdue_count: overdueList.length,
          due_count:     dueTodayList.length,
          problems_list: problemsText,
        },
        publicKey
      )
      .then(() => {
        localStorage.setItem(EMAIL_LAST_SENT_KEY, today);
      })
      .catch(err => {
        console.error('EmailJS send failed:', err);
      });
  // Only run once per day on mount — intentionally omitting problems from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);
}
