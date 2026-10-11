import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// TIP: these start out available. Lara can delete them from the admin too (a removed marker is
// saved in the Category collection, see below), and add them back later by creating one with the same name.
export const BUILT_IN = [
  { slug: 'dresses', label: 'Dresses' },
  { slug: 'bikinis', label: 'Bikinis' },
  { slug: 'two-pieces', label: 'Two-Pieces' },
  { slug: 'shirts', label: 'Shirts' },
  { slug: 'skirts', label: 'Skirts' },
  { slug: 'accessories', label: 'Accessories' },
];

// the built-in slugs Lara has deleted
async function removedBuiltIns() {
  const gone = await Category.find({ removed: true }).select('slug');
  return new Set(gone.map((c) => c.slug));
}

export async function allCategorySlugs() {
  const [extra, gone] = await Promise.all([Category.find({ removed: { $ne: true } }).select('slug'), removedBuiltIns()]);
  return [...BUILT_IN.filter((c) => !gone.has(c.slug)).map((c) => c.slug), ...extra.map((c) => c.slug)];
}

const toSlug = (label) =>
  label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// GET /api/categories  (public) — built-in (minus any she deleted) + Lara's own, in the order they were made
router.get('/', async (req, res) => {
  const [extra, gone] = await Promise.all([
    Category.find({ removed: { $ne: true } }).sort({ createdAt: 1 }).select('slug label'),
    removedBuiltIns(),
  ]);
  res.json([
    ...BUILT_IN.filter((c) => !gone.has(c.slug)).map((c) => ({ ...c, custom: false })),
    ...extra.map((c) => ({ slug: c.slug, label: c.label, custom: true })),
  ]);
});

// POST /api/categories  body: { label }
router.post('/', requireAdmin, async (req, res) => {
  const label = typeof req.body?.label === 'string' ? req.body.label.trim().slice(0, 40) : '';
  if (label.length < 2) return res.status(400).json({ error: 'Give the category a name (at least 2 letters).' });
  const slug = toSlug(label);
  if (!slug) return res.status(400).json({ error: 'Use letters or numbers in the name.' });
  if ((await allCategorySlugs()).includes(slug)) return res.status(400).json({ error: 'That category already exists.' });
  // adding back a built-in category she deleted earlier: clear its removed marker first
  await Category.deleteOne({ slug, removed: true });
  const doc = await Category.create({ slug, label });
  res.status(201).json({ slug: doc.slug, label: doc.label, custom: true });
});

// DELETE /api/categories/:slug — any category, but only when no piece uses it
router.delete('/:slug', requireAdmin, async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase();
  const isBuiltIn = BUILT_IN.some((c) => c.slug === slug);
  const exists = (await allCategorySlugs()).includes(slug);
  if (!exists) return res.status(404).json({ error: 'Category not found.' });
  const inUse = await Product.countDocuments({ category: slug });
  if (inUse) {
    return res.status(400).json({
      error: `${inUse} piece${inUse === 1 ? ' still uses' : 's still use'} this category. Move or delete ${inUse === 1 ? 'it' : 'them'} first.`,
    });
  }
  if (isBuiltIn) {
    // built-ins aren't stored, so save a marker that keeps it hidden
    const label = BUILT_IN.find((c) => c.slug === slug).label;
    await Category.findOneAndUpdate({ slug }, { slug, label, removed: true }, { upsert: true });
  } else {
    await Category.deleteOne({ slug });
  }
  res.json({ ok: true });
});

export default router;
