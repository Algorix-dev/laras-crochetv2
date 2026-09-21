// TIP: one place for every backend call, instead of scattering
// fetch(`${import.meta.env.VITE_API_URL}/api/...`) across a dozen
// components. If the API's base URL or response shape ever changes,
// this is the only file that needs to change.
const API_URL = import.meta.env.VITE_API_URL;

export async function getProducts(category = "all") {
  const query = category && category !== "all" ? `?category=${category}` : "";
  const res = await fetch(`${API_URL}/api/products${query}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function getProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
}

// TIP: kicks off a real payment — the backend recalculates the total
// from the database (never trusting a price from the browser), saves
// a "pending" Order, and calls Paystack for a checkout URL. The
// frontend's job is just to redirect the browser to that URL.
export async function initializePayment(payload) {
  const res = await fetch(`${API_URL}/api/payments/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not start payment");
  return data; // { authorizationUrl }
}

// TIP: called once Paystack redirects the customer back to
// /order-confirmation?reference=xxx — confirms with the backend
// (which itself re-checks with Paystack) that the payment actually
// went through before treating the order as paid.
export async function verifyPayment(reference) {
  const res = await fetch(`${API_URL}/api/payments/verify/${reference}`);
  if (!res.ok) throw new Error("Could not verify payment");
  return res.json(); // { verified, order }
}

// TIP: attaches the customer's JWT automatically — every page that
// needs an authenticated call (addresses, order history) can use
// this instead of manually building the Authorization header each time.
export async function authenticatedFetch(path, options = {}) {
  const token = localStorage.getItem("laras-token");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res;
}

// TIP: PATCHes the logged-in customer's own record — requireCustomer
// on the backend reads the id from the JWT itself, not from anything
// sent here, so there's nothing for a customer to fake their way into
// editing someone else's account.
export async function updateUsername(username) {
  const res = await authenticatedFetch("/api/auth/customer/me", {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Failed to update username");
  return res.json();
}
// TIP: maps a backend Product document onto the shape the existing
// frontend components (ProductCard, ProductGrid, ProductDetail)
// already expect — mainly `images[0]` → `image`, and `_id` → `id`.
// This is the ONE place that bridges "what the database returns"
// and "what the UI was built around," so if the backend shape
// changes later, only this function needs updating.
// Your DB stores categories as plural slugs (dresses, bikinis,
// two-pieces, shirts, skirts) since that's what filters/URLs use,
// but Figma's card label is singular (e.g. "TWO-PIECE" not
// "TWO-PIECES"). ProductCard already uppercases whatever it's
// given, so this just needs to fix the singular/plural mismatch.
const CATEGORY_LABELS = {
  dresses: "Dress",
  bikinis: "Bikini",
  "two-pieces": "Two-Piece",
  shirts: "Shirt",
  skirts: "Skirt",
};

export function normalizeProduct(apiProduct) {
  // TIP — ANGLE SHOTS: `views` holds one photo per direction. Older
  // products (seeded before angle shots existed) only have `images`, so
  // their first image is treated as the FRONT view and the other three
  // angles are simply empty ("" = not uploaded yet).
  const views = {
    front: apiProduct.views?.front || apiProduct.images?.[0] || "",
    left: apiProduct.views?.left || "",
    right: apiProduct.views?.right || "",
    back: apiProduct.views?.back || "",
  };

  return {
    ...apiProduct,
    id: apiProduct._id,
    views,
    image: views.front || undefined,
    placements: apiProduct.placements || [],
    // ProductCard reads `categoryLabel`, but the API only sends
    // `category` (a slug like "two-pieces") — map it here so the
    // real label shows instead of falling back to "PRODUCT".
    categoryLabel: CATEGORY_LABELS[apiProduct.category] || apiProduct.category,
  };
}

// TIP: the hero carousel only needs a name, a price and up to three
// photos per piece: front (middle slot) and left / right (the side
// slots). Anything missing is null and Hero.jsx falls back sensibly
// (mirrors the other side, or stays front-facing).
export function toHeroModel(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    views: {
      front: product.views.front || null,
      left: product.views.left || null,
      right: product.views.right || null,
    },
  };
}

/* ============================================================
   ADMIN — used only by src/admin/*
   ============================================================ */

const ADMIN_TOKEN_KEY = "laras-admin-token";

const ADMIN_PROFILE_KEY = "laras-admin-profile";

export const adminSession = {
  get: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  set: (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_PROFILE_KEY);
  },
  // { name, email } from the login response — shown in the sidebar and on
  // the Admin role page. (The login route already sends them back.)
  profile: () => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY)) || null;
    } catch {
      return null;
    }
  },
  setProfile: (profile) => localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile)),
};

// one place for the "send the admin token, turn a 401 into SESSION_EXPIRED" dance
async function adminRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminSession.get()}`,
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

// every order (newest first) — GET /api/orders is admin-only
export const getAdminOrders = () => adminRequest("/api/orders");

// e.g. updateOrderStatus(order._id, "shipped")
export const updateOrderStatus = (id, status) =>
  adminRequest(`/api/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// visitor numbers for the dashboard (see server/routes/analytics.js)
export const getAnalyticsSummary = () => adminRequest("/api/analytics/summary");

// the signed-in admin changes their own password / display name
export const changeAdminPassword = (currentPassword, newPassword) =>
  adminRequest("/api/auth/password", { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) });
export const updateAdminName = (name) =>
  adminRequest("/api/auth/profile", { method: "PUT", body: JSON.stringify({ name }) });

// "soft delete" on the server: the piece is hidden from the shop, not erased
export const deleteProduct = (id) => adminRequest(`/api/products/${id}`, { method: "DELETE" });

export async function adminLogin(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not sign in");
  return data; // { token, name, email }
}

// TIP: sends ONE photo to POST /api/upload, which strips the background
// and stores it on Cloudinary, and returns its URL. (That route wants
// multipart/form-data, so this can't reuse authenticatedFetch, which
// forces a JSON Content-Type.)
export async function uploadPhoto(file) {
  const body = new FormData();
  body.append("images", file);
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminSession.get()}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.urls[0];
}

// POST when there's no id (new piece), PUT when there is (editing one).
export async function saveProduct(payload, id) {
  const res = await fetch(`${API_URL}/api/products${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminSession.get()}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  if (!res.ok) throw new Error(data.error || "Could not save the piece");
  return data;
}
