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

/* ============================================================
   NEW: PER-CATEGORY PRODUCTION + SHIPPING (Lara's rules)

   Everything ABOVE this line is the old single-window system. It is kept
   only so any page that still imports it keeps working; move each page to
   the functions below, then delete the old ones.

   HOW LARA'S RULES BECOME CODE
   - Every category has its OWN production window (PRODUCTION_DAYS).
     Weekends count for production (calendar days).
   - Custom orders use the dresses window.
   - An order takes as long as its SLOWEST piece (the longest window in the
     bag), because she works on several pieces at once.
   - More than 3 pieces: add EXTRA_DAYS_OVER_THREE (7) days.
   - Shipping is separate from production and only counts WORKING days
     (Mon-Fri). It is 2-7 working days depending on where it is going;
     SHIPPING_WORKING_DAYS is a single provisional range until the courier
     confirms real numbers per location.
   - Express (4-5 days) exists ONLY for accessories, so it is offered only
     when every piece in the bag has an express window (EXPRESS_PRODUCTION).
   ============================================================ */

/* Used for any category that has no number yet: Lara's own fallback is
   the longest timeline on her site, 21 days. */
export const FALLBACK_PRODUCTION = { min: 21, max: 21 };

/* PASTE LARA'S PER-CATEGORY WEBSITE TIMELINES HERE (production only, in
   days). `null` = "not sent yet" and uses FALLBACK_PRODUCTION above.
   Her accessories and shirts numbers were still to come. */
export const PRODUCTION_DAYS = {
  dresses: null,
  'two-pieces': null,
  skirts: null,
  shirts: null,
  bikinis: null,
  accessories: null,
  custom: null, // custom orders: same as dresses (see productionFor)
};

/* Express windows. Only categories listed here can be sent express. */
export const EXPRESS_PRODUCTION = {
  accessories: { min: 4, max: 5 },
};

/* Working days (Mon-Fri) for the courier, by default for everywhere.
   PROVISIONAL: 2-7 is Lara's range "depending on location"; replace with
   per-country/state numbers once the courier confirms. */
export const SHIPPING_WORKING_DAYS = { min: 2, max: 7 };

export const BIG_ORDER_THRESHOLD = 3; // "above 3 items"
export const EXTRA_DAYS_OVER_THREE = 7;

const categoryOf = (item) => item?.product?.category || item?.category || '';

function productionFor(category, method = 'standard') {
  if (method === 'express') return EXPRESS_PRODUCTION[category] || null;
  const key = category === 'custom' ? 'dresses' : category;
  return PRODUCTION_DAYS[key] || PRODUCTION_DAYS[category] || FALLBACK_PRODUCTION;
}

/* items = the cart lines ({ product: { category }, quantity }). */
export function pieceCount(items = []) {
  return items.reduce((n, item) => n + (item.quantity ?? 1), 0);
}

/* Express is offered only if EVERY piece has an express window. */
export function expressAvailable(items = []) {
  return items.length > 0 && items.every((item) => Boolean(EXPRESS_PRODUCTION[categoryOf(item)]));
}

/* Production window for the whole order: the slowest piece, plus 7 days
   when the order has more than 3 pieces. */
export function productionWindow(items = [], method = 'standard') {
  if (!items.length) return productionFor('dresses', 'standard');
  let min = 0;
  let max = 0;
  for (const item of items) {
    const w = productionFor(categoryOf(item), method) || productionFor(categoryOf(item), 'standard');
    min = Math.max(min, w.min);
    max = Math.max(max, w.max);
  }
  const extra = pieceCount(items) > BIG_ORDER_THRESHOLD ? EXTRA_DAYS_OVER_THREE : 0;
  return { min: min + extra, max: max + extra };
}

export function addCalendarDays(start, days) {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d;
}

export function addWorkingDays(start, days) {
  const d = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

/* Everything a page needs in one call. */
export function estimateDelivery(items = [], method = 'standard', from = new Date()) {
  const useMethod = method === 'express' && expressAvailable(items) ? 'express' : 'standard';
  const production = productionWindow(items, useMethod);
  const shipping = SHIPPING_WORKING_DAYS;
  return {
    method: useMethod,
    production,
    shipping,
    earliest: addWorkingDays(addCalendarDays(from, production.min), shipping.min),
    latest: addWorkingDays(addCalendarDays(from, production.max), shipping.max),
  };
}

const range = (w, unit) => (w.min === w.max ? `${w.min} ${unit}` : `${w.min}–${w.max} ${unit}`);

/* "21 days" or "3–5 days" */
export const formatProduction = (estimate) => range(estimate.production, 'days');
/* "2–7 working days" */
export const formatShipping = (estimate) => range(estimate.shipping, 'working days');
/* "12 Oct – 2 Nov" */
export const formatArrival = (estimate) =>
  `${dateFmt.format(estimate.earliest)} – ${dateFmt.format(estimate.latest)}`;