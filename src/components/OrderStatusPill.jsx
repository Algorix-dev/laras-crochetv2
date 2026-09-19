/*
  TIP: The status pill, pulled out of OrderHistoryPage so the Order
  History list and the Order Tracking page show the exact same pill
  for the same order instead of two copies that could drift apart.

  Figma only draws three pills (Received / Shipping / Delivered), so
  the finer tracking stages all share one: paid, in_production and
  packaging show as "Received" (that's "we have your order, it isn't
  on its way yet"), and only the tracking page's stepper tells them
  apart. `pending` and `cancelled` have no pill in the design, so they
  fall back to a neutral pill showing the raw status — and an
  unexpected value can never break a row.
*/
const RECEIVED = { label: 'Received', pill: 'border-pink-200 bg-pink-50 text-pink-700', dot: 'bg-pink-500' };

const STATUS_PILLS = {
  paid: RECEIVED,
  in_production: RECEIVED,
  packaging: RECEIVED,
  shipped: { label: 'Shipping', pill: 'border-blue-200 bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  delivered: { label: 'Delivered', pill: 'border-green-200 bg-green-50 text-green-700', dot: 'bg-green-500' },
};

const FALLBACK_PILL = {
  pill: 'border-[var(--line)] bg-white text-[var(--muted)]',
  dot: 'bg-[var(--muted)]',
};

export default function OrderStatusPill({ status }) {
  const key = String(status || '').toLowerCase();
  const known = STATUS_PILLS[key];
  const style = known || FALLBACK_PILL;
  const raw = key.replace(/_/g, ' ');
  const label = known?.label || (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '—');
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${style.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}