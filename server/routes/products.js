import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { allCategorySlugs } from './categories.js';

const router = Router();

// ── Public routes — the storefront (ShopPage, ProductGrid, homepage)
// calls these. No login required, since customers browse freely. ──

// GET /api/products?category=dresses&placement=hero
router.get('/', async (req, res) => {
  const { category, placement } = req.query;
  const filter = { isActive: true };
  if (category && category !== 'all') filter.category = category;
  if (placement) filter.placements = placement; // e.g. 'hero' or 'featured'

  const products = await Product.find(filter).sort({ createdAt: -1 });
  // TIP: the hero is shown in the order Lara chose (Home Hero page). Pieces she hasn't placed yet
  // (heroOrder empty) come last, newest first. Array.sort is stable, so that newest-first order holds.
  if (placement === 'hero') {
    const rank = (p) => (Number.isFinite(p.heroOrder) ? p.heroOrder : 1e9);
    products.sort((a, b) => rank(a) - rank(b));
  }
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

const ANGLES = ['front', 'left', 'right', 'back'];
// TIP: the most pieces the home page hero holds. Keep in step with MAX_HERO_PIECES in src/api.js.
const MAX_HERO_PIECES = 5;

// TIP: tidies what the admin page sends. `views` is cut down to the four
// known angles, and images[0] is kept equal to views.front so anything
// older that still reads `images[0]` keeps showing the front photo.
// TIP: the tags Lara can pick from on the product form. Add or rename here, then add the
// same words to PRODUCT_TAGS in src/admin/pages/ProductFormPage.jsx so they show in the list.
const TAGS = ['New', 'Bestseller', 'Limited edition', 'Back in stock', 'Made to order'];
const HEX = /^#[0-9a-f]{6}$/i;

function tidyProduct(body) {
  const data = { ...body };

  // pricing extras
  if ('salePrice' in body) {
    const n = Number(body.salePrice);
    data.salePrice = body.salePrice === null || body.salePrice === '' || !Number.isFinite(n) || n <= 0 ? null : n;
  }
  for (const key of ['saleStart', 'saleEnd']) {
    if (key in body) {
      const d = body[key] ? new Date(body[key]) : null;
      data[key] = d && !Number.isNaN(d.getTime()) ? d : null;
    }
  }
  if ('taxIncluded' in body) data.taxIncluded = body.taxIncluded !== false;
  if ('tag' in body) data.tag = TAGS.includes(body.tag) ? body.tag : '';
  if (body.viewBg && typeof body.viewBg === 'object') {
    const bg = {};
    for (const angle of ANGLES) bg[angle] = HEX.test(body.viewBg[angle] || '') ? body.viewBg[angle] : '';
    data.viewBg = bg;
  }
  if (body.views && typeof body.views === 'object') {
    const views = {};
    for (const angle of ANGLES) {
      views[angle] = typeof body.views[angle] === 'string' ? body.views[angle] : '';
    }
    data.views = views;
    if (views.front) data.images = [views.front];
  }

  // Lara's own colors / shades: keep only { name, hex } with a real hex code.
  for (const key of ['colorOptions', 'shadeOptions']) {
    if (Array.isArray(body[key])) {
      data[key] = body[key]
        .filter((o) => o && typeof o.name === 'string' && o.name.trim() && /^#[0-9a-f]{6}$/i.test(o.hex))
        .map((o) => ({ name: o.name.trim(), hex: o.hex }));
    }
  }
  return data;
}

// A sale price has to be lower than the normal price, and the end can't be before the start.
function pricingProblem(product) {
  const sale = Number(product.salePrice);
  if (product.salePrice != null && Number.isFinite(sale) && sale >= Number(product.price)) {
    return 'The discounted price must be lower than the normal price.';
  }
  if (product.saleStart && product.saleEnd && new Date(product.saleEnd) < new Date(product.saleStart)) {
    return 'The sale end date is before its start date.';
  }
  return null;
}

// A hero piece must have a front-facing photo — it is what the hero
// shows in the middle. (Older products count their images[0] as the front.)
function heroProblem(product) {
  const wantsHero = product.placements?.includes('hero');
  const front = product.views?.front || product.images?.[0];
  return wantsHero && !front ? 'A piece on the hero needs a front-facing photo.' : null;
}

// PUT /api/products/hero/order   body: { ids: ['<id>', '<id>', ...] }
// TIP — THE HOME HERO PAGE SAVES HERE. The list IS the hero: exactly these pieces, in this order.
// Anything not in the list is taken off the hero (it stays in the shop). Defined before the
// '/:id' routes so it can never be mistaken for a product id.
router.put('/hero/order', requireAdmin, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : null;
    if (!ids) return res.status(400).json({ error: 'Send the hero pieces as a list.' });
    if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'A piece can only be on the hero once.' });
    if (ids.length > MAX_HERO_PIECES) return res.status(400).json({ error: `The hero holds up to ${MAX_HERO_PIECES} pieces. Remove ${ids.length - MAX_HERO_PIECES} to save.` });
    if (!ids.every((id) => mongoose.isValidObjectId(id))) return res.status(400).json({ error: 'One of those pieces is not valid.' });

    const pieces = await Product.find({ _id: { $in: ids }, isActive: true });
    if (pieces.length !== ids.length) return res.status(400).json({ error: 'One of those pieces no longer exists. Refresh and try again.' });
    const noFront = pieces.find((p) => !(p.views?.front || p.images?.[0]));
    if (noFront) return res.status(400).json({ error: `${noFront.name} needs a front-facing photo before it can go on the hero.` });

    // take the hero off everything that isn't in the list...
    await Product.updateMany({ placements: 'hero', _id: { $nin: ids } }, { $pull: { placements: 'hero' }, $set: { heroOrder: null } });
    // ...then put the listed pieces on it, in order
    if (ids.length) {
      await Product.bulkWrite(
        ids.map((id, index) => ({
          updateOne: { filter: { _id: id }, update: { $addToSet: { placements: 'hero' }, $set: { heroOrder: index } } },
        }))
      );
    }
    res.json({ ids });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = tidyProduct(req.body);
    const problem = heroProblem(data) || pricingProblem(data);
    if (problem) return res.status(400).json({ error: problem });
    if (!(await allCategorySlugs()).includes(data.category)) return res.status(400).json({ error: 'Choose a valid category.' });
    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const data = tidyProduct(req.body);
    if (data.category !== undefined && !(await allCategorySlugs()).includes(data.category)) {
      return res.status(400).json({ error: 'Choose a valid category.' });
    }

    // check the hero rule against what the product will look like AFTER the
    // update, even if this request only sent some of the fields
    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    const problem = heroProblem({ ...existing.toObject(), ...data }) || pricingProblem({ ...existing.toObject(), ...data });
    if (problem) return res.status(400).json({ error: problem });

    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true, // return the UPDATED document, not the original
      runValidators: true, // re-check schema rules (e.g. category enum) on update
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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