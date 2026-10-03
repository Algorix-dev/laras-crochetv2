import mongoose from 'mongoose';

// TIP: a discount code Lara creates in the admin. The checkout asks the
// server about a code (POST /api/coupons/validate) and the server applies the
// discount again when the payment starts, so the price can never be changed
// from the browser.
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 }, // % (0-100) or naira
    minOrder: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    used: { type: Number, default: 0 }, // counted when an order is PAID, not when checkout starts
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Why a code can't be used right now — or null when it's fine.
couponSchema.methods.problemFor = function (subtotal) {
  if (!this.active) return 'This code is not active.';
  if (this.expiresAt && this.expiresAt.getTime() + 24 * 60 * 60 * 1000 <= Date.now()) {
    return 'This code has expired.'; // valid through the whole expiry day
  }
  if (this.usageLimit && this.used >= this.usageLimit) return 'This code has been used up.';
  if (subtotal < (this.minOrder || 0)) {
    return `This code needs an order of at least ₦${this.minOrder.toLocaleString()}.`;
  }
  return null;
};

// Naira taken off the ITEMS total (shipping is never discounted).
couponSchema.methods.discountFor = function (subtotal) {
  const raw = this.type === 'percent' ? (subtotal * Math.min(this.value, 100)) / 100 : this.value;
  return Math.max(0, Math.min(Math.round(raw), subtotal));
};

export default mongoose.model('Coupon', couponSchema);
