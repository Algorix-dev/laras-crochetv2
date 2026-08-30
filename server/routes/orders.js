import { Router } from 'express';
import Order from '../models/Order.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();

// GET /api/orders/mine — the logged-in customer's own order history.
// TIP: matched by email rather than a stored customer reference,
// since Order was built before customer accounts existed — every
// order already saves customerEmail at checkout time, so this just
// reuses that instead of needing to migrate old orders.
router.get('/mine', requireCustomer, async (req, res) => {
  const orders = await Order.find({ customerEmail: req.customerEmail }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/track/:reference
// TIP: public on purpose — this is what powers the "order tracking"
// page on the storefront. A customer only needs their own reference
// number (from their confirmation email) to look it up, no login
// required. This is the same pattern most small e-commerce sites use.
router.get('/track/:reference', async (req, res) => {
  const order = await Order.findOne({ paystackReference: req.params.reference });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// GET /api/orders — admin-only, full order list for the dashboard
router.get('/', requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/orders/:id/status — admin updates status (e.g. "shipped")
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

export default router;
