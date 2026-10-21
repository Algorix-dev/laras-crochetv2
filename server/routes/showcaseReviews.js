import { Router } from 'express';
import ShowcaseReviews from '../models/ShowcaseReviews.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// TIP: the home-page animation is built for exactly 9 reviews (3 rows of 3). Keep in step with
// SHOWCASE_REVIEW_COUNT in src/data/showcaseReviews.js.
const COUNT = 9;

// GET /api/showcase-reviews — public. Empty list = "use the built-in reviews".
router.get('/', async (req, res) => {
  try {
    const doc = await ShowcaseReviews.findById('showcase');
    const items = doc?.items?.length === COUNT ? doc.items.map((i) => ({ name: i.name, quote: i.quote })) : [];
    res.json({ items });
  } catch (err) {
    console.error('Showcase reviews load failed:', err);
    res.json({ items: [] });
  }
});

// PUT /api/showcase-reviews — admin only. Body: { items: [{ name, quote } x 9] } (replaces the whole list).
router.put('/', requireAdmin, async (req, res) => {
  try {
    const raw = req.body?.items;
    if (!Array.isArray(raw) || raw.length !== COUNT) {
      return res.status(400).json({ error: `The home page shows exactly ${COUNT} reviews.` });
    }
    const items = raw.map((i) => ({
      name: String(i?.name || '').trim(),
      quote: String(i?.quote || '').trim(),
    }));
    const bad = items.findIndex((i) => !i.name || !i.quote);
    if (bad !== -1) return res.status(400).json({ error: `Review ${bad + 1} needs both a name and a review.` });
    if (items.some((i) => i.name.length > 60 || i.quote.length > 300)) {
      return res.status(400).json({ error: 'A name can be up to 60 characters and a review up to 300.' });
    }
    await ShowcaseReviews.findByIdAndUpdate('showcase', { items }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ items });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
