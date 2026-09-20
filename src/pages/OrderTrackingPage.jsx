/*
  TIP: The page a customer reaches by clicking a row in Order History
  (/account/orders/:id). It shows four things from Lara's Figma:
    1. Where the order is right now (a 4-step tracker),
    2. Tracking information (carrier, tracking number, ETA),
    3. The items in the order,
    4. Where it's going and how it was paid for.

  Everything comes from ONE call to GET /api/orders/:id, which only
  answers for the logged-in customer's own orders.
*/
import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { authenticatedFetch, normalizeProduct } from '../api';
import AccountLayout from '../components/AccountLayout';
import OrderStatusPill from '../components/OrderStatusPill';

const STAGES = ['Order received', 'In production', 'Packaging', 'Delivery'];

// TIP: which of the four steps each status lights up. "shipped" and
// "delivered" both live on the last step — shipped = it's on its way,
// delivered = that step is finished.
const STATUS_TO_STAGE = { paid: 0, in_production: 1, packaging: 2, shipped: 3, delivered: 3 };

// "January 9th 2026" — the format Lara's design uses for dates.
function formatLongDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${d.toLocaleDateString('en-US', { month: 'long' })} ${day}${suffix} ${d.getFullYear()}`;
}

// "The Reina Dress", "A and B", or "A and 2 other items" — fills the
// "(item name)" gap in Lara's message.
function summarizeItems(items = []) {
  // TIP: the same piece bought in two sizes is two entries — de-duplicate
  // so the message says "REINA", not "REINA and REINA".
  const names = [...new Set(items.map((item) => item.name).filter(Boolean))];
  if (names.length === 0) return 'your items';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} and ${names.length - 1} other items`;
}

const countItems = (order) => (order.items || []).reduce((n, item) => n + (item.quantity ?? 1), 0);

/*
  TIP: The first message is Lara's own wording from the design. The
  other three (production, packaging, delivery) weren't written in the
  mockup — those are placeholders in her voice, so worth reading them
  past her before launch.
*/
function stageText(stage, order) {
  const what = summarizeItems(order.items);
  if (stage === 0) {
    return `Your order for ${what} has been received on ${formatLongDate(order.createdAt)} and is on its way to production.`;
  }
  if (stage === 1) {
    return `Your order for ${what} is now being handmade. Every piece is crocheted with care, so this can take a little time.`;
  }
  if (stage === 2) {
    return `Your order for ${what} is finished and is being packed with care, ready to be sent to you.`;
  }
  if (order.status === 'delivered') {
    return `Your order for ${what} has been delivered. We hope you love it!`;
  }
  return `Your order for ${what} is on its way to you${order.carrier ? ` with ${order.carrier}` : ''}.`;
}

function StageMessage({ stage, order }) {
  return (
    <div className="space-y-4 text-sm leading-6 text-[var(--ink)]">
      <p>{stageText(stage, order)}</p>
      <p>Thank you for choosing Lara&apos;s Crochet.</p>
      <div>
        <p>Yours in love,</p>
        {/* TIP: the design signs off with Lara's script logo — swap this
            for her logo image when you have the asset. */}
        <p className="font-bold italic">Lara.</p>
      </div>
    </div>
  );
}

// state: 'done' | 'active' | 'todo'
function Dot({ state }) {
  if (state === 'active') {
    return (
      <span className="block h-8 w-8 rounded-full bg-emerald-400 ring-2 ring-emerald-300 ring-offset-2 ring-offset-[#fafafa]" />
    );
  }
  return <span className={`block h-6 w-6 rounded-full ${state === 'done' ? 'bg-emerald-400' : 'bg-[#d4d4d4]'}`} />;
}

function stageState(index, current, delivered) {
  if (index < current) return 'done';
  if (index === current) return delivered ? 'done' : 'active';
  return 'todo';
}

function describePayment(method) {
  if (!method?.channel) return { title: 'Paystack', detail: null };
  if (method.channel === 'card') {
    const brand = method.cardType ? method.cardType.split(' ')[0] : '';
    return {
      title: brand ? `${brand.charAt(0).toUpperCase()}${brand.slice(1).toLowerCase()} card` : 'Card',
      detail: method.last4 ? `Ending in ****${method.last4}` : null,
    };
  }
  const readable = method.channel.replace(/_/g, ' ');
  return { title: readable.charAt(0).toUpperCase() + readable.slice(1), detail: null };
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { isSignedIn } = useAuth();
  // TIP: same hook the order confirmation page uses, so prices here follow
  // whichever currency the customer's country selected (naira, dollar or
  // pound) instead of always showing ₦.
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'missing'

  useEffect(() => {
    const signInUrl = `/signin?redirect=${encodeURIComponent(`/account/orders/${id}`)}`;
    if (!isSignedIn) {
      navigate(signInUrl);
      return;
    }

    let cancelled = false;
    setState('loading');
    authenticatedFetch(`/api/orders/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          navigate(signInUrl);
          return;
        }
        // TIP: 404 covers "doesn't exist" AND "isn't yours" on purpose —
        // the customer just sees "couldn't find that order".
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        if (!cancelled) {
          setOrder(data);
          setState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setState('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [id, isSignedIn, navigate]);

  if (!isSignedIn) return null;

  const cancelled = order?.status === 'cancelled';
  const delivered = order?.status === 'delivered';
  const current = STATUS_TO_STAGE[order?.status] ?? 0;
  const hasTracking = order && (order.carrier || order.trackingNumber || order.estimatedDelivery);
  const payment = order ? describePayment(order.paymentMethod) : null;

  // TIP: shippingAddress is one comma-joined string from checkout
  // ("street, apartment, city, state, postcode, country"). Lara's
  // design shows it on two lines, so the first piece (the street) gets
  // its own line and the rest share the second.
  const [addressLine1, ...addressRest] = (order?.shippingAddress || '').split(', ');
  const addressLine2 = addressRest.join(', ');

  const items = (order?.items || []).map((item) => {
    const product = item.product && typeof item.product === 'object' ? normalizeProduct(item.product) : null;
    return { ...item, image: product?.image, categoryLabel: product?.categoryLabel };
  });

  // TIP: Figma titles this page "ORDER TRACKING" on mobile but keeps
  // "ORDER HISTORY" on desktop (the sub-heading below says Order
  // Tracking there).
  const title = (
    <>
      <span className="md:hidden">Order Tracking</span>
      <span className="hidden md:inline">Order History</span>
    </>
  );

  const searchField = (
    <label className="relative hidden md:block">
      <span className="sr-only">Search all orders</span>
      <input
        type="search"
        placeholder="Search all orders"
        className="border border-[var(--line)] py-2 pl-3 pr-9 text-xs outline-none focus:border-[var(--ink)]"
      />
      <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
    </label>
  );

  return (
    <AccountLayout active="orders" title={title} headerAction={searchField}>
      {state === 'loading' && (
        <div className="animate-pulse space-y-4 pt-4" aria-busy="true" aria-label="Loading order">
          <div className="h-5 w-40 rounded bg-[var(--line)]" />
          <div className="h-3 w-full max-w-md rounded bg-[var(--line)]" />
          <div className="h-3 w-2/3 max-w-sm rounded bg-[var(--line)]" />
        </div>
      )}

      {state === 'missing' && (
        <div>
          <p className="text-sm text-[var(--muted)]">We couldn&apos;t find that order.</p>
          <Link to="/account/orders" className="mt-2 inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:text-[var(--ink)]">
            ← Back to Order History
          </Link>
        </div>
      )}

      {state === 'ready' && order && (
        <div className="max-w-[870px]">
          <h2 className="hidden text-xl font-semibold text-[var(--ink)] md:block">Order Tracking</h2>

          {cancelled ? (
            <div className="py-8 text-sm leading-6 text-[var(--ink)]">
              <p>This order was cancelled.</p>
              <p className="mt-2 text-[var(--muted)]">
                If you think that&apos;s a mistake, please <Link to="/contact" className="underline underline-offset-2">get in touch</Link>.
              </p>
            </div>
          ) : (
            <>
              {/* ===== Desktop: horizontal stepper ===== */}
              <div className="hidden md:block">
                <div className="ml-9 mt-14 flex max-w-[560px] items-center">
                  {STAGES.map((label, i) => {
                    const s = stageState(i, current, delivered);
                    return (
                      <Fragment key={label}>
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                          <span className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap text-xs text-[var(--muted)]">
                            {label}
                          </span>
                          <Dot state={s} />
                          {s === 'active' && (
                            <span aria-hidden="true" className="absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center">
                              <span className="mt-2 h-32 border-l-2 border-dashed border-[#d4d4d4]" />
                              <ChevronDown size={16} className="-mt-2 text-[#c4c4c4]" />
                            </span>
                          )}
                        </div>
                        {i < STAGES.length - 1 && (
                          <div className={`mx-2 h-0.5 flex-1 ${i < current || (delivered && i < 3) ? 'bg-emerald-400' : 'bg-[#e5e5e5]'}`} />
                        )}
                      </Fragment>
                    );
                  })}
                </div>
                <div className={`pb-10 ${delivered ? 'mt-10' : 'mt-44'}`}>
                  <StageMessage stage={current} order={order} />
                </div>
              </div>

              {/* ===== Mobile: vertical timeline ===== */}
              <ol className="md:hidden">
                {STAGES.map((label, i) => {
                  const s = stageState(i, current, delivered);
                  const showMessage = s === 'active' || (delivered && i === current);
                  return (
                    <li key={label} className="pt-6 first:pt-2">
                      <p className="pl-1 text-sm text-[var(--muted)]">{label}</p>
                      <div className="mt-3 flex gap-2.5">
                        <div className="flex w-[42px] shrink-0 flex-col items-center">
                          <Dot state={s} />
                          <span className="mt-2 flex-1 border-l-2 border-dashed border-[#d4d4d4]" />
                        </div>
                        <div className={showMessage ? 'pb-6 pt-1' : 'min-h-[64px]'}>
                          {showMessage && <StageMessage stage={i} order={order} />}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {/* ===== Tracking information (only once there's something to show) ===== */}
          {hasTracking && (
            <section className="mt-8 border-t border-[var(--line)] pt-8 md:mt-0" data-auto-rise="true">
              <h2 className="text-xl font-semibold text-[var(--ink)]">Tracking Information</h2>
              <div className="mt-6 space-y-5 text-sm text-[var(--ink)]">
                {(order.carrier || order.trackingNumber) && (
                  <div>
                    {order.carrier && <p className="font-semibold">{order.carrier}</p>}
                    {order.trackingNumber && <p className="text-[var(--ink)]/75">{order.trackingNumber}</p>}
                  </div>
                )}
                <div>
                  <p className="font-semibold">Status</p>
                  <div className="mt-1.5"><OrderStatusPill status={order.status} /></div>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="font-semibold">Estimated Delivery</p>
                    <p className="mt-1 text-[var(--ink)]/75">{formatLongDate(order.estimatedDelivery)}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ===== Order items ===== */}
          <section className="mt-8 border-t border-[var(--line)] pt-8 md:mt-10" data-auto-rise="true">
            <h2 className="text-xl font-semibold text-[var(--ink)]">Order Items</h2>

            {/* Desktop column headings */}
            <div className="mt-6 hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1fr] border-b border-[var(--line)] pb-3 text-xs text-[var(--muted)] md:grid">
              <span>Item</span>
              <span>Size</span>
              <span>Color</span>
              <span>Quantity</span>
            </div>

            <ul>
              {items.map((item, i) => (
                <li key={item._id || i} className="border-b border-[var(--line)] py-5 md:py-3">
                  {/* Desktop row */}
                  <div className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1fr] items-center md:grid">
                    <div className="flex items-center gap-8">
                      <div className="flex h-[118px] w-[124px] shrink-0 items-center justify-center bg-white">
                        {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-contain" />}
                      </div>
                      <div className="text-sm">
                        {item.categoryLabel && (
                          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{item.categoryLabel}</p>
                        )}
                        <p className="font-bold text-black">{item.name}</p>
                        <p className="mt-1 text-[var(--ink)]/80">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--ink)]">{item.size}</span>
                    <span className="text-sm font-semibold text-[var(--maroon-dark)]">{item.color}</span>
                    <span className="text-xs font-bold text-[var(--ink)]">{item.quantity ?? 1}</span>
                  </div>

                  {/* Mobile card */}
                  <div className="grid grid-cols-[132px_1fr] gap-x-4 md:hidden">
                    <div className="flex items-center justify-center bg-white">
                      {item.image && <img src={item.image} alt={item.name} className="aspect-[3/4] w-full object-contain" />}
                    </div>
                    <div className="text-sm">
                      {item.categoryLabel && (
                        <p className="text-xs uppercase text-[var(--muted)]">{item.categoryLabel}</p>
                      )}
                      <p className="font-bold text-[var(--maroon-dark)]">{item.name}</p>
                      <p className="mt-3 text-[var(--ink)]/80">{formatPrice(item.price)}</p>
                      <p className="mt-3 text-[var(--ink)]/80">Size <span className="font-bold text-[var(--maroon-dark)]">{item.size}</span></p>
                      <p className="text-[var(--ink)]/80">Color <span className="font-bold text-[var(--maroon-dark)]">{item.color}</span></p>
                      {(item.quantity ?? 1) > 1 && (
                        <p className="text-[var(--ink)]/80">Quantity <span className="font-bold text-[var(--maroon-dark)]">{item.quantity}</span></p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between py-6 text-sm">
              <p className="text-base font-semibold text-[var(--maroon-dark)]">
                {countItems(order)} {countItems(order) === 1 ? 'Item' : 'Items'}
              </p>
              <p className="text-[var(--ink)]">Total: {formatPrice(order.totalAmount)}</p>
            </div>
          </section>

          {/* ===== Shipping address + payment method ===== */}
          <section className="grid gap-10 border-y border-[var(--line)] py-8 md:grid-cols-2" data-auto-rise="true">
            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)]">Shipping Address</h2>
              <div className="mt-6 space-y-4 text-sm text-[var(--ink)]">
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="mt-1 text-[var(--ink)]/80">{addressLine1}</p>
                  {addressLine2 && <p className="text-[var(--ink)]/80">{addressLine2}</p>}
                </div>
                <div>
                  <p className="font-semibold">Phone Number</p>
                  <p className="mt-1 text-[var(--ink)]/80">{order.customerPhone}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[var(--ink)]">Payment Method</h2>
              <div className="mt-6 text-sm text-[var(--ink)]">
                <p className="font-semibold">{payment.title}</p>
                {payment.detail && <p className="mt-1 text-[var(--ink)]/80">{payment.detail}</p>}
                <p className="text-[var(--ink)]/80">Total: {formatPrice(order.totalAmount)}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </AccountLayout>
  );
}