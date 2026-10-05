import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// TIP: these are always available and can't be deleted.
export const BUILT_IN = [
  { slug: 'dresses', label: 'Dresses' },
  { slug: 'bikinis', label: 'Bikinis' },
  { slug: 'two-pieces', label: 'Two-Pieces' },
  { slug: 'shirts', label: 'Shirts' },
  { slug: 'skirts', label: 'Skirts' },
  { slug: 'accessories', label: 'Accessories' },
];

export async function allCategorySlugs() {
  const extra = await Category.find().select('slug');
  return [...BUILT_IN.map((c) => c.slug), ...extra.map((c) => c.slug)];
}

const toSlug = (label) =>
  label
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// GET /api/categories  (public) — built-in + Lara's own, in the order they were made
router.get('/', async (req, res) => {
  const extra = await Category.find().sort({ createdAt: 1 }).select('slug label');
  res.json([
    ...BUILT_IN.map((c) => ({ ...c, custom: false })),
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
  const doc = await Category.create({ slug, label });
  res.status(201).json({ slug: doc.slug, label: doc.label, custom: true });
});

// DELETE /api/categories/:slug — only her own, and only when no piece uses it
router.delete('/:slug', requireAdmin, async (req, res) => {
  const { slug } = req.params;
  if (BUILT_IN.some((c) => c.slug === slug)) return res.status(400).json({ error: "The built-in categories can't be removed." });
  const inUse = await Product.countDocuments({ category: slug });
  if (inUse) return res.status(400).json({ error: `${inUse} piece(s) still use this category. Move or delete them first.` });
  const gone = await Category.findOneAndDelete({ slug });
  if (!gone) return res.status(404).json({ error: 'Category not found.' });
  res.json({ ok: true });
});

export default router;
