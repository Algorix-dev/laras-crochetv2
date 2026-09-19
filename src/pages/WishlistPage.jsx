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
import Footer from '../components/Footer';

function BrandedLoader() {
  const [clear, setClear] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setClear(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-center">
      <div className={`transition duration-[1000ms] ${clear ? 'opacity-100 blur-0' : 'opacity-55 blur-[3px]'}`}>
        <img className="mx-auto h-[120px] w-[186px] object-contain" src={logoMark} alt="Lara's Crochet" />
        <p className="mt-3 text-[14px] tracking-[0.5em] text-[#A3A3A3]">LIMITED BY NATURE</p>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();
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
    // TIP: was a plain "Loading your wishlist..." line — swapped for
    // the same branded splash Shop and Product Detail use, per the
    // note that every loading moment should look the same. minHeight
    // is shorter than those two pages' default 60vh since this sits
    // below a page header rather than replacing the whole page.
    return (
      <section className="px-5 pt-10 pb-24 md:px-8 lg:px-[15.83%]">
        <BrandedLoader minHeight="40vh" />
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