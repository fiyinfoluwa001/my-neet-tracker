import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // If Redis is not configured, tell the browser it can send as fallback
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(200).json({ sent: false, configured: false });
  }

  const today = new Date().toISOString().split('T')[0];
  const slot  = (req.query.slot as string) ?? 'morning';

  try {
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const value = await redis.get(`sent:${today}:${slot}`);
    return res.status(200).json({ sent: Boolean(value), configured: true });
  } catch {
    return res.status(200).json({ sent: false, configured: false });
  }
}
