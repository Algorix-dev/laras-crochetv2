import { Router } from 'express';
import ShippingRate from '../models/ShippingRate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// TIP: a price is a whole number of Naira, 0 or more. Number('') is 0,
// so a BLANK price would sneak through as "free shipping" if we only
// checked the number — hence the explicit check that something real
// was typed. (Typing 0 on purpose is fine and means free.)
const isPrice = (v) =>
  (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) &&
  Number.isInteger(Number(v)) &&
  Number(v) >= 0;

// GET /api/shipping/quote?country=NG&state=Lagos   (public)
// TIP: the checkout page calls this whenever the customer changes their
// country/state, to show the right Standard/Express price. The price
// that is actually CHARGED is looked up again in routes/payments.js —
// this route is only for display, so it can't be used to cheat.
router.get('/quote', async (req, res) => {
  try {
    const rate = await ShippingRate.findRate(req.query.country, req.query.state);
    if (!rate || !rate.active) return res.json({ available: false });
    res.json({ available: true, standard: rate.standard, express: rate.express });
  } catch (err) {
    console.error('Shipping quote failed:', err);
    res.status(500).json({ error: 'Could not load shipping prices' });
  }
});

const publicShape = ({ country, state, standard, express, active }) => ({
  country,
  state,
  standard,
  express,
  active,
});

// GET /api/shipping/rates   (admin) — every row, for the admin page
router.get('/rates', requireAdmin, async (req, res) => {
  try {
    await ShippingRate.ensureDefault();
    const rates = await ShippingRate.find().sort({ country: 1, state: 1 }).lean();
    res.json(rates.map(publicShape));
  } catch (err) {
    console.error('Loading shipping rates failed:', err);
    res.status(500).json({ error: 'Could not load shipping prices' });
  }
});

// PUT /api/shipping/rates   (admin)
// body: { rates: [{ country, state, standard, express, active }] }
// TIP: this REPLACES the whole list with what the admin page sends:
// rows in the list are created/updated, rows missing from it are
// deleted (that's how Lara "clears" a state back to the default).
// The default row (country '*') must always be included.
router.put('/rates', requireAdmin, async (req, res) => {
  const { rates } = req.body;
  if (!Array.isArray(rates)) return res.status(400).json({ error: 'rates must be a list' });

  const clean = [];
  const seen = new Set();
  for (const r of rates) {
    const country = String(r.country || '').trim().toUpperCase();
    const state = String(r.state || '').trim();
    const standard = Number(r.standard);
    const express = Number(r.express);
    const label = country === '*' ? 'the default rate' : state ? `${state}, ${country}` : country;

    if (!country) return res.status(400).json({ error: 'A row is missing its country' });
    if (!isPrice(r.standard) || !isPrice(r.express)) {
      return res.status(400).json({ error: `Prices must be whole numbers (₦) — check ${label}` });
    }
    const key = `${country}|${state.toLowerCase()}`;
    if (seen.has(key)) return res.status(400).json({ error: `${label} is listed twice` });
    seen.add(key);
    clean.push({ country, state, standard, express, active: r.active !== false });
  }

  if (!clean.some((r) => r.country === '*' && r.state === '')) {
    return res.status(400).json({ error: 'The default rate is required' });
  }

  try {
    await ShippingRate.bulkWrite([
      ...clean.map((r) => ({
        updateOne: { filter: { country: r.country, state: r.state }, update: { $set: r }, upsert: true },
      })),
      {
        deleteMany: {
          filter: { $nor: clean.map((r) => ({ country: r.country, state: r.state })) },
        },
      },
    ]);
    const saved = await ShippingRate.find().sort({ country: 1, state: 1 }).lean();
    res.json(saved.map(publicShape));
  } catch (err) {
    console.error('Saving shipping rates failed:', err);
    res.status(500).json({ error: 'Could not save shipping prices' });
  }
});

export default router;
