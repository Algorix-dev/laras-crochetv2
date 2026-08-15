// TIP: one place for every backend call, instead of scattering
// fetch(`${import.meta.env.VITE_API_URL}/api/...`) across a dozen
// components. If the API's base URL or response shape ever changes,
// this is the only file that needs to change.
const API_URL = import.meta.env.VITE_API_URL;

export async function getProducts(category = 'all') {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  const res = await fetch(`${API_URL}/api/products${query}`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function getProduct(id) {
  const res = await fetch(`${API_URL}/api/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
}

// TIP: attaches the customer's JWT automatically — every page that
// needs an authenticated call (addresses, order history) can use
// this instead of manually building the Authorization header each time.
export async function authenticatedFetch(path, options = {}) {
  const token = localStorage.getItem('laras-token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  return res;
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
