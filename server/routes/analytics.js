import { Router } from 'express';
import Visit from '../models/Visit.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// Lara and the shop are in Nigeria, so "a day" means a Lagos day.
// Change this if the shop ever moves to another time zone.
const TIME_ZONE = 'Africa/Lagos';

// ── tiny per-IP limiter for the public ping route ──
// A real visitor pings about once a minute. This just stops one machine
// flooding the collection with made-up visitorIds.
const hits = new Map(); // ip -> { count, resetAt }
const MAX_PINGS_PER_MINUTE = 30;

function tooMany(req) {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + MINUTE });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PINGS_PER_MINUTE;
}

// forget old limiter entries so the Map can't grow without end
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (entry.resetAt < now) hits.delete(ip);
}, 5 * MINUTE).unref();

const floorToMinute = (ms) => new Date(Math.floor(ms / MINUTE) * MINUTE);

// POST /api/analytics/ping — public. Body: { visitorId, path }
router.post('/ping', async (req, res) => {
  const { visitorId, path } = req.body || {};

  if (typeof visitorId !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(visitorId)) {
    return res.status(400).json({ error: 'Invalid visitor id' });
  }
  const cleanPath = typeof path === 'string' ? path.slice(0, 200) : '/';
  // the admin's own visits (and preview pages) never count as shop visitors
  if (cleanPath.startsWith('/admin')) return res.status(204).end();
  if (tooMany(req)) return res.status(429).json({ error: 'Too many requests' });

  try {
    await Visit.updateOne(
      { visitorId, minute: floorToMinute(Date.now()) },
      { $set: { path: cleanPath } },
      { upsert: true }
    );
  } catch (err) {
    // two pings landing in the same instant can both try to create the same
    // minute's document; the loser hits the unique index — that's fine
    if (err.code !== 11000) console.error('ping failed:', err.message);
  }
  res.status(204).end();
});

// GET /api/analytics/summary — admin only. Everything the dashboard needs:
//   live:  { last30, perMinute[30] }   people right now + one bar per minute
//   days:  { "2026-09-21": 42, ... }   distinct visitors per (Lagos) day, last 15 days
//   last7 / prev7                      distinct visitors this week vs the week before
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const now = Date.now();
    const nowMinute = floorToMinute(now).getTime();
    const since30 = new Date(nowMinute - 29 * MINUTE);

    const [perMinuteRows, last30Ids, dayRows, last7Rows, prev7Rows] = await Promise.all([
      Visit.aggregate([
        { $match: { minute: { $gte: since30 } } },
        { $group: { _id: '$minute', n: { $sum: 1 } } },
      ]),
      Visit.distinct('visitorId', { minute: { $gte: since30 } }),
      Visit.aggregate([
        { $match: { minute: { $gte: new Date(now - 15 * DAY) } } },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$minute', timezone: TIME_ZONE } },
              v: '$visitorId',
            },
          },
        },
        { $group: { _id: '$_id.day', n: { $sum: 1 } } },
      ]),
      Visit.aggregate([
        { $match: { minute: { $gte: new Date(now - 7 * DAY) } } },
        { $group: { _id: '$visitorId' } },
        { $count: 'n' },
      ]),
      Visit.aggregate([
        { $match: { minute: { $gte: new Date(now - 14 * DAY), $lt: new Date(now - 7 * DAY) } } },
        { $group: { _id: '$visitorId' } },
        { $count: 'n' },
      ]),
    ]);

    const byMinute = new Map(perMinuteRows.map((row) => [new Date(row._id).getTime(), row.n]));
    const perMinute = Array.from({ length: 30 }, (_, i) => byMinute.get(nowMinute - (29 - i) * MINUTE) || 0);

    res.json({
      live: { last30: last30Ids.length, perMinute },
      days: Object.fromEntries(dayRows.map((row) => [row._id, row.n])),
      last7: last7Rows[0]?.n || 0,
      prev7: prev7Rows[0]?.n || 0,
      timeZone: TIME_ZONE,
    });
  } catch (err) {
    console.error('analytics summary failed:', err.message);
    res.status(500).json({ error: 'Could not load visitor numbers' });
  }
});

export default router;
