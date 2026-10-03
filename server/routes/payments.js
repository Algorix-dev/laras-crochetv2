import crypto from 'crypto';
import mongoose from 'mongoose';
import { Router } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ShippingRate from '../models/ShippingRate.js';
import Coupon from '../models/Coupon.js';
import { subscribeEmail } from './newsletter.js';

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

// TIP: shipping prices now come from the database (models/ShippingRate.js),
// set by Lara on the admin Shipping page — one price per destination.
// The browser only sends WHERE it's going (shippingCountry + shippingState)
// and the NAME of the method ("standard" / "express"); the price is looked
// up here, so nobody can change what they pay for shipping by editing the
// request.

// POST /api/payments/initialize
// body: { customerName, customerEmail, customerPhone, shippingAddress, shippingCountry, shippingState, shippingMethod, items: [{productId, color, size, quantity}] }
router.post('/initialize', async (req, res) => {
  const { customerName, customerEmail, customerPhone, shippingAddress, shippingCountry, shippingState, items } = req.body;
  const shippingMethod = req.body.shippingMethod === 'express' ? 'express' : 'standard';

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your bag is empty' });
  }

  // TIP: recalculate the total from the DATABASE price, not whatever
  // the frontend sends. Never trust a price coming from the browser —
  // someone could edit it in devtools before the request is sent.
  let totalAmount = 0;
  const orderItems = [];
  for (const item of items) {
    // TIP: quantity comes from the browser, so it must be a whole number of
    // at least 1 — otherwise a negative or fractional quantity could lower
    // the total that Paystack charges.
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: 'Invalid quantity in your bag' });
    }
    if (!mongoose.isValidObjectId(item.productId)) {
      return res.status(400).json({ error: 'Invalid product in your bag' });
    }
    const product = await Product.findById(item.productId);
    if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
    totalAmount += product.price * quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      color: item.color,
      size: item.size,
      quantity,
    });
  }

  // TIP: discount code. The browser only sends the CODE; the discount is worked
  // out here from the database, so it can't be faked. It comes off the items
  // total only (never shipping). A bad code stops the payment with a clear
  // message rather than silently charging full price.
  let couponCode;
  let discountAmount = 0;
  const submittedCode = String(req.body.couponCode || '').trim().toUpperCase();
  if (submittedCode) {
    const coupon = await Coupon.findOne({ code: submittedCode });
    const problem = !coupon ? "That discount code isn't valid." : coupon.problemFor(totalAmount);
    if (problem) return res.status(400).json({ error: problem });
    discountAmount = coupon.discountFor(totalAmount);
    couponCode = coupon.code;
    totalAmount -= discountAmount;
  }

  // TIP: the checkout page shows "Total = items + shipping", so Paystack
  // must charge that same number. Before this, shipping was shown on the
  // page but never added here, so customers were charged items only.
  // Look up the price for THIS destination (most specific row wins:
  // state, then country, then the default). If the destination is
  // switched off, stop here before anything is charged or saved.
  let rate;
  try {
    rate = await ShippingRate.findRate(shippingCountry, shippingState);
  } catch (err) {
    console.error('Shipping lookup failed:', err);
    return res.status(500).json({ error: 'Could not work out shipping. Please try again.' });
  }
  if (!rate || !rate.active) {
    return res
      .status(400)
      .json({ error: "Sorry, we don't deliver to that location yet. Please contact us to arrange it." });
  }
  const shippingFee = rate[shippingMethod];
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
      // TIP: CLIENT_URL may hold several allowed sites separated by commas; the
      // customer must come back to the FIRST one (the live shop address).
      callback_url: `${(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()}/order-confirmation`,
    }),
  });
  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return res.status(502).json({ error: 'Could not start payment with Paystack' });
  }

  // TIP: "Email me with news and offers" on the checkout page. Ticking it
  // subscribes this email (and sends the welcome email); unticked does
  // nothing, so they never get newsletters. Never blocks the payment.
  if (req.body.newsletterOptIn === true) {
    subscribeEmail(customerEmail, 'checkout').catch((err) =>
      console.error('Checkout newsletter opt-in failed:', err)
    );
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
    couponCode,
    discountAmount,
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