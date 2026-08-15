/*
  TIP: This page redirects to sign-in if there's no user — that's
  what makes this a "protected page" on the frontend. The actual
  security still lives on the backend (any API route that returns
  real order data checks the JWT token), but this stops a
  signed-out visitor from even seeing the account UI.
*/
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { products } from '../data/products';
import ProductGrid from '../components/ProductGrid';
import AccountSidebar from '../components/AccountSidebar';
import Footer from '../components/Footer';

export default function AccountPage() {
  const { user, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) navigate('/signin?redirect=/account');
  }, [isSignedIn, navigate]);

  if (!isSignedIn) return null; // avoids a flash of empty content before the redirect kicks in

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <p className="mb-6 text-xs text-[var(--muted)]">
          <Link to="/" className="hover:underline">Home</Link> / Account
        </p>

        <div className="grid gap-10 md:grid-cols-[180px_1fr]">
          <AccountSidebar active="about" />

          {/* About You content */}
          <div>
            <h1 className="mb-6 font-display text-2xl italic">About You</h1>

            <div className="mb-8 max-w-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs uppercase text-[var(--muted)]">Username</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                <span className="text-sm">{user?.username || '–'}</span>
                <button aria-label="Edit username" className="text-xs text-[var(--muted)] hover:text-[var(--ink)]">
                  ✎
                </button>
              </div>
            </div>

            <div className="mb-8 max-w-sm">
              <span className="text-xs uppercase text-[var(--muted)]">Email</span>
              <p className="border-b border-[var(--line)] pb-2 text-sm">{user?.email}</p>
            </div>

            <div className="mb-8">
              <span className="text-xs uppercase text-[var(--muted)]">Preferences</span>
              <p className="mt-1 text-sm underline underline-offset-2">
                Unsubscribe from marketing emails
              </p>
            </div>

            <div>
              <span className="text-xs uppercase text-[var(--muted)]">Loyalty Status</span>
              <p className="mt-1 text-sm">{user?.loyaltyStatus || 'Guest'}</p>
            </div>
          </div>
        </div>

        {/* Recommendations — reuses the same ProductGrid as the shop/homepage */}
        <div className="mt-16">
          <h2 className="mb-6 text-sm font-bold">Lara Thinks You'd Love These Too</h2>
          <ProductGrid products={products} />
        </div>
      </section>

      <Footer showNewsletter />
    </>
  );
}
