import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductGrid from "./components/ProductGrid";
import CustomOrderBanner from "./components/CustomOrderBanner";
import BrandStory from "./components/BrandStory";
import Footer from "./components/Footer";
import { products, heroModels } from "./data/products";
import { getProducts, normalizeProduct } from "./api";

import SignInPage from "./pages/SignInPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ShopPage from "./pages/ShopPage";
import ProductDetail from "./pages/ProductDetail";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import MyBagPage from "./pages/MyBagPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import AddressesPage from "./pages/AddressesPage";
import WishlistPage from "./pages/WishlistPage";
import ComingSoon from "./pages/ComingSoon";

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// TIP: sign-in has no navbar per its own spec — a standalone,
// full-page experience. Every other route, including the now-public
// landing page, gets the normal site nav.
function ConditionalNavbar() {
  const { pathname } = useLocation();
  if (pathname === "/signin") return null;
  return <Navbar />;
}

// TIP: reusable guard for any route that shouldn't be reachable by a
// signed-out visitor — most importantly Checkout. A real e-commerce
// flow doesn't let a guest walk straight through to payment; they
// have to sign in first, same as clicking "My Bag" → "Checkout" would
// naturally prompt. redirect=<path> is passed through so SignInPage
// sends them back to where they were trying to go, not just "/".
function RequireAuth({ children }) {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isSignedIn) {
      navigate(`/signin?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [isSignedIn, navigate, location.pathname]);

  if (!isSignedIn) return null;
  return children;
}

/* Home page is its own component so the route stays clean */
function HomePage() {
  const [liveProducts, setLiveProducts] = useState(products); // instant first paint, then swapped for live data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then((data) => {
        if (data.length > 0) setLiveProducts(data.map(normalizeProduct));
      })
      .catch(() => {
        // fails quietly to the static fallback already in state
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero models={heroModels} />

      {/* TIP: this used to be LaraShowcase — a pinned, scroll-scrubbed
          sequence that faded the brand-story paragraphs and testimonials
          in one at a time as you scrolled. Reverted to a static section
          (BrandStory.jsx) because the actual Figma export shows all of
          this content sitting still on the page, nothing scroll-scrubbed.
          Same real copy, same 3 reference photos, just laid out plainly
          with the same gentle Reveal fade-up used elsewhere on the site. */}
      <BrandStory />

      <div className="text-center pt-2 pb-10 md:pb-14">
        <Link to="/shop" className="inline-block bg-[var(--maroon)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)]">
          Go to Shop
        </Link>
      </div>

      {/* Shop Our Pieces — a curated 4-item taste of the catalog, not the full grid */}
      <section className="max-w-6xl mx-auto px-5 py-10 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)]">
            Shop Our Pieces
          </h2>
          <Link to="/shop" className="text-xs underline underline-offset-2 hover:text-[var(--maroon)]">
            Go to shop
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading products...</p>
        ) : (
          <ProductGrid products={liveProducts.slice(0, 4)} />
        )}
        <div className="text-center mt-10">
          <Link to="/shop" className="inline-block bg-[var(--maroon)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)]">
            Go to Shop
          </Link>
        </div>
      </section>

      <CustomOrderBanner />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <ConditionalNavbar />
      <Routes>
        {/* ===== ROUTES VISIBLE TO CLIENT ===== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/addresses" element={<AddressesPage />} />

        {/* ===== ROUTES HIDDEN (Coming Soon until you unlock them) ===== */}
        {/* TIP: to unlock a page, swap <ComingSoon /> for the real
            component — e.g. <Route path="/shop" element={<ShopPage />} /> */}
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/account/orders" element={<OrderHistoryPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/bag" element={<MyBagPage />} />

        {/* Catch-all: unknown routes go home rather than a blank page */}
        <Route path="*" element={<SignInPage />} />
      </Routes>
    </AuthProvider>
  );
}
