import mongoose from 'mongoose';

// TIP: the prefix in Lara's mockup ("AG" in #AG-2026-0001). Change it
// here if it should be something else, e.g. "LC" for Lara's Crochet.
// Only affects orders numbered from now on.
const ORDER_PREFIX = 'AG';

// TIP: a tiny one-document-per-year counter (e.g. _id "order-2026").
// findOneAndUpdate with $inc is ATOMIC in MongoDB, so two customers
// checking out at the same moment can never get the same number —
// counting existing orders and adding 1 could.
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

// TIP: orderItems store a snapshot of the product's name/price/color/size
// AT THE TIME OF PURCHASE, rather than just a reference to the Product.
// This matters: if Lara later changes a product's price, past orders
// shouldn't retroactively change — an order is a historical record.
const orderSchema = new mongoose.Schema(
  {
    // TIP: the short, customer-facing number shown in Order History
    // (#AG-2026-0001). It's assigned when payment is confirmed (see
    // markPaid below), so pending/abandoned checkouts don't have one.
    // `sparse` matters: those orders — and any that existed before
    // this field — have no orderNumber, and a plain unique index would
    // treat all of them as duplicate "nulls" and fail to build.
    // paystackReference is untouched and still what you use to verify
    // payments.
    orderNumber: { type: String, unique: true, sparse: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        color: String,
        size: String,
        quantity: { type: Number, default: 1 },
      },
    ],
    totalAmount: { type: Number, required: true },
    // TIP: Paystack's own transaction reference — this is what you use
    // later to look up or verify a payment, and what powers order tracking.
    paystackReference: { type: String, required: true, unique: true },
    // TIP: in_production and packaging are the two steps between "paid"
    // and "shipped" on the Order Tracking page. Lara sets them from the
    // admin dashboard (PUT /api/orders/:id/status). In the customer's
    // Order History list they all show as the same "Received" pill —
    // only the tracking page tells the finer stages apart.
    status: {
      type: String,
      enum: ['pending', 'paid', 'in_production', 'packaging', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    // TIP: all optional — nothing sets these yet. Once Lara picks a
    // logistics company, the dashboard can fill them in and the
    // "Tracking Information" section on the tracking page appears
    // automatically for orders that have any of them.
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    // TIP: how the customer paid, copied from Paystack's response when
    // payment is confirmed (channel is "card", "bank_transfer", "ussd"
    // and so on; last4 is only the last four card digits, never the
    // full number).
    paymentMethod: {
      channel: String,
      cardType: String,
      last4: String,
    },
  },
  { timestamps: true }
);

// TIP: the payment-confirmed step, shared by BOTH places that learn a
// payment succeeded: the customer's redirect (GET /verify/:reference)
// and Paystack's own server-to-server webhook (POST /webhook). On a
// normal payment both fire within moments of each other, so this has
// to be safe when two calls arrive at once. It:
//   1. Only ever moves pending -> paid. Opening the confirmation link
//      again later (or a webhook retry) can't knock a "shipped" or
//      "delivered" order back to "paid".
//   2. Claims that pending -> paid change atomically FIRST. Exactly one
//      caller wins the claim, and only the winner takes a number from
//      the counter — so two simultaneous calls can't burn a number.
//   3. Gives the order its AG-YYYY-NNNN number at this moment, not when
//      checkout starts, so abandoned checkouts never use up numbers.
// (A document hook can't do this: findOneAndUpdate skips them.)
orderSchema.statics.markPaid = async function (reference, payment = {}) {
  const update = { status: 'paid' };
  if (payment.channel) update.paymentMethod = payment;
  const claimed = await this.findOneAndUpdate(
    { paystackReference: reference, status: 'pending' },
    update,
    { new: true }
  );

  if (claimed) {
    // We won the claim, so numbering this order is our job.
    try {
      const year = new Date().getFullYear();
      const counter = await Counter.findOneAndUpdate(
        { _id: `order-${year}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const orderNumber = `${ORDER_PREFIX}-${year}-${String(counter.seq).padStart(4, '0')}`;
      return await this.findOneAndUpdate(
        { _id: claimed._id, orderNumber: { $exists: false } },
        { orderNumber },
        { new: true }
      );
    } catch (err) {
      // The payment DID succeed — never report failure just because
      // numbering hiccupped. The order stays paid without a number
      // (Order History falls back to the Paystack reference).
      console.error(`Order numbering failed for ${reference}:`, err);
      return claimed;
    }
  }

  // Someone else already moved this order on: the other of
  // webhook/redirect, a page refresh, or a later status. If it's paid
  // but the winner hasn't attached the number yet, give it a moment
  // (~1s max) so we return the order WITH its number.
  let order = await this.findOne({ paystackReference: reference });
  for (let i = 0; order && order.status === 'paid' && !order.orderNumber && i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    order = await this.findOne({ paystackReference: reference });
  }
  return order;
};

export default mongoose.model('Order', orderSchema);