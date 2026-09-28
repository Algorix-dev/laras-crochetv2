import mongoose from 'mongoose';

// TIP: SHIPPING PRICES PER DESTINATION — Lara edits these in the admin
// (Shipping page). One row = one place:
//   country '*'  + state ''      -> the DEFAULT, used for anywhere not listed
//   country 'NG' + state ''      -> Nigeria-wide price
//   country 'NG' + state 'Lagos' -> just that state
//   country 'GH' + state ''      -> another country
// The most specific row wins (state, then country, then default).
// All prices are whole Naira, because Paystack charges in Naira.
const DEFAULT_STANDARD = 20440;
const DEFAULT_EXPRESS = 30440;

const shippingRateSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, uppercase: true },
    state: { type: String, trim: true, default: '' },
    standard: { type: Number, required: true, min: 0 },
    express: { type: Number, required: true, min: 0 },
    // active:false = "we don't deliver here" (checkout blocks it)
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

shippingRateSchema.index({ country: 1, state: 1 }, { unique: true });

// TIP: on a brand-new database there are no rows yet. Rather than
// leaving checkout with no shipping price at all, the very first lookup
// creates the default row using the old hardcoded numbers, so nothing
// changes for customers until Lara edits it.
shippingRateSchema.statics.ensureDefault = async function () {
  const exists = await this.exists({ country: '*', state: '' });
  if (exists) return;
  await this.updateOne(
    { country: '*', state: '' },
    { $setOnInsert: { standard: DEFAULT_STANDARD, express: DEFAULT_EXPRESS, active: true } },
    { upsert: true }
  );
};

// TIP: returns the most specific row for a destination (or null). The
// caller must still check `rate.active` — a state row can exist with
// active:false, which means "not delivering there".
shippingRateSchema.statics.findRate = async function (country, state) {
  await this.ensureDefault();
  const c = String(country || '').trim().toUpperCase();
  const s = String(state || '').trim();

  if (c && s) {
    // case-insensitive, so "lagos" and "Lagos" are the same place
    const byState = await this.findOne({ country: c, state: s }).collation({ locale: 'en', strength: 2 });
    if (byState) return byState;
  }
  if (c) {
    const byCountry = await this.findOne({ country: c, state: '' });
    if (byCountry) return byCountry;
  }
  return this.findOne({ country: '*', state: '' });
};

export default mongoose.models.ShippingRate || mongoose.model('ShippingRate', shippingRateSchema);
