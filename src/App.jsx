import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategoryIntro from "./components/CategoryIntro";
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

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

// TIP: sign-in has no navbar per its own spec — a standalone,
// full-page experience. Every other route gets the normal site nav.
function ConditionalNavbar() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname === "/signin") return null;
  return <Navbar />;
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
      <CategoryIntro />
      {loading ? (
        <p className="px-5 py-16 text-center text-sm text-[var(--muted)]">
          Loading products...
        </p>
      ) : (
        <ProductGrid products={liveProducts} />
      )}
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
        <Route path="/" element={<SignInPage />} />
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
