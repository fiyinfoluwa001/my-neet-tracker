import { useEffect, useCallback } from 'react';
import { Problem } from '../types';
import { isOverdue, isDueToday, todayStr } from '../utils/spacedRepetition';

const PERM_REQUESTED_KEY = 'notif-permission-requested';
const LAST_NOTIF_KEY = 'notif-last-sent-date';

export function useNotifications(problems: Problem[]) {
  const overdueCount = problems.filter(isOverdue).length;
  const dueTodayCount = problems.filter(isDueToday).length;

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Request permission once on first visit
  useEffect(() => {
    if (!localStorage.getItem(PERM_REQUESTED_KEY)) {
      // Small delay so the page has rendered before the browser dialog appears
      const t = setTimeout(() => {
        requestPermission();
        localStorage.setItem(PERM_REQUESTED_KEY, '1');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [requestPermission]);

  // Send a single daily notification when there are due / overdue problems
  useEffect(() => {
    const hasWork = overdueCount > 0 || dueTodayCount > 0;
    if (!hasWork) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const today = todayStr();
    if (localStorage.getItem(LAST_NOTIF_KEY) === today) return;

    const title = overdueCount > 0 ? '🔴 Overdue Problems!' : '📚 Time to Review!';
    const body =
      overdueCount > 0
        ? `${overdueCount} overdue problem${overdueCount > 1 ? 's' : ''} need your attention.`
        : `${dueTodayCount} problem${dueTodayCount > 1 ? 's are' : ' is'} due today.`;

    new Notification(title, { body, icon: '/favicon.svg' });
    localStorage.setItem(LAST_NOTIF_KEY, today);
  }, [overdueCount, dueTodayCount]);

  return { overdueCount, dueTodayCount, requestPermission };
}
