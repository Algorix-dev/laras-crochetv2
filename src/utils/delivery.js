/*
  TIP: Every piece is handmade, so more pieces = more crochet time.
  Instead of a fixed "10–14 business days" no matter what's in the bag,
  the delivery window now grows with the total number of pieces.

  HOW TO TUNE IT (this is the only place you need to touch):
  - EXTRA_BUSINESS_DAYS_PER_PIECE: days added for every piece AFTER the
    first one. Ask Lara for her real number, then change it here.
  - The base windows (min/max for ONE piece) come from the checkout
    methods in CheckoutPage.jsx (Standard 10–14, Express 4–5).
*/
export const EXTRA_BUSINESS_DAYS_PER_PIECE = 3;

/* TIP: adds business days (skips Saturday + Sunday) to a start date. */
export function addBusinessDays(start, days) {
  const d = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

/* TIP: `base` is the window for ONE piece, e.g. { min: 10, max: 14 }.
   Returns the window for `pieces` pieces, in business days. */
export function businessDayWindow(base, pieces) {
  const extra = Math.max(0, pieces - 1) * EXTRA_BUSINESS_DAYS_PER_PIECE;
  return { min: base.min + extra, max: base.max + extra };
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/* Example output: "12 Oct – 19 Oct" */
export function formatDeliveryRange(base, pieces, from = new Date()) {
  const { min, max } = businessDayWindow(base, pieces);
  return `${dateFmt.format(addBusinessDays(from, min))} – ${dateFmt.format(
    addBusinessDays(from, max),
  )}`;
}

/* Example output: "10–14 business days" */
export function formatBusinessDays(base, pieces) {
  const { min, max } = businessDayWindow(base, pieces);
  return `${min}–${max} business days`;
}
