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
export function normalizeProduct(apiProduct) {
  return {
    ...apiProduct,
    id: apiProduct._id,
    image: apiProduct.images?.[0],
  };
}
