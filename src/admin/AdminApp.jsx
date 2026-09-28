/*
  THE ADMIN — everything under /admin.

    /admin                 Dashboard
    /admin/orders          Order Management
    /admin/custom-orders   Custom Orders (requests from the custom-order form)
    /admin/customers       Customers (click a row for its details)
    /admin/categories      Categories
    /admin/transactions    Transaction
    /admin/shipping        Shipping prices (per state / country)
    /admin/products        Product List
    /admin/products/new    Add Product        /admin/products/<id>  edit
    /admin/role            Admin role
    anything else in the menu -> "coming soon"

  Lara signs in with the admin account from server/seedAdmin.js.
  /admin?demo shows made-up sample data (see demo.js) — handy for previews.
*/
import { useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { adminLogin, adminSession } from "../api";
import logo from "../assets/lara-crochet-logo.png";
import { AdminDataProvider, readDemoFlag, useAdmin } from "./AdminData";
import AdminShell from "./AdminShell";
import "./admin.css";
import AdminRolePage from "./pages/AdminRolePage";
import CategoriesPage from "./pages/CategoriesPage";
import CustomersPage from "./pages/CustomersPage";
import CustomOrdersPage from "./pages/CustomOrdersPage";
import DashboardPage from "./pages/DashboardPage";
import { ComingSoonPage, ProductListPage } from "./pages/MiscPages";
import OrdersPage from "./pages/OrdersPage";
import ProductFormPage from "./pages/ProductFormPage";
import ShippingPage from "./pages/ShippingPage";
import TransactionsPage from "./pages/TransactionsPage";
import { Btn } from "./ui";

function LoginScreen({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, name, email: signedInEmail } = await adminLogin(email.trim(), password);
      adminSession.set(token);
      adminSession.setProfile({ name, email: signedInEmail });
      onSignedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "h-12 w-full rounded-md border border-[#e1e4e8] bg-[var(--a-bg)] px-4 text-[16px] text-[var(--a-ink)] outline-none focus:border-[var(--a-maroon)]";

  return (
    <div className="admin-root flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-[400px] rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(16,24,40,0.14),0_8px_30px_rgba(16,24,40,0.06)]">
        <img src={logo} alt="Lara's Crochet" className="mx-auto h-[56px] w-auto" />
        <h1 className="mt-6 text-center text-[24px] font-bold text-[var(--a-ink)]">Sign in</h1>
        <p className="mt-1 text-center text-[14px] text-[var(--a-muted)]">to your dashboard</p>

        <label className="mt-6 block text-[14px] font-bold text-[var(--a-ink)]" htmlFor="admin-email">
          Email
        </label>
        <input id="admin-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-2 ${input}`} />

        <label className="mt-4 block text-[14px] font-bold text-[var(--a-ink)]" htmlFor="admin-password">
          Password
        </label>
        <input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-2 ${input}`} />

        {error && (
          <p role="alert" className="mt-4 text-[14px] text-[var(--a-red)]">
            {error}
          </p>
        )}
        <Btn type="submit" disabled={busy} className="mt-6 h-12 w-full rounded-md">
          {busy ? "Signing in…" : "Sign in"}
        </Btn>
      </form>
    </div>
  );
}

// shows "loading" / "couldn't load" above the screens without hiding them
function Screens() {
  const { loading, error, refresh, demo } = useAdmin();

  return (
    <>
      {demo && (
        <p data-demo-banner className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-[var(--a-pink)] px-4 py-2.5 text-[14px] text-[var(--a-maroon)]">
          <span>
            <b>Sample data.</b> Nothing here is real, and nothing you change is saved.
          </span>
          <a href="/admin?demo=off" className="font-bold underline">
            Turn off
          </a>
        </p>
      )}
      {error && (
        <p role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#fff1f2] px-4 py-2.5 text-[14px] text-[var(--a-red)]">
          <span>{error}</span>
          <button type="button" onClick={refresh} className="font-bold underline">
            Try again
          </button>
        </p>
      )}
      {loading ? (
        <p className="py-24 text-center text-[16px] text-[var(--a-muted)]">Loading your dashboard…</p>
      ) : (
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="custom-orders" element={<CustomOrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="shipping" element={<ShippingPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="role" element={<AdminRolePage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Routes>
      )}
    </>
  );
}

// TIP: matchMedia asks the browser "is the screen narrower than 1024px?" and
// tells us again if that changes (rotating a phone). To allow tablets,
// lower 1023 to something like 767.
function useIsSmallScreen() {
  const query = "(max-width: 1023px)";
  const [small, setSmall] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setSmall(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return small;
}

function DesktopOnlyNotice() {
  return (
    <div className="admin-root flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-[360px]">
        <img src={logo} alt="Lara's Crochet" className="mx-auto h-[56px] w-auto" />
        <h1 className="mt-6 text-[22px] font-bold text-[var(--a-ink)]">Please use a laptop or computer</h1>
        <p className="mt-2 text-[15px] text-[var(--a-muted)]">
          The dashboard is built for a bigger screen. Open this page on a computer to manage orders and products.
        </p>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const small = useIsSmallScreen();
  const [demo] = useState(readDemoFlag);
  const [signedIn, setSignedIn] = useState(() => Boolean(adminSession.get()));

  const signOut = useCallback(() => {
    adminSession.clear();
    setSignedIn(false);
    if (demo) window.location.assign("/admin?demo=off");
  }, [demo]);

  // TIP: keep these early returns BELOW all the hooks above. React needs the
  // hooks to run in the same order on every render.
  if (small) return <DesktopOnlyNotice />;
  if (!demo && !signedIn) return <LoginScreen onSignedIn={() => setSignedIn(true)} />;

  return (
    <AdminDataProvider demo={demo} onExpired={signOut}>
      <AdminShell onSignOut={signOut}>
        <Screens />
      </AdminShell>
    </AdminDataProvider>
  );
}