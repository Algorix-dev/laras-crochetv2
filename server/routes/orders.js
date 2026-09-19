import { Router } from 'express';
import mongoose from 'mongoose';
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
  // TIP: `pending` = the customer started checkout but hasn't paid
  // (initializePayment saves the order BEFORE sending them to
  // Paystack), so abandoned checkouts would otherwise show up in
  // their order history as if they were real orders.
  const orders = await Order.find({
    customerEmail: req.customerEmail,
    status: { $ne: 'pending' },
  }).sort({ createdAt: -1 });
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

// GET /api/orders/:id — ONE of the logged-in customer's own orders
// (powers the Order Tracking page they reach from Order History).
// TIP: this is deliberately NOT public like /track/:reference. It only
// returns an order whose customerEmail matches the logged-in customer,
// and answers "not found" for anyone else's — so nobody can read a
// stranger's name, phone and address by guessing ids or order
// numbers. It must stay below /mine, or Express would treat the word
// "mine" as an :id.
router.get('/:id', requireCustomer, async (req, res) => {
  // TIP: findOne with a malformed id throws a CastError, which would
  // crash an async route — so reject anything that isn't a real
  // ObjectId up front.
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const order = await Order.findOne({
    _id: req.params.id,
    customerEmail: req.customerEmail,
    status: { $ne: 'pending' },
  }).populate('items.product', 'images category'); // for each item's photo + category label
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
  // TIP: findByIdAndUpdate skips the schema's enum check by default,
  // so without this an admin (or a typo in the dashboard) could save
  // any string as a status and the customer's Order History would
  // show a mystery pill. Checking against the model's own enum list
  // means this stays correct if a status is ever added to the model.
  if (!Order.schema.path('status').enumValues.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

export default router;