import { Router } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

// "Amara Okonkwo" -> "Amara O."  (full surnames are never shown publicly)
function publicName(rawName, email) {
  const base = (rawName || '').trim() || email.split('@')[0];
  const [first, ...rest] = base.split(/\s+/);
  return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first;
}

// A paid order for this piece = eligible. Returns the matching order line (or null).
async function purchasedLine(email, productId) {
  const order = await Order.findOne({
    customerEmail: email,
    status: { $nin: ['pending', 'cancelled'] },
    'items.product': productId,
  }).sort({ createdAt: -1 });
  return order?.items.find((i) => String(i.product) === String(productId)) || null;
}

// GET /api/reviews/product/:id  (public) — approved reviews + the average
router.get('/product/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.json({ reviews: [], count: 0, average: 0 });
  const reviews = await Review.find({ product: req.params.id, status: 'approved' })
    .sort({ createdAt: -1 })
    .select('reviewerName rating title text fit variant createdAt');
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  res.json({ reviews, count, average: Math.round(average * 10) / 10 });
});

// GET /api/reviews/can-review/:id  (customer) — shows the "Write a review" button or not
router.get('/can-review/:id', requireCustomer, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.json({ canReview: false, reason: 'invalid' });
  if (await Review.exists({ product: req.params.id, customerEmail: req.customerEmail })) {
    return res.json({ canReview: false, reason: 'already' });
  }
  const line = await purchasedLine(req.customerEmail, req.params.id);
  res.json(line ? { canReview: true } : { canReview: false, reason: 'not-purchased' });
});

// POST /api/reviews  (customer)  body: { productId, rating, title, text, fit }
router.post('/', requireCustomer, async (req, res) => {
  try {
    const { productId } = req.body || {};
    const rating = Number(req.body?.rating);
    const text = clip(req.body?.text, 2000);
    const title = clip(req.body?.title, 120);
    const fit = ['small', 'true', 'large'].includes(req.body?.fit) ? req.body.fit : 'true';

    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ error: 'Product not found.' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Choose a star rating.' });
    if (text.length < 5) return res.status(400).json({ error: 'Please write a few words about the piece.' });

    const line = await purchasedLine(req.customerEmail, productId);
    if (!line) return res.status(403).json({ error: 'Only customers who bought this piece can review it.' });

    const [product, user] = await Promise.all([
      Product.findById(productId).select('name'),
      User.findById(req.customerId).select('username'),
    ]);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    await Review.create({
      product: productId,
      productName: product.name,
      customerEmail: req.customerEmail,
      reviewerName: publicName(user?.username, req.customerEmail),
      rating,
      title,
      text,
      fit,
      variant: [line.color, line.size && `Size ${line.size}`].filter(Boolean).join(' · '),
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "You've already reviewed this piece." });
    console.error('Review submit failed:', err);
    res.status(500).json({ error: 'Could not save your review. Please try again.' });
  }
});

/* ---------- admin ---------- */

// GET /api/reviews  — everything, newest first
router.get('/', requireAdmin, async (req, res) => {
  res.json(await Review.find().sort({ createdAt: -1 }));
});

// PATCH /api/reviews/:id/status   body: { status: pending|approved|hidden }
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!Review.schema.path('status').enumValues.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Review not found' });
  const doc = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Review not found' });
  res.json(doc);
});

// DELETE /api/reviews/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Review not found' });
  const doc = await Review.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Review not found' });
  res.json({ ok: true });
});

export default router;
