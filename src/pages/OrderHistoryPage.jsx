/*
  TIP: Only the EMPTY state was in her design, so that part matches
  exactly. The populated list below is a reasonable extrapolation —
  same visual language as the rest of the account section — but
  worth double-checking against her design once she sends a "has
  orders" mockup, since the exact layout of an order row wasn't specified.
*/
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from '../components/ProductGrid';
import AccountSidebar from '../components/AccountSidebar';
import Footer from '../components/Footer';

export default function OrderHistoryPage() {
  const { isSignedIn, token } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState([]);

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

  // TIP: recommendations now come from the live catalog (same fix
  // as ShopPage/ProductDetail/MyBagPage/WishlistPage) instead of the
  // old hardcoded data/products.js array.
  useEffect(() => {
    getProducts('all')
      .then((data) => setRecommended(data.map(normalizeProduct).slice(0, 4)))
      .catch(() => setRecommended([]));
  }, []);

  if (!isSignedIn) return null;

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <p className="mb-6 text-xs text-[var(--muted)]">
          <Link to="/" className="hover:underline">Home</Link> / Account
        </p>

        <div className="grid gap-10 md:grid-cols-[180px_1fr]">
          <AccountSidebar active="orders" />

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)]">
                  Order History
                </h1>
              </div>
              {/* TIP: the Figma shows this search field even in the
                  empty state, not just once orders exist. */}
              <input
                type="search"
                placeholder="Search all orders"
                className="border border-[var(--line)] px-3 py-2 text-xs outline-none focus:border-[var(--ink)]"
              />
            </div>

            {loading ? (
              <p className="text-sm text-[var(--muted)]">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                You haven't placed any orders yet.{' '}
                <Link to="/shop" className="underline underline-offset-2 hover:text-[var(--ink)]">
                  Start shopping →
                </Link>
              </p>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {orders.map((order) => (
                  <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                    <div>
                      <p className="font-bold">#{order.paystackReference}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wide">{order.status}</span>
                    <span className="font-bold">₦{order.totalAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl mb-8">Lara Thinks You'd Love These Too</h2>
            <ProductGrid products={recommended} />
          </div>
        )}
      </section>

      <Footer showNewsletter />
    </>
  );
}
