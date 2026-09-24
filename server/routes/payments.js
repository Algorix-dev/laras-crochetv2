import crypto from 'crypto';
import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = Router();
const PAYSTACK_BASE = 'https://api.paystack.co';

// TIP: pulls "how did they pay" out of a Paystack transaction object
// (the same shape comes back from /transaction/verify and inside the
// charge.success webhook). Only the channel, card brand and last four
// digits are kept — never anything that could be used to charge the
// card again.
function paymentInfo(data = {}) {
  return {
    channel: data.channel,
    cardType: data.authorization?.card_type?.trim(),
    last4: data.authorization?.last4,
  };
}

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

// TIP: shipping prices live HERE on the server (same numbers as the
// Checkout Method section in src/pages/CheckoutPage.jsx). The browser
// only sends the NAME of the method ("standard" / "express"); the price
// is looked up here, so nobody can change what they pay for shipping by
// editing the request. If you change a price, change it in both files.
const SHIPPING_METHODS = {
  standard: 20440,
  express: 30440,
};

// POST /api/payments/initialize
// body: { customerName, customerEmail, customerPhone, shippingAddress, shippingMethod, items: [{productId, color, size, quantity}] }
router.post('/initialize', async (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, items } = req.body;
  const shippingMethod = SHIPPING_METHODS[req.body.shippingMethod] ? req.body.shippingMethod : 'standard';

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your bag is empty' });
  }

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

  // TIP: the checkout page shows "Total = items + shipping", so Paystack
  // must charge that same number. Before this, shipping was shown on the
  // page but never added here, so customers were charged items only.
  const shippingFee = SHIPPING_METHODS[shippingMethod];
  totalAmount += shippingFee;

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
    shippingMethod,
    shippingFee,
    totalAmount,
    paystackReference: paystackData.data.reference,
  });

  // TIP: authorizationUrl = the full-page Paystack checkout (fallback);
  // accessCode = what the in-page Payment popup on the checkout page uses.
  res.json({
    authorizationUrl: paystackData.data.authorization_url,
    accessCode: paystackData.data.access_code,
    reference: paystackData.data.reference,
  });
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
    // TIP: markPaid (in models/Order.js) flips pending -> paid, gives
    // the order its AG-YYYY-NNNN number, and does nothing if the
    // order was already paid — so refreshing this page later can't
    // undo a "shipped" or "delivered" status.
    const order = await Order.markPaid(reference, paymentInfo(paystackData.data));
    return res.json({ verified: true, order });
  }

  res.json({ verified: false });
});

// POST /api/payments/webhook
// TIP: verify above only runs if the customer's browser makes it back
// to /order-confirmation. If they pay and then close the tab, lose
// signal, or the redirect fails, that never happens and a PAID order
// would sit as "pending" forever. Paystack solves this by also
// calling this URL itself, server-to-server, whenever a payment
// succeeds — no browser involved. Set the URL in your Paystack
// dashboard (Settings → API Keys & Webhooks); test mode and live mode
// each have their own webhook URL.
//
// Anyone on the internet can POST to this URL, so the first job is
// proving the request really came from Paystack: they sign the raw
// request body with your secret key (HMAC SHA512) and send the result
// in the x-paystack-signature header. req.rawBody is captured in
// index.js, because the signature is over the exact bytes Paystack
// sent — re-stringifying the parsed JSON isn't guaranteed identical.
router.post('/webhook', async (req, res) => {
  const signature = req.get('x-paystack-signature');
  if (!signature || !req.rawBody) return res.sendStatus(400);

  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // timingSafeEqual (unlike ===) doesn't leak how much of the
  // signature matched, and throws if lengths differ — hence the check.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.sendStatus(401);
  }

  try {
    if (req.body.event === 'charge.success') {
      // Same helper as verify — safe if the redirect already handled
      // this payment, and safe if Paystack retries the webhook.
      await Order.markPaid(req.body.data.reference, paymentInfo(req.body.data));
    }
    // 200 for every correctly-signed event (even ones we ignore, or a
    // reference that isn't ours) so Paystack stops resending it.
    res.sendStatus(200);
  } catch (err) {
    console.error('Paystack webhook error:', err);
    // 500 tells Paystack to retry later, which is what we want if the
    // database was briefly unreachable.
    res.sendStatus(500);
  }
});

export default router;