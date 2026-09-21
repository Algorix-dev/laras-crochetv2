/*
  Turns the raw API data (orders + products) into exactly what each admin
  screen shows. Keeping it in one place means the screens stay simple, and
  every number on the dashboard can be traced back to a line in here.

  The same code runs for the "?demo" sample data and for Lara's real data.
*/
import { countries } from "../data/countries";
import { compactNumber, naira } from "./fmt";

const DAY = 24 * 60 * 60 * 1000;

/* ---------------- tunables ---------------- */

// a customer counts as "Active" if they ordered within this many days
export const ACTIVE_DAYS = 90;
// ...and as "VIP" once they've ordered this many times or spent this much
export const VIP_ORDERS = 3;
export const VIP_SPEND = 250000;
// how many rows each table shows per page
export const PAGE_SIZE = 10;

/* ---------------- order statuses ---------------- */

export const STATUS_LABEL = {
  pending: "Pending",
  paid: "Received",
  in_production: "In production",
  packaging: "Packaging",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export const STATUS_TONE = {
  pending: "amber",
  paid: "amber",
  in_production: "amber",
  packaging: "amber",
  shipped: "ink",
  delivered: "green",
  cancelled: "red",
};
export const ORDER_STATUS_KEYS = Object.keys(STATUS_LABEL);

// "paid" for our purposes = the customer's payment went through
export const isPaid = (order) => order.status !== "pending" && order.status !== "cancelled";

const OPEN = new Set(["pending", "paid", "in_production", "packaging", "shipped"]);

/* ---------------- small helpers ---------------- */

const time = (value) => new Date(value).getTime();
const between = (order, from, to) => {
  const t = time(order.createdAt);
  return t >= from && t < to;
};
const sum = (list, pick) => list.reduce((total, item) => total + (Number(pick(item)) || 0), 0);

// % change from `previous` to `current`; null (shown as nothing) when there's nothing to compare with yet
export function change(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function startOfWeek(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d.getTime();
}

const orderLabel = (order) =>
  order.orderNumber ? `#${order.orderNumber}` : `#${String(order.paystackReference || order._id || "").slice(-6).toUpperCase()}`;

const shortId = (id) => String(id || "").slice(-6).toUpperCase();

function countryOf(order) {
  const last = String(order.shippingAddress || "").split(",").pop().trim().toLowerCase();
  if (!last) return null;
  return countries.find((c) => c.name.toLowerCase() === last || c.code.toLowerCase() === last) || null;
}

const METHOD_LABEL = {
  card: "Card",
  bank: "Bank",
  bank_transfer: "Bank",
  ussd: "USSD",
  qr: "QR",
  mobile_money: "Mobile money",
  apple_pay: "Apple Pay",
};
export const methodLabel = (order) => METHOD_LABEL[order.paymentMethod?.channel] || (order.paymentMethod?.channel ? order.paymentMethod.channel : "—");

/* ---------------- the model ---------------- */

export function buildModels({ orders = [], products = [], analytics = null, now = Date.now() } = {}) {
  const productById = new Map(products.map((p) => [String(p._id || p.id), p]));
  const productByName = new Map(products.map((p) => [String(p.name).toLowerCase(), p]));
  const findProduct = (item) => productById.get(String(item.product)) || productByName.get(String(item.name).toLowerCase());
  const imageOf = (item) => findProduct(item)?.image || findProduct(item)?.views?.front || findProduct(item)?.images?.[0] || "";

  const sorted = [...orders].sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const paid = sorted.filter(isPaid);

  /* ----- customers (one per email) ----- */
  const byEmail = new Map();
  [...sorted].reverse().forEach((order) => {
    const key = String(order.customerEmail || "").toLowerCase();
    if (!key) return;
    if (!byEmail.has(key)) {
      byEmail.set(key, {
        email: order.customerEmail,
        name: order.customerName,
        phone: order.customerPhone,
        address: order.shippingAddress,
        firstOrder: order.createdAt,
        lastOrder: order.createdAt,
        orders: 0,
        completed: 0,
        canceled: 0,
        spend: 0,
        lastPaid: null,
      });
    }
    const c = byEmail.get(key);
    c.name = order.customerName || c.name;
    c.phone = order.customerPhone || c.phone;
    c.address = order.shippingAddress || c.address;
    c.lastOrder = order.createdAt;
    if (order.status !== "pending") c.orders += 1;
    if (order.status === "delivered") c.completed += 1;
    if (order.status === "cancelled") c.canceled += 1;
    if (isPaid(order)) {
      c.spend += Number(order.totalAmount) || 0;
      c.lastPaid = order.createdAt;
    }
  });
  const customerList = [...byEmail.values()].sort((a, b) => time(a.firstOrder) - time(b.firstOrder));
  customerList.forEach((c, i) => {
    c.id = `#CUST${String(i + 1).padStart(3, "0")}`;
    const recent = time(c.lastPaid || c.lastOrder) >= now - ACTIVE_DAYS * DAY;
    c.status = c.orders >= VIP_ORDERS || c.spend >= VIP_SPEND ? "vip" : recent ? "active" : "inactive";
  });
  const customerIdByEmail = new Map(customerList.map((c) => [String(c.email).toLowerCase(), c]));
  const customersNewestFirst = [...customerList].reverse();

  /* ----- windows ----- */
  const last7 = (o) => between(o, now - 7 * DAY, now + DAY);
  const prev7 = (o) => between(o, now - 14 * DAY, now - 7 * DAY);
  const paidThis = paid.filter(last7);
  const paidPrev = paid.filter(prev7);
  const ordersThis = sorted.filter((o) => last7(o) && o.status !== "pending");
  const ordersPrev = sorted.filter((o) => prev7(o) && o.status !== "pending");
  const placed = sorted.filter((o) => o.status !== "pending");

  /* ----- product sales ----- */
  const sold = new Map(); // product key -> units
  paid.forEach((o) =>
    (o.items || []).forEach((item) => {
      const p = findProduct(item);
      const key = p ? String(p._id || p.id) : `name:${item.name}`;
      sold.set(key, (sold.get(key) || 0) + (Number(item.quantity) || 1));
    })
  );
  const unitsFor = (p) => sold.get(String(p._id || p.id)) || 0;
  const inStock = products.filter((p) => (p.stock ?? 0) > 0);

  /* ----- weekly chart series ----- */
  const weekStart = startOfWeek(now);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function perDay(from, valueOf, list = paid) {
    const out = Array(7).fill(0);
    list.forEach((o) => {
      const t = time(o.createdAt);
      if (t >= from && t < from + 7 * DAY) out[Math.floor((t - from) / DAY)] += valueOf(o);
    });
    return out;
  }
  // how many different customers ordered on each day of the week
  function customersPerDay(from) {
    const days = Array.from({ length: 7 }, () => new Set());
    sorted.forEach((o) => {
      const t = time(o.createdAt);
      if (o.status !== "pending" && t >= from && t < from + 7 * DAY) days[Math.floor((t - from) / DAY)].add(String(o.customerEmail).toLowerCase());
    });
    return days.map((set) => set.size);
  }
  const flat = (v) => Array(7).fill(v);
  const revenueSeries = { this: perDay(weekStart, (o) => Number(o.totalAmount) || 0), last: perDay(weekStart - 7 * DAY, (o) => Number(o.totalAmount) || 0) };
  const customerSeries = { this: customersPerDay(weekStart), last: customersPerDay(weekStart - 7 * DAY) };

  const weekRevenue = sum(revenueSeries.this, (v) => v);

  // days of THIS week that haven't happened yet are blank (null), so charts stop at today
  const todayIndex = new Date(now).getDay();
  const untilToday = (list) => list.map((v, i) => (i > todayIndex ? null : v));
  revenueSeries.this = untilToday(revenueSeries.this);
  customerSeries.this = untilToday(customerSeries.this);

  /* ----- countries ----- */
  function countryTotals(list) {
    const totals = new Map();
    list.forEach((o) => {
      const c = countryOf(o);
      if (!c) return;
      totals.set(c.code, (totals.get(c.code) || 0) + (Number(o.totalAmount) || 0));
    });
    return totals;
  }
  const countryNow = countryTotals(paidThis);
  const countryBefore = countryTotals(paidPrev);
  const countryTop = [...countryNow.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const countryMax = countryTop[0]?.[1] || 1;
  const countryRows = countryTop.map(([code, value]) => ({
    code,
    name: countries.find((c) => c.code === code)?.name || code,
    value: compactNumber(value),
    share: value / countryMax,
    delta: change(value, countryBefore.get(code) || 0),
  }));

  /* ----- visitors (from the storefront's pings; null until tracking has reported) ----- */
  const dayKey = (ms) => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const visitorsPerDay = (from) =>
    Array.from({ length: 7 }, (_, i) => analytics?.days?.[dayKey(from + i * DAY)] || 0);
  const visitorSeries = analytics
    ? { this: untilToday(visitorsPerDay(weekStart)), last: visitorsPerDay(weekStart - 7 * DAY) }
    : null;
  const ordersPerDay = (from) => perDay(from, () => 1);
  const conversionPerDay = (from) => {
    const visits = visitorsPerDay(from);
    const buys = ordersPerDay(from);
    return buys.map((n, i) => (visits[i] ? Math.round((n / visits[i]) * 1000) / 10 : 0));
  };
  const conversionSeries = analytics
    ? { this: untilToday(conversionPerDay(weekStart)), last: conversionPerDay(weekStart - 7 * DAY) }
    : null;
  const visitorsWeek = analytics?.last7 ?? 0;
  const conversionRate = visitorsWeek ? Math.round((paidThis.length / visitorsWeek) * 1000) / 10 : 0;

  /* ============ DASHBOARD ============ */
  const dashboard = {
    totalSales: {
      value: naira(sum(paidThis, (o) => o.totalAmount), { compact: true }),
      delta: change(sum(paidThis, (o) => o.totalAmount), sum(paidPrev, (o) => o.totalAmount)),
      previous: naira(sum(paidPrev, (o) => o.totalAmount), { compact: true }),
    },
    totalOrders: {
      value: compactNumber(ordersThis.length),
      delta: change(ordersThis.length, ordersPrev.length),
      previous: compactNumber(ordersPrev.length),
    },
    pendingCanceled: {
      pending: sorted.filter((o) => o.status === "pending" && last7(o)).length,
      pendingUsers: new Set(sorted.filter((o) => o.status === "pending" && last7(o)).map((o) => String(o.customerEmail).toLowerCase())).size,
      canceled: sorted.filter((o) => o.status === "cancelled" && last7(o)).length,
      canceledDelta: change(
        sorted.filter((o) => o.status === "cancelled" && last7(o)).length,
        sorted.filter((o) => o.status === "cancelled" && prev7(o)).length
      ),
    },
    week: {
      stats: [
        { key: "customers", label: "Customers", value: compactNumber(customerList.length), kind: "count" },
        { key: "products", label: "Total Products", value: compactNumber(products.length), kind: "count" },
        { key: "stock", label: "Stock Products", value: compactNumber(inStock.length), kind: "count" },
        { key: "out", label: "Out of Stock", value: compactNumber(products.length - inStock.length), kind: "count" },
        { key: "revenue", label: "Revenue", value: naira(weekRevenue, { compact: true }), kind: "money" },
      ],
      series: {
        customers: customerSeries,
        products: { this: flat(products.length), last: flat(products.length) },
        stock: { this: flat(inStock.length), last: flat(inStock.length) },
        out: { this: flat(products.length - inStock.length), last: flat(products.length - inStock.length) },
        revenue: revenueSeries,
      },
      labels: dayLabels,
      names: dayNames,
      today: new Date(now).getDay(),
    },
    live: analytics
      ? { total: compactNumber(analytics.live?.last30 || 0), bars: analytics.live?.perMinute || Array(30).fill(0) }
      : null, // null = the server hasn't reported visitor numbers (yet) — the card explains that
    countries: countryRows,
    transactions: sorted.slice(0, 5).map((o, i) => ({
      key: o._id || i,
      no: i + 1,
      customer: customerIdByEmail.get(String(o.customerEmail).toLowerCase())?.id || "#—",
      date: o.createdAt,
      paid: isPaid(o),
      pending: o.status === "pending",
      amount: naira(o.totalAmount),
    })),
    topProducts: [...products]
      .sort((a, b) => unitsFor(b) - unitsFor(a))
      .slice(0, 4)
      .map((p) => ({ id: p._id || p.id, name: p.name, item: `Item: #${shortId(p._id || p.id)}`, price: naira(p.price), image: p.image })),
    bestSelling: [...products]
      .sort((a, b) => unitsFor(b) - unitsFor(a))
      .slice(0, 4)
      .map((p) => ({ id: p._id || p.id, name: p.name, image: p.image, orders: unitsFor(p), inStock: (p.stock ?? 0) > 0, price: naira(p.price) })),
    addProducts: [...products]
      .filter((p) => !(p.placements || []).includes("featured"))
      .slice(0, 3)
      .map((p) => ({ id: p._id || p.id, name: p.name, price: naira(p.price), image: p.image })),
  };

  /* ============ CATEGORIES ============ */
  const slugs = [...new Set(["dresses", "bikinis", "two-pieces", "shirts", "skirts", ...products.map((p) => p.category)])];
  const labelFor = (slug) => (slug === "two-pieces" ? "Two-pieces" : slug.charAt(0).toUpperCase() + slug.slice(1));
  const categoryCards = slugs.map((slug) => {
    const inCat = products.filter((p) => p.category === slug);
    return { slug, label: labelFor(slug), image: inCat[0]?.image || "", count: inCat.length };
  });
  dashboard.categories = categoryCards.slice(0, 3);

  const productRows = [...products]
    .sort((a, b) => time(b.createdAt || 0) - time(a.createdAt || 0))
    .map((p) => ({
      id: p._id || p.id,
      name: p.name,
      image: p.image,
      category: p.category,
      created: p.createdAt,
      orders: unitsFor(p),
      featured: (p.placements || []).includes("featured"),
      onSale: false,
      outOfStock: (p.stock ?? 0) <= 0,
      stock: p.stock ?? 0,
      price: p.price,
      product: p,
    }));
  const categories = {
    cards: categoryCards,
    rows: productRows,
    counts: {
      all: productRows.length,
      featured: productRows.filter((r) => r.featured).length,
      onSale: 0,
      out: productRows.filter((r) => r.outOfStock).length,
    },
  };

  /* ============ ORDERS ============ */
  const completed = placed.filter((o) => o.status === "delivered");
  const canceled = placed.filter((o) => o.status === "cancelled");
  const orderRows = sorted.map((o, i) => {
    const first = o.items?.[0] || {};
    return {
      key: o._id || i,
      orderId: orderLabel(o),
      productName: first.name || "—",
      extra: Math.max(0, (o.items?.length || 0) - 1),
      image: imageOf(first),
      date: o.createdAt,
      price: Number(o.totalAmount) || 0,
      paid: isPaid(o),
      status: o.status,
      raw: o,
    };
  });
  const orders_ = {
    stats: {
      total: { value: placed.length, delta: change(ordersThis.length, ordersPrev.length) },
      fresh: { value: ordersThis.length, delta: change(ordersThis.length, ordersPrev.length) },
      completed: { value: completed.length, pct: placed.length ? Math.round((completed.length / placed.length) * 100) : 0 },
      canceled: {
        value: canceled.length,
        delta: change(
          canceled.filter(last7).length,
          canceled.filter(prev7).length
        ),
      },
    },
    rows: orderRows,
    counts: {
      all: orderRows.length,
      completed: orderRows.filter((r) => r.status === "delivered").length,
      pending: orderRows.filter((r) => OPEN.has(r.status)).length,
      canceled: orderRows.filter((r) => r.status === "cancelled").length,
    },
  };

  /* ============ CUSTOMERS ============ */
  const repeat = customerList.filter((c) => c.orders > 1).length;
  const activeCustomers = customerList.filter((c) => c.status !== "inactive").length;
  const newThisWeek = customerList.filter((c) => time(c.firstOrder) >= now - 7 * DAY).length;
  const newLastWeek = customerList.filter((c) => time(c.firstOrder) >= now - 14 * DAY && time(c.firstOrder) < now - 7 * DAY).length;
  const customers = {
    stats: {
      total: {
        value: customerList.length,
        // growth of the customer list over the last 7 days
        delta: customerList.length - newThisWeek > 0 ? (newThisWeek / (customerList.length - newThisWeek)) * 100 : null,
      },
      fresh: { value: newThisWeek, delta: change(newThisWeek, newLastWeek) },
      visitors: analytics ? { value: compactNumber(analytics.last7 || 0), delta: change(analytics.last7 || 0, analytics.prev7 || 0) } : null,
    },
    overview: {
      stats: [
        { key: "active", label: "Active Customers", value: compactNumber(activeCustomers) },
        { key: "repeat", label: "Repeat Customers", value: compactNumber(repeat) },
        { key: "visitors", label: "Shop Visitors", value: analytics ? compactNumber(visitorsWeek) : "—" },
        { key: "conversion", label: "Conversion Rate", value: analytics ? `${conversionRate}%` : "—" },
      ],
      series: { active: customerSeries, repeat: customerSeries, visitors: visitorSeries, conversion: conversionSeries },
    },
    rows: customersNewestFirst,
  };

  /* ============ TRANSACTIONS ============ */
  const txRows = sorted.map((o, i) => ({
    key: o._id || i,
    customer: customerIdByEmail.get(String(o.customerEmail).toLowerCase())?.id || "#—",
    name: o.customerName,
    date: o.createdAt,
    total: Number(o.totalAmount) || 0,
    method: methodLabel(o),
    status: o.status === "cancelled" ? "canceled" : o.status === "pending" ? "pending" : "complete",
    raw: o,
  }));
  const completeTx = txRows.filter((r) => r.status === "complete");
  const transactions = {
    stats: {
      revenue: { value: naira(sum(paid, (o) => o.totalAmount)), delta: change(sum(paidThis, (o) => o.totalAmount), sum(paidPrev, (o) => o.totalAmount)) },
      completed: { value: completeTx.length, delta: change(paidThis.length, paidPrev.length) },
      pending: { value: txRows.filter((r) => r.status === "pending").length, pct: txRows.length ? Math.round((txRows.filter((r) => r.status === "pending").length / txRows.length) * 100) : 0 },
      failed: { value: txRows.filter((r) => r.status === "canceled").length, pct: txRows.length ? Math.round((txRows.filter((r) => r.status === "canceled").length / txRows.length) * 100) : 0 },
    },
    gateway: {
      transactions: completeTx.length,
      revenue: naira(sum(paid, (o) => o.totalAmount)),
    },
    rows: txRows,
    counts: {
      all: txRows.length,
      completed: completeTx.length,
      pending: txRows.filter((r) => r.status === "pending").length,
      canceled: txRows.filter((r) => r.status === "canceled").length,
    },
  };

  return { dashboard, orders: orders_, customers, categories, transactions, products, customerList };
}
