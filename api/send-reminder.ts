import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const KV_KEY = 'tracker:data';

interface Problem {
  id: string;
  name: string;
  difficulty: string;
  category: string;
  stage: number;
  nextRevision: string | null;
}

interface EmailSettings {
  enabled: boolean;
  recipientEmail: string;
  serviceId: string;
  templateId: string;
  publicKey: string;
}

interface TrackerData {
  problems: Problem[];
  emailSettings: EmailSettings;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function isOverdue(p: Problem): boolean {
  if (!p.nextRevision || p.stage > 6) return false;
  return p.nextRevision < todayStr();
}

function isDueToday(p: Problem): boolean {
  if (!p.nextRevision || p.stage > 6) return false;
  return p.nextRevision === todayStr();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel automatically sends CRON_SECRET in the Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(500).json({ error: 'Redis not configured' });
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const raw = await redis.get<string>(KV_KEY);
    if (!raw) {
      return res.status(200).json({ message: 'No data in store yet — open the app first.' });
    }

    const data: TrackerData = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const { problems, emailSettings } = data;

    if (!emailSettings?.enabled) {
      return res.status(200).json({ message: 'Email reminders disabled.' });
    }

    const { recipientEmail, serviceId, templateId, publicKey } = emailSettings;
    if (!recipientEmail || !serviceId || !templateId || !publicKey) {
      return res.status(200).json({ message: 'Email settings incomplete.' });
    }

    const today = todayStr();
    const overdueList  = problems.filter(isOverdue);
    const dueTodayList = problems.filter(isDueToday);
    const allDue = [...overdueList, ...dueTodayList];

    if (allDue.length === 0) {
      return res.status(200).json({ message: 'No problems due today — nothing to send.' });
    }

    const problemsText = [
      ...overdueList.map(p  => `⚠️ OVERDUE  — ${p.name} (${p.difficulty}, ${p.category}, Stage ${p.stage}/6)`),
      ...dueTodayList.map(p => `📅 Due Today — ${p.name} (${p.difficulty}, ${p.category}, Stage ${p.stage}/6)`),
    ].join('\n');

    const slot = (req.query.slot as string) ?? 'morning';
    const sentKey = `sent:${today}:${slot}`;
    const alreadySent = await redis.get(sentKey);
    if (alreadySent) {
      return res.status(200).json({ message: `${slot} reminder already sent today.` });
    }

    const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  serviceId,
        template_id: templateId,
        user_id:     publicKey,
        template_params: {
          to_email:      recipientEmail,
          date:          today,
          problem_count: allDue.length,
          overdue_count: overdueList.length,
          due_count:     dueTodayList.length,
          problems_list: problemsText,
        },
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      throw new Error(`EmailJS error ${emailRes.status}: ${text}`);
    }

    // Mark this slot as sent for today (expires in 25h so it resets cleanly each day)
    await redis.set(sentKey, '1', { ex: 90000 });

    return res.status(200).json({
      message: `${slot} reminder sent — ${allDue.length} problem(s)`,
      date: today,
      slot,
    });
  } catch (err) {
    console.error('send-reminder failed:', err);
    return res.status(500).json({ error: String(err) });
  }
}
