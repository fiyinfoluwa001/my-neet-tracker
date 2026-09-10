import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const KV_KEY = 'tracker:data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Skip gracefully if Redis env vars are not configured (local dev)
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const { problems, emailSettings } = req.body as {
      problems: unknown;
      emailSettings: unknown;
    };

    await redis.set(KV_KEY, JSON.stringify({ problems, emailSettings }));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Sync failed:', err);
    return res.status(500).json({ error: 'Failed to sync data' });
  }
}
