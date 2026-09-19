/*
  TIP: The EMPTY state and the POPULATED state are both in her design
  now. The populated state is a 4-column table on desktop (Reference
  Number, Date, Progress, Number of Items + a chevron that opens the
  Order Tracking page) and collapses to Reference Number + Progress +
  chevron on mobile.
*/
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AccountLayout from '../components/AccountLayout';
import OrderStatusPill from '../components/OrderStatusPill';

/*
  TIP: Figma's table is 4 equal columns + a narrow chevron column
  (~52px) that sits OUTSIDE the header underline. On mobile, Date and
  Number of Items are hidden, so the same grid just has 2 equal
  columns + the chevron. Every row (header, skeleton, real rows) uses
  this one template so the columns can never drift apart.
*/
const ROW_GRID =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.25rem] md:grid-cols-[repeat(4,minmax(0,1fr))_3.25rem]';

/*
  TIP: Figma shows dates as "Wed 1:00pm". That's ambiguous for an order
  from three months ago, so orders from the last week use Figma's
  format and older ones get a real date.
*/
function formatOrderDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(' ', '')
    .toLowerCase();
  const withinWeek = Date.now() - d.getTime() < 6 * 24 * 60 * 60 * 1000;
  if (withinWeek) {
    return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${time}`;
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const countItems = (order) =>
  (order.items || []).reduce((n, item) => n + (item.quantity ?? 1), 0);

export default function OrderHistoryPage() {
  const { isSignedIn, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/signin?redirect=/account/orders');
      return;
    }

    async function fetchOrders() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setOrders(await res.json());
      } catch {
        // TIP: fails quietly to the empty state rather than an error
        // screen — if the backend isn't reachable yet (e.g. still
        // setting up MongoDB), the page still shows something sane.
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [isSignedIn, token, navigate]);

  if (!isSignedIn) return null;

  /* TIP: the Figma shows this search field even in the empty state,
     not just once orders exist. On mobile the navbar's own search
     takes its place. */
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
    <AccountLayout active="orders" title="Order History" headerAction={searchField}>
      {loading ? (
        <div aria-busy="true" aria-label="Loading orders" className="animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${ROW_GRID} min-h-[72px] items-center`}>
              <div className="px-5 md:px-6"><div className="h-3.5 w-28 rounded bg-[var(--line)]" /></div>
              <div className="hidden px-6 md:block"><div className="h-3 w-24 rounded bg-[var(--line)]" /></div>
              <div className="px-5 md:px-6"><div className="h-5 w-20 rounded-full bg-[var(--line)]" /></div>
              <div className="hidden px-6 md:block"><div className="h-3 w-6 rounded bg-[var(--line)]" /></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div>
          <p className="text-sm text-[var(--muted)]">You haven't placed any orders yet.</p>
          <Link to="/shop" className="mt-2 inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:text-[var(--ink)]">
            Start shopping →
          </Link>
        </div>
      ) : (
        <div>
          {/* Header row — the underline stops before the chevron
              column, exactly like Figma. */}
          <div className={`${ROW_GRID} text-sm font-medium text-[var(--ink)]`}>
            <span className="border-b border-[var(--line)] px-5 pb-3 md:px-6">Reference Number</span>
            <span className="hidden border-b border-[var(--line)] px-6 pb-3 md:block">Date</span>
            <span className="border-b border-[var(--line)] px-5 pb-3 md:px-6">Progress</span>
            <span className="hidden border-b border-[var(--line)] px-6 pb-3 md:block">Number of Items</span>
          </div>

          <ul>
            {orders.map((order) => (
              <li key={order._id}>
                {/* TIP: the whole row is the link (the chevron is
                    just the visual cue), so the tap target on
                    mobile is the full row, not a tiny arrow. */}
                <Link
                  to={`/account/orders/${order._id}`}
                  className={`${ROW_GRID} min-h-[72px] items-center text-sm text-[var(--ink)]/75 transition-colors hover:bg-black/[0.03]`}
                >
                  {/* TIP: older orders saved before orderNumber
                      existed fall back to the Paystack reference
                      so no row is ever blank. */}
                  <span className="truncate px-5 md:px-6">#{order.orderNumber || order.paystackReference}</span>
                  <span className="hidden px-6 md:block">{formatOrderDate(order.createdAt)}</span>
                  <span className="px-5 md:px-6"><OrderStatusPill status={order.status} /></span>
                  <span className="hidden px-6 md:block">{countItems(order)}</span>
                  <ChevronRight size={16} className="justify-self-center text-[var(--muted)]" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AccountLayout>
  );
}