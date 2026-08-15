import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = Router();
const PAYSTACK_BASE = 'https://api.paystack.co';

// TIP: Paystack works in two steps, and BOTH must happen on the
// backend, never the frontend:
//   1. INITIALIZE — you tell Paystack "customer X wants to pay
//      amount Y," and it hands back a checkout URL to redirect to.
//   2. VERIFY — after the customer pays, you ask Paystack "did this
//      reference actually get paid?" before you trust it. Never mark
//      an order as paid just because the frontend SAYS the user
//      finished checkout — that could be faked. Verification is what
//      makes the payment trustworthy.
// Your secret key (PAYSTACK_SECRET_KEY) must never be sent to the
// browser — that's why both calls below happen here on the server.

// POST /api/payments/initialize
// body: { customerName, customerEmail, customerPhone, shippingAddress, items: [{productId, color, size, quantity}] }
router.post('/initialize', async (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, items } = req.body;

  // TIP: recalculate the total from the DATABASE price, not whatever
  // the frontend sends. Never trust a price coming from the browser —
  // someone could edit it in devtools before the request is sent.
  let totalAmount = 0;
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
    totalAmount += product.price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
    });
  }

  const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: customerEmail,
      amount: totalAmount * 100, // Paystack expects kobo, not naira
      callback_url: `${process.env.CLIENT_URL}/order-confirmation`,
    }),
  });
  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return res.status(502).json({ error: 'Could not start payment with Paystack' });
  }

  // Save the order now as "pending" — verify() flips it to "paid"
  await Order.create({
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    items: orderItems,
    totalAmount,
    paystackReference: paystackData.data.reference,
  });

  res.json({ authorizationUrl: paystackData.data.authorization_url });
});

// GET /api/payments/verify/:reference
// TIP: Paystack redirects the customer back to your callback_url with
// ?reference=xxx in the URL. Your frontend reads that and calls this
// route to confirm payment actually went through before showing a
// "success" screen or updating order status.
router.get('/verify/:reference', async (req, res) => {
  const { reference } = req.params;

  const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const paystackData = await paystackRes.json();

  if (paystackData.data?.status === 'success') {
    const order = await Order.findOneAndUpdate(
      { paystackReference: reference },
      { status: 'paid' },
      { new: true }
    );
    return res.json({ verified: true, order });
  }

  res.json({ verified: false });
});

export default router;
