import { currentPrice } from '../utils/pricing.js';
import { Router } from 'express';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// POST /api/coupons/validate   body: { code, items: [{productId, quantity}] }  (public)
// TIP: the subtotal is worked out HERE from database prices, never taken from
// the browser. Returns what the discount would be so the checkout can show it.
router.post('/validate', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!code) return res.status(400).json({ error: 'Enter a discount code first.' });

    let subtotal = 0;
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(qty) || qty < 1) continue;
      const product = await Product.findById(item.productId).select('price');
      if (product) subtotal += currentPrice(product) * qty;
    }

    const coupon = await Coupon.findOne({ code });
    // Same message for "doesn't exist" so codes can't be guessed one by one.
    if (!coupon) return res.status(404).json({ error: "That code isn't valid." });
    const problem = coupon.problemFor(subtotal);
    if (problem) return res.status(400).json({ error: problem });

    res.json({ code: coupon.code, type: coupon.type, value: coupon.value, discount: coupon.discountFor(subtotal) });
  } catch (err) {
    console.error('Coupon validate failed:', err);
    res.status(500).json({ error: 'Could not check that code. Please try again.' });
  }
});

/* ---------- admin ---------- */

function clean(body) {
  const code = String(body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);
  const type = body?.type === 'fixed' ? 'fixed' : 'percent';
  const value = Number(body?.value);
  if (!code) return { error: 'Enter a code (letters and numbers).' };
  if (!Number.isFinite(value) || value <= 0) return { error: 'Enter a discount amount above 0.' };
  if (type === 'percent' && value > 100) return { error: 'A percentage can be at most 100.' };
  const minOrder = Math.max(0, Number(body?.minOrder) || 0);
  const usageLimit = Math.max(0, Math.floor(Number(body?.usageLimit) || 0));
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return { error: 'That expiry date is not valid.' };
  return { data: { code, type, value, minOrder, usageLimit, expiresAt, active: body?.active !== false } };
}

// GET /api/coupons
router.get('/', requireAdmin, async (req, res) => {
  res.json(await Coupon.find().sort({ createdAt: -1 }));
});

// POST /api/coupons
router.post('/', requireAdmin, async (req, res) => {
  const { data, error } = clean(req.body);
  if (error) return res.status(400).json({ error });
  try {
    res.status(201).json(await Coupon.create(data));
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'You already have a coupon with that code.' });
    console.error('Coupon create failed:', err);
    res.status(500).json({ error: 'Could not save the coupon.' });
  }
});

// PUT /api/coupons/:id   (also used for the Active on/off switch)
router.put('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Coupon not found' });
  const { data, error } = clean(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const doc = await Coupon.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ error: 'Coupon not found' });
    res.json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'You already have a coupon with that code.' });
    console.error('Coupon update failed:', err);
    res.status(500).json({ error: 'Could not save the coupon.' });
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Coupon not found' });
  const doc = await Coupon.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Coupon not found' });
  res.json({ ok: true });
});

export default router;
