import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavbarVisibilityProvider } from "./context/NavbarVisibilityContext";
import { useCart } from "./context/CartContext";
import Navbar from "./components/Navbar";
import BagDrawer from "./components/BagDrawer";
import Hero from "./components/Hero";
import ProductGrid from "./components/ProductGrid";
import CustomOrderBanner from "./components/CustomOrderBanner";
import LaraShowcase from "./components/LaraShowcase";
import Footer from "./components/Footer";
import Reveal from "./components/Reveal";
import AutoRiseProvider from "./components/AutoRiseProvider";
import { products } from "./data/products";
import { FALLBACK_HERO_MODELS } from "./data/heroFallback";
import { getProducts, normalizeProduct, toHeroModel } from "./api";

import SignInPage from "./pages/SignInPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ShopPage from "./pages/ShopPage";
import AdminApp from "./admin/AdminApp";
import VisitorTracker from "./components/VisitorTracker";
import ProductDetail from "./pages/ProductDetail";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import MyBagPage from "./pages/MyBagPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import AddressesPage from "./pages/AddressesPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
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
  if (pathname === "/signin" || pathname.startsWith("/admin")) return null;
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
  // TIP: true on phone-sized screens (under 768px). Updates if the window is resized.
  const [isPhone, setIsPhone] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsPhone(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const [liveProducts, setLiveProducts] = useState(products); // instant first paint, then swapped for live data
  // TIP: tracks whether `liveProducts` above is still the static
  // fallback (fake ids like "wisteria") or real data from the API.
  // ProductCard uses this to disable clicking/wishlisting/bagging
  // while it's still fake — see the TIP on ProductCard's isPlaceholder
  // prop for why that matters.
  const [isLive, setIsLive] = useState(false);

  // TIP — THE HERO IS DRIVEN BY THE PRODUCTS. `null` = still loading (the
  // hero holds its space, empty). Once the products arrive it becomes
  // every piece marked "Hero" in the admin page — or, if none is marked
  // yet (or the API can't be reached), the sample models in
  // data/heroFallback.js so the landing page is never empty.
  const [heroModels, setHeroModels] = useState(null);

  useEffect(() => {
    getProducts()
      .then((data) => {
        const live = data.map(normalizeProduct);

        const onHero = live
          .filter((product) => product.placements.includes("hero"))
          .map(toHeroModel);
        // TIP: with nothing marked "Hero" yet, the sample models are shown.
        // Link each one to the real piece of the same name (if the shop has
        // it) so clicking it in the middle opens a real product page.
        const linkedSamples = FALLBACK_HERO_MODELS.map((sample) => {
          const match = live.find(
            (product) => product.name?.trim().toLowerCase() === sample.name.toLowerCase()
          );
          return match ? { ...sample, productId: match.id } : sample;
        });
        setHeroModels(onHero.length > 0 ? onHero : linkedSamples);

        if (live.length > 0) {
          // "Shop Our Pieces" shows the first four: pieces marked
          // "Featured" come first, then the rest (newest first)
          const isFeatured = (product) => product.placements.includes("featured");
          setLiveProducts([
            ...live.filter(isFeatured),
            ...live.filter((product) => !isFeatured(product)),
          ]);
          setIsLive(true);
        }
      })
      .catch(() => {
        // fails quietly to the static fallbacks — isLive stays false, so
        // those cards correctly stay inert
        setHeroModels(FALLBACK_HERO_MODELS);
      });
  }, []);

  return (
    <>
      <Hero models={heroModels} />

      {/* TIP: this used to be two static sections (brand story +
          testimonial grid), each just fading up once when scrolled
          into view. Per Lara's feedback it's now one sticky,
          scroll-scrubbed sequence — LaraShowcase pins itself under
          the navbar, scatters the 3 reference photos over her
          portrait, cross-fades the same 4 brand-story paragraphs one
          at a time, then fades the testimonials through one by one —
          before finally releasing and letting the page continue
          scrolling into the shop section below. See LaraShowcase.jsx
          for how the pin + scroll-scrub is built. */}
      <LaraShowcase />

      <Reveal>
        <div className="text-center pt-2 pb-2 md:pb-14">
          <Link to="/shop" className="hidden md:inline-block lg:inline-block bg-[var(--maroon)] px-8 py-3.5 text-base font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)] transition-colors">
            Go to Shop
          </Link>
        </div>
      </Reveal>

            {/* Shop Our Pieces — a curated 4-item taste of the catalog, not the full grid */}
            <section className="pt-4 pb-10 md:py-16">
              {/* TIP — 304px shared margin, matching Navbar/Hero/
                  ProductGrid/Footer, so this heading row's left edge
                  lines up with the product grid directly below it. */}
              <Reveal>
                <div className="px-5 md:px-8 lg:px-[15.83%] flex items-end justify-between mb-8">
                  <h2 className="sm:text-[16px] lg:text-[32px] md:text-3xl font-bold uppercase tracking-[-2%] text-[var(--ink)]">
                    Shop Our Pieces
                  </h2>
                  <Link to="/shop" className="sm:text-[14px] md:text-base pr-3 text-base underline underline-offset-2 hover:text-[var(--maroon)]">
                    Go to shop
                  </Link>
                </div>
              </Reveal>
              {/* TIP: 6 pieces on phones = 3 rows of 2 (client request); desktop keeps
                  the original 4. Change the 6 / 4 here to adjust. */}
              <ProductGrid products={liveProducts.slice(0, isPhone ? 6 : 4)} isPlaceholder={!isLive} />
              <Reveal>
                <div className="text-center mt-10">
                  <Link to="/shop" className="sm:w-full md:inline-block lg:inline-block bg-[var(--maroon)] px-8 py-3.5 sm:text-[14px] text-base font-bold uppercase tracking-widest text-white hover:bg-[var(--maroon-dark)] transition-colors">
                    Go to Shop
                  </Link>
                </div>
              </Reveal>
            </section>

      {/* TIP: data-auto-rise = "rise as ONE block". The banner layers a
          wordmark behind the models, so it must not be split into pieces
          (each piece would get its own transform + stacking context). */}
      <div data-auto-rise="true">
        <CustomOrderBanner />
      </div>
      <Footer />
    </>
  );
}

// TIP — EVERY PAGE COMES UP FROM UNDERNEATH (element by element):
// this wrapper used to replay one 24px CSS rise on the WHOLE page at every
// route change. That was competing with the per-element rise (both moved at
// once, so neither read clearly) and it only played on navigation, never
// while scrolling. It's gone. Instead, `data-page` tells the scroll engine
// (utils/scrollReveal.js) "this is a page: find its top-level blocks and
// make each one rise, one after another, every time it scrolls into view".
//
// - key={pathname} still re-mounts the page on every route change (some
//   pages rely on that to reset their state).
// - /signin opts out: it has its own splash + step animations.
// - index.css clips sideways overflow on [data-page] so nothing can make
//   the page pan left/right on a phone.
// TIP: Lara's mobile Figma puts a full-width "Search" bar directly under the
// header on the Shop and Custom Orders/Contact screens (and only there).
// Phones only; tapping it opens the same search overlay the navbar uses.
function MobileSearchBar() {
  return (
    <div className="px-5 pb-3 pt-3 md:hidden">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("laras:open-search"))}
        className="flex h-11 w-full items-center gap-2 rounded-full border border-[var(--line)] bg-[#F5F5F5] px-4 text-left text-base text-[var(--muted)] shadow-sm"
      >
        <Search size={18} />
        Search
      </button>
    </div>
  );
}

function PageOffset({ children }) {
  const { pathname } = useLocation();
  // /shop has its own search box (it filters the grid), styled like Figma
  const showMobileSearch = pathname === "/contact";
  // /signin and /admin are standalone screens: no navbar, no scroll-rise
  const isSignIn = pathname === "/signin" || pathname.startsWith("/admin");
  return (
    <div className={isSignIn ? "" : "pt-[66px]"}>
      <div
        key={pathname.startsWith("/admin") ? "admin" : pathname}
        data-page={isSignIn ? undefined : "true"}
        data-no-rise={isSignIn ? "true" : undefined}
      >
        {showMobileSearch && <MobileSearchBar />}
        {children}
      </div>
    </div>
  );
}

export default function App() {
  // TIP: BagDrawer was built but never actually mounted anywhere in
  // the app before this — "Add to Bag" had no visual confirmation
  // beyond a small toast. Rendering it here, once, at the app root
  // (rather than inside a single page) means any page can pop it
  // open via the isBagOpen/openBag/closeBag CartContext already
  // exposes, and it stays available no matter which route you're on.
  const { isBagOpen, closeBag } = useCart();

  return (
    <AuthProvider>
      <NavbarVisibilityProvider>
      {/* TIP: AutoRiseProvider was imported at the top of this file but
          never rendered, so initScrollReveal() never ran and the whole
          scroll engine was dormant on every page. It has to sit INSIDE
          <BrowserRouter> (it calls useLocation to re-scan on every route
          change) and wrap everything that can contain .rv / data-auto-rise
          elements — which is why it wraps the routes AND the navbar
          (the navbar is safe: the engine skips anything inside <nav>). */}
      <AutoRiseProvider>
      <ScrollToTop />
      <VisitorTracker />
      <ConditionalNavbar />
      <BagDrawer open={isBagOpen} onClose={closeBag} />
      <PageOffset><Routes>
        {/* ===== ROUTES VISIBLE TO CLIENT ===== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/signin" element={<SignInPage />} />
        {/* Lara's page for adding / editing pieces — not linked anywhere;
            she signs in with the admin account from server/seedAdmin.js */}
        <Route path="/admin/*" element={<AdminApp />} />
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
        <Route path="/account/orders/:id" element={<OrderTrackingPage />} />

        {/* Catch-all: unknown routes go home rather than a blank page */}
        <Route path="*" element={<SignInPage />} />
      </Routes></PageOffset>
      </AutoRiseProvider>
      </NavbarVisibilityProvider>
    </AuthProvider>
  );
}