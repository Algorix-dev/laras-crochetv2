import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductGrid from "./components/ProductGrid";
import CustomOrderBanner from "./components/CustomOrderBanner";
import Footer from "./components/Footer";
import { products, heroProduct } from "./data/products";
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

// TIP: pulled verbatim from the Figma landing page export — real
// testimonials Lara/Teniya wrote, not placeholder text.
const TESTIMONIALS = [
  { quote: "I've never had a piece fit this well straight out of the box — literally made to my measurements. No alterations needed.", name: 'Teniola Aladese' },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: 'Tolu Coker' },
  { quote: 'The bikini set held up through an entire beach trip — no stretching, no losing shape. Genuinely impressed.', name: 'Halima Finny' },
  { quote: 'The Reina dress is a whole moment. I get stopped every single time I wear it.', name: 'Chidinma K.' },
  { quote: 'Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.', name: 'Precious Ehizoge' },
  { quote: 'Customer service walked me through sizing so patiently. Made ordering online feel less scary.', name: 'Ejiro Okezie' },
];

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// TIP: sign-in has no navbar per its own spec — a standalone,
// full-page experience. Every other route gets the normal site nav.
// "/" is special: it shows SignInPage (no navbar) when signed out,
// but the real HomePage (with navbar) once signed in — so the check
// here has to know the auth state, not just the pathname.
function ConditionalNavbar() {
  const { pathname } = useLocation();
  const { isSignedIn } = useAuth();
  if (pathname === "/signin" || (pathname === "/" && !isSignedIn)) return null;
  return <Navbar />;
}

// TIP: "/" is gated on auth — signed-out visitors are sent to the
// real sign-in flow (not just shown a copy of it inline, so the
// URL bar and back button behave correctly); signed-in visitors see
// the actual homepage. This is also why clicking the logo (which
// links to "/") now correctly returns signed-in users to the
// homepage instead of dumping them back on sign-in.
function HomeGate() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSignedIn) {
      navigate("/signin", { replace: true });
    }
  }, [isSignedIn, navigate]);

  if (!isSignedIn) return null;
  return <HomePage />;
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
      <Hero product={heroProduct} />

      {/* Brand story — verbatim from the Figma landing page export */}
      <section className="max-w-2xl mx-auto px-5 py-16 md:py-20 text-center">
        <p className="text-sm md:text-base leading-relaxed text-[var(--ink)] mb-6">
          Welcome to Lara's Crochet! Here, every piece here starts as a single strand of
          yarn and a pair of hands, no factories, no shortcuts. Made-to-order, one piece at
          a time, out of Lagos, Nigeria.
        </p>
        <p className="text-sm md:text-base font-semibold text-[var(--ink)] mb-6">
          We don't keep a stockroom.
        </p>
        <p className="text-sm md:text-base leading-relaxed text-[var(--ink)] mb-6">
          When you order, your piece is made for you — your size, your color, your fit. It
          takes time, because handmade always does, but it means what arrives at your door
          was never sitting on a shelf waiting for someone else.
        </p>
        <p className="text-sm text-[var(--muted)]">
          This isn't fast fashion. It's handmade, made with love.
        </p>
      </section>

      {/* Testimonials — real quotes from the Figma export, not placeholder text */}
      <section className="max-w-6xl mx-auto px-5 pb-10 md:pb-14">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="border border-[var(--line)] p-5 h-full">
              <p className="text-sm text-[var(--ink)] mb-4 leading-relaxed">"{t.quote}"</p>
              <p className="text-xs font-bold text-[var(--ink)] flex items-center gap-1">
                {t.name}
                <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-white text-[9px]">✓</span>
              </p>
              <p className="text-[11px] text-[var(--muted)]">Verified Customer</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/shop" className="inline-block bg-[var(--maroon)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)]">
            Go to Shop
          </Link>
        </div>
      </section>

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
        <Route path="/" element={<HomeGate />} />
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
        <Route path="/checkout" element={<CheckoutPage />} />
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
