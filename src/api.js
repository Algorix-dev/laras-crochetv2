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

// "crop-tops" -> "Crop Tops" (for categories Lara adds herself)
function prettySlug(slug = "") {
  return slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// TIP — FASTER PHOTOS: Cloudinary can resize and compress a photo on the fly if we add
// "f_auto,q_auto,w_1200" to its link. f_auto = best format for the visitor's browser,
// q_auto = smart compression, w_1200 = never send more than 1200px wide. The stored
// original is untouched. To make the photos sharper or lighter, change the 1200.
// Links that are not Cloudinary links, or already have a transformation, are left alone.
const CLOUDINARY_OPT = "f_auto,q_auto,w_1200";
export function optimizeImage(url) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (/\/upload\/[a-z]_[^/]*\//.test(url)) return url; // already has a transformation
  return url.replace("/upload/", `/upload/${CLOUDINARY_OPT}/`);
}

// `options` is only an object when we pass one on purpose. (When used as `.map(normalizeProduct)`
// the second argument is a number, which is ignored.) The admin passes { optimize: false } so it
// always works with, and saves back, the ORIGINAL photo links.
export function normalizeProduct(apiProduct, options) {
  const admin = options?.optimize === false; // the admin passes this: it needs the raw saved values
  const optimize = admin ? (u) => u : optimizeImage;

  // TIP — SALE PRICE. In the shop, while a sale is running, `price` becomes the discounted price and
  // `compareAtPrice` keeps the normal one (shown crossed out). Everything that already reads `price`
  // (cards, bag, hero) then uses the sale price with no other change. The server makes the same
  // decision again at payment (server/utils/pricing.js), so the browser can never undercharge.
  const now = Date.now();
  const sale = Number(apiProduct.salePrice);
  const saleOn =
    !admin &&
    Number.isFinite(sale) && sale > 0 && sale < Number(apiProduct.price) &&
    (!apiProduct.saleStart || now >= new Date(apiProduct.saleStart).getTime()) &&
    (!apiProduct.saleEnd || now <= new Date(apiProduct.saleEnd).getTime());
  // TIP — ANGLE SHOTS: `views` holds one photo per direction. Older
  // products (seeded before angle shots existed) only have `images`, so
  // their first image is treated as the FRONT view and the other three
  // angles are simply empty ("" = not uploaded yet).
  const views = {
    front: optimize(apiProduct.views?.front || apiProduct.images?.[0] || ""),
    left: optimize(apiProduct.views?.left || ""),
    right: optimize(apiProduct.views?.right || ""),
    back: optimize(apiProduct.views?.back || ""),
  };

  return {
    ...apiProduct,
    id: apiProduct._id,
    price: saleOn ? sale : apiProduct.price,
    compareAtPrice: saleOn ? apiProduct.price : null,
    onSale: saleOn,
    views,
    image: views.front || undefined,
    placements: apiProduct.placements || [],
    // ProductCard reads `categoryLabel`, but the API only sends
    // `category` (a slug like "two-pieces") — map it here so the
    // real label shows instead of falling back to "PRODUCT".
    categoryLabel: CATEGORY_LABELS[apiProduct.category] || prettySlug(apiProduct.category),
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

// TIP: sends ONE photo to POST /api/upload, which shrinks it, keeps any
// transparent background as-is, stores it on Cloudinary and returns its URL. (That route wants
// multipart/form-data, so this can't reuse authenticatedFetch, which
// forces a JSON Content-Type.)
// Same as uploadPhoto but also returns the photo's edge colour ("" when it has see-through parts),
// so the product card can be painted the same colour behind it.
export async function uploadPhotoWithBg(file) {
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
  return { url: data.urls[0], bg: data.bgs?.[0] || "" };
}
export async function uploadPhoto(file) {
  return (await uploadPhotoWithBg(file)).url;
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

/* ============================================================
   SHIPPING PRICES (per destination) — checkout reads a quote,
   the admin Shipping page reads/saves the full list
   ============================================================ */

// public: what does delivery to this country/state cost?
export async function getShippingQuote(country, state) {
  const params = new URLSearchParams({ country: country || "", state: state || "" });
  const res = await fetch(`${API_URL}/api/shipping/quote?${params}`);
  if (!res.ok) throw new Error("Could not load shipping prices");
  return res.json(); // { available, standard, express }
}

// admin: every saved row  [{ country, state, standard, express, active }]
export const getShippingRates = () => adminRequest("/api/shipping/rates");

// admin: replaces the whole list with the one sent
export const saveShippingRates = (rates) =>
  adminRequest("/api/shipping/rates", { method: "PUT", body: JSON.stringify({ rates }) });

/* ============================================================
   NEWSLETTER + ENQUIRIES + ORDER STATUS (public)
   ============================================================ */

// footer sign-up → { status: "subscribed" | "already" }
export async function subscribeNewsletter(email) {
  const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not subscribe. Please try again.");
  return data;
}

// Contact page, enquiry side → saved for Lara + emailed to her
export async function submitEnquiry(payload) {
  const res = await fetch(`${API_URL}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not send your message. Please try again.");
  return data;
}

// Contact page "Order status" → { orderNumber, status, createdAt } or null if not found
export async function lookupOrderStatus(reference) {
  const res = await fetch(`${API_URL}/api/orders/status/${encodeURIComponent(reference.trim())}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Could not check that order. Please try again.");
  return res.json();
}

/* ---------- NEWSLETTER + ENQUIRIES (admin) ---------- */
export const getSubscribers = () => adminRequest("/api/newsletter/subscribers");
export const getCampaigns = () => adminRequest("/api/newsletter/campaigns");
// testEmail (optional) = who gets the test copy; the server falls back to ADMIN_NOTIFY_EMAIL
export const sendNewsletter = (subject, body, testOnly = false, testEmail = "") =>
  adminRequest("/api/newsletter/send", { method: "POST", body: JSON.stringify({ subject, body, testOnly, testEmail }) });
export const getEnquiries = () => adminRequest("/api/enquiries");
export const updateEnquiryStatus = (id, status) =>
  adminRequest(`/api/enquiries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

/* ============================================================
   COUPONS · REVIEWS · BRAND · TEAM
   ============================================================ */

// public: checks a discount code against the bag → { code, type, value, discount }
export async function validateCoupon(code, items) {
  const res = await fetch(`${API_URL}/api/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, items }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not check that code.");
  return data;
}
export const getCoupons = () => adminRequest("/api/coupons");
export const saveCoupon = (payload, id) =>
  adminRequest(`/api/coupons${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
export const deleteCoupon = (id) => adminRequest(`/api/coupons/${id}`, { method: "DELETE" });

// public: approved reviews for a piece → { reviews, count, average }
export async function getProductReviews(productId) {
  const res = await fetch(`${API_URL}/api/reviews/product/${productId}`);
  if (!res.ok) throw new Error("Could not load reviews");
  return res.json();
}
// signed-in customer: may they write one? → { canReview, reason? }
export async function canReviewProduct(productId) {
  const res = await authenticatedFetch(`/api/reviews/can-review/${productId}`);
  if (!res.ok) return { canReview: false };
  return res.json();
}
export async function submitReview(payload) {
  const res = await authenticatedFetch("/api/reviews", { method: "POST", body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save your review.");
  return data;
}
export const getAdminReviews = () => adminRequest("/api/reviews");
export const setReviewStatus = (id, status) =>
  adminRequest(`/api/reviews/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteReview = (id) => adminRequest(`/api/reviews/${id}`, { method: "DELETE" });
// Lara types in a review herself (e.g. one a customer sent in a DM)
export const addManualReview = (payload) =>
  adminRequest("/api/reviews/manual", { method: "POST", body: JSON.stringify(payload) });

// categories: the built-in ones plus any Lara has added → [{ slug, label, custom }]
export async function getCategories() {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error("Could not load categories");
  return res.json();
}
export const createCategory = (label) =>
  adminRequest("/api/categories", { method: "POST", body: JSON.stringify({ label }) });
export const deleteCategory = (slug) => adminRequest(`/api/categories/${slug}`, { method: "DELETE" });

// public: brand settings the storefront uses (footer links, logo, favicon, colour)
export async function getBrand() {
  const res = await fetch(`${API_URL}/api/brand`);
  if (!res.ok) throw new Error("Could not load brand");
  return res.json();
}
export const saveBrand = (payload) => adminRequest("/api/brand", { method: "PUT", body: JSON.stringify(payload) });
export async function uploadBrandImage(file) {
  const body = new FormData();
  body.append("image", file);
  const res = await fetch(`${API_URL}/api/brand/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminSession.get()}` },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

// team (full admin only)
export const getTeam = () => adminRequest("/api/team");
export const inviteMember = (email, accessLevel) =>
  adminRequest("/api/team", { method: "POST", body: JSON.stringify({ email, accessLevel }) });
export const changeMemberLevel = (id, accessLevel) =>
  adminRequest(`/api/team/${id}`, { method: "PATCH", body: JSON.stringify({ accessLevel }) });
export const removeMember = (id) => adminRequest(`/api/team/${id}`, { method: "DELETE" });
export const resendInvite = (id) => adminRequest(`/api/team/${id}/resend`, { method: "POST" });
// public: the person who got the invite email chooses a password
export async function acceptInvite(token, password, name) {
  const res = await fetch(`${API_URL}/api/auth/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not set your password.");
  return data; // { token, name, email, accessLevel }
}

/* ---------- CUSTOM ORDERS (admin) ---------- */
export const getCustomOrders = () => adminRequest("/api/custom-orders");

export const updateCustomOrderStatus = (id, status) =>
  adminRequest(`/api/custom-orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });