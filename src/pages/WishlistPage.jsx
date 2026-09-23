/*
  TIP: This page needs zero new "remove from wishlist" logic — the
  ProductCard's heart icon already calls toggleWishlist(), and since
  it's filled-in (fill="currentColor") for anything in the wishlist,
  clicking it here removes the item and the grid just re-renders
  without it. Reusing ProductGrid instead of writing new grid markup
  is exactly the same trick as ShopPage.jsx.
*/
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from '../components/ProductGrid';
import RecommendedProducts from '../components/RecommendedProducts';
import AccountSidebar from '../components/AccountSidebar';
import BrandedLoader from '../components/BrandedLoader';
import InlineLoader from '../components/InlineLoader';
import Footer from '../components/Footer';
import { shouldShowSplash } from '../utils/splashOnce';

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();
  const [showSplash] = useState(() => shouldShowSplash('/wishlist'));
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // TIP: wishlistItems is just an array of product IDs (see
  // WishlistContext) — we fetch the full catalog once from the API
  // (like ShopPage does) and match IDs client-side, instead of
  // reading the old hardcoded products.js array.
  useEffect(() => {
    getProducts('all')
      .then((data) => setAllProducts(data.map(normalizeProduct)))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const wishlistedProducts = allProducts.filter((p) => wishlistItems.includes(p.id));

  if (loading) {
    // TIP: the branded splash only shows here on an actual page
    // reload (showSplash, from shouldShowSplash() — see
    // utils/splashOnce.js). Arriving via a normal in-app click (e.g.
    // the navbar's wishlist icon) shows the plain "Loading…" line
    // instead, per Lara's feedback that the splash shouldn't take
    // over every section's loading moment.
    return (
      <section className="px-5 pt-10 pb-24 md:px-8 lg:px-[15.83%]">
        {showSplash ? <BrandedLoader minHeight="40vh" /> : <InlineLoader text="Loading your wishlist…" minHeight="40vh" />}
      </section>
    );
  }

  return (
    <>
      <section className="px-5 pt-10 md:px-8 lg:px-[15.83%]">
        {/* TIP: the Figma desktop Wishlist screenshots (Wishlist_Page.png,
            Wishlist_Page__Empty_state_.png) show NO breadcrumb and NO
            AccountSidebar at all — just the header straight into the
            grid, full width. Only the MOBILE screenshot (Wishlist.png)
            shows "Home / Account" plus AccountSidebar's collapsed
            dropdown. So both are wrapped in md:hidden here — on desktop
            they disappear entirely instead of showing a sidebar column
            like Account/Orders/Addresses do. If Lara wants a real
            "Account > Wishlist" sub-view WITH the sidebar on desktop
            too, that'd need to be a separate route from this one. */}
        <div className="md:hidden mb-6">
          <p className="mb-6 text-xs text-[var(--muted)]">
            <Link to="/" className="hover:underline">Home</Link> / Account
          </p>
          <AccountSidebar active="wishlist" />
        </div>

        <div>
          {wishlistedProducts.length > 0 ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-1">
                Wishlist ({wishlistedProducts.length})
              </h1>
              <p className="mb-8 text-sm text-[var(--muted)]">
                Some pieces you love from Lara's Crochet.
              </p>
              <ProductGrid products={wishlistedProducts} columns={3} wrapInSection={false} />
            </>
          ) : (
            <div className="mb-12">
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-1">
                Wishlist
              </h1>
              <p className="text-sm text-[var(--muted)] mb-3">
                You have 0 items in your wishlist
              </p>
              <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 hover:text-[var(--maroon)]">
                Start shopping →
              </Link>
            </div>
          )}

          <RecommendedProducts
            excludeId={wishlistItems}
            className={wishlistedProducts.length > 0 ? 'mt-16 pb-16' : 'mt-2 pb-16'}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}