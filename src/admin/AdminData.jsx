/*
  One place that loads the admin's data and hands each screen its numbers.

    const { models, loading, error, demo, refresh } = useAdmin();

  - Real mode: orders come from GET /api/orders (admin only) and products
    from GET /api/products, then model.js turns them into screen-ready data.
  - Demo mode (/admin?demo): the same code runs on made-up sample data, so
    the design can be previewed before there are real orders.
*/
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminSession, getAdminOrders, getAnalyticsSummary, getProducts, normalizeProduct, updateOrderStatus } from "../api";
import { demoAnalytics, demoData } from "./demo";
import { buildModels } from "./model";

const AdminContext = createContext(null);

const DEMO_KEY = "laras-admin-demo";

// /admin?demo turns sample data on, /admin?demo=off turns it off again
export function readDemoFlag() {
  try {
    const param = new URLSearchParams(window.location.search).get("demo");
    if (param === "off" || param === "0" || param === "false") {
      sessionStorage.removeItem(DEMO_KEY);
      return false;
    }
    if (param !== null) {
      sessionStorage.setItem(DEMO_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function AdminDataProvider({ demo, onExpired, children }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (demo) {
      const data = demoData();
      setOrders(data.orders);
      setProducts(data.products);
      setAnalytics(demoAnalytics());
      setError("");
      setLoading(false);
      return;
    }
    try {
      setError("");
      // orders and products are independent, so load them together; a failed
      // orders call shouldn't hide the products (and the other way round)
      const [ordersResult, productsResult, analyticsResult] = await Promise.allSettled([
        getAdminOrders(),
        getProducts("all"),
        getAnalyticsSummary(),
      ]);

      const expired = [ordersResult, productsResult, analyticsResult].some(
        (r) => r.status === "rejected" && r.reason?.message === "SESSION_EXPIRED"
      );
      if (expired) return onExpired?.();

      if (ordersResult.status === "fulfilled") setOrders(ordersResult.value);
      if (productsResult.status === "fulfilled") setProducts(productsResult.value.map(normalizeProduct));
      // visitor numbers are a bonus: if the server doesn't have the analytics
      // route yet, the cards say so instead of the whole dashboard failing
      setAnalytics(analyticsResult.status === "fulfilled" ? analyticsResult.value : null);
      if (ordersResult.status === "rejected" || productsResult.status === "rejected") {
        setError("Some of the data couldn't be loaded. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [demo, onExpired]);

  useEffect(() => {
    load();
  }, [load]);

  const models = useMemo(() => buildModels({ orders, products, analytics }), [orders, products, analytics]);

  // change an order's status on the server, then in the list on screen
  const setStatus = useCallback(
    async (id, status) => {
      if (demo) {
        setOrders((list) => list.map((o) => (o._id === id ? { ...o, status } : o)));
        return;
      }
      const updated = await updateOrderStatus(id, status);
      setOrders((list) => list.map((o) => (o._id === id ? { ...o, ...updated } : o)));
    },
    [demo]
  );

  const value = useMemo(
    () => ({ demo, models, orders, products, analytics, loading, error, refresh: load, setStatus, profile: adminSession.profile() }),
    [demo, models, orders, products, analytics, loading, error, load, setStatus]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminDataProvider>");
  return ctx;
}
