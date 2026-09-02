import { Router } from 'express';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// ── Public routes — the storefront (ShopPage, ProductGrid, homepage)
// calls these. No login required, since customers browse freely. ──

// GET /api/products?category=dresses
router.get('/', async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };
  if (category && category !== 'all') filter.category = category;

  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ── Admin routes — everything below requires requireAdmin, which
// checks the JWT before any of these handlers even run. ──

// POST /api/products
router.post('/', requireAdmin, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// PUT /api/products/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // return the UPDATED document, not the original
    runValidators: true, // re-check schema rules (e.g. category enum) on update
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// DELETE /api/products/:id
// TIP: this doesn't actually delete — it flips isActive to false.
// A "soft delete" like this means Lara can't accidentally lose a
// product forever, and past orders that reference this product
// still make sense when you look back at them later.
router.delete('/:id', requireAdmin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deactivated', product });
});

export default router;
