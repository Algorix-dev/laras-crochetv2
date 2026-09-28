/*
  TIP: ONE place for delivery times. Change a number here and the Bag
  page AND the Checkout page both update.

  HOW TO TUNE IT:
  - DELIVERY_WINDOWS: how many days from the order date the parcel
    should arrive (Standard 10-14, Express 4-5).
  - EXTRA_DAYS_PER_PIECE: extra days added for every piece AFTER the
    first. It is 0 now, so every order gets the same window no matter
    how many pieces are in the bag. Set it to e.g. 2 once Lara tells
    you how much longer a bigger order really takes.
  - COUNT_BUSINESS_DAYS: false = plain calendar days (weekends count).
    true = skip Saturdays and Sundays when counting.
*/
export const DELIVERY_WINDOWS = {
  standard: { min: 10, max: 14 },
  express: { min: 4, max: 5 },
};

export const EXTRA_DAYS_PER_PIECE = 0;
export const COUNT_BUSINESS_DAYS = false;

/* Adds days to a start date, either plain calendar days or business
   days (skipping Saturday + Sunday), depending on the switch above. */
export function addDays(start, days) {
  const d = new Date(start);
  if (!COUNT_BUSINESS_DAYS) {
    d.setDate(d.getDate() + days);
    return d;
  }
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

/* `base` is the window for ONE piece, e.g. { min: 10, max: 14 }.
   Returns the window for `pieces` pieces. Defaults mean calling it
   with no arguments can never crash. */
export function deliveryWindow(base = DELIVERY_WINDOWS.standard, pieces = 1) {
  const extra = Math.max(0, pieces - 1) * EXTRA_DAYS_PER_PIECE;
  return { min: base.min + extra, max: base.max + extra };
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/* Example output: "12 Oct – 16 Oct" */
export function formatDeliveryRange(base = DELIVERY_WINDOWS.standard, pieces = 1, from = new Date()) {
  const { min, max } = deliveryWindow(base, pieces);
  return `${dateFmt.format(addDays(from, min))} – ${dateFmt.format(addDays(from, max))}`;
}

/* Example output: "10–14 days" (or "10–14 business days" if that switch is on) */
export function formatDeliveryDays(base = DELIVERY_WINDOWS.standard, pieces = 1) {
  const { min, max } = deliveryWindow(base, pieces);
  return `${min}–${max} ${COUNT_BUSINESS_DAYS ? 'business days' : 'days'}`;
}

/* Kept so CheckoutPage.jsx keeps working without any edits. */
export const formatBusinessDays = formatDeliveryDays;