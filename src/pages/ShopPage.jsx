/*
  TIP: This page is mostly wiring, not new logic — ProductGrid and
  ProductCard were already built for the homepage, and they just
  take a `products` array as a prop. So "building a shop page" here
  really means: (1) filter the array by category with useState +
  .filter(), (2) render a row of tab buttons that set that state,
  (3) hand the filtered array to the ProductGrid we already have.
  This is a common React pattern: components that render lists don't
  need to know WHY the list is the length it is — the parent (this
  page) decides what data to pass down, the child (ProductGrid) just
  renders whatever it's given.
*/
/*
  TIP: This page now fetches from the live database instead of the
  static products.js file. Category filtering moved server-side too —
  GET /api/products?category=dresses does the filtering in the
  database query, so the browser only ever downloads the products
  it's actually going to show, instead of fetching everything and
  filtering client-side (which is what the old version did with a
  local array — fine for 3 hardcoded items, wasteful once Lara has
  a real catalog).
*/
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from '../components/ProductGrid';

// TIP: turns 'two-pieces' into 'Two Pieces' for display, so the data
// file can stay in clean lowercase-hyphen slugs (good for URLs/code)
// while the UI still shows something readable.
const formatLabel = (slug) =>
  slug
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

// TIP: the Figma shows a "View More Products" button rather than
// numbered pages. Until Lara's catalog is big enough to need real
// server-side pagination, we fetch the full category (the API call
// is cheap at this scale) and just reveal more of the already-
// fetched array client-side, PAGE_SIZE at a time. If the catalog
// grows into the hundreds, swap this for a `?page=` query param on
// getProducts() instead — the button UI itself won't need to change.
const PAGE_SIZE = 9;

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // TIP: this effect re-runs every time activeCategory changes,
  // because activeCategory is in the dependency array below. Click
  // a different tab → state changes → effect re-fires → new fetch
  // with the new category in the query string.
  useEffect(() => {
    setLoading(true);
    setError(null);
    setVisibleCount(PAGE_SIZE);
    getProducts(activeCategory)
      .then((data) => setProducts(data.map(normalizeProduct)))
      .catch(() => setError('Could not load products — check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  // TIP: search filters the already-fetched category list client-side
  // by product name — no extra network round trip needed for this.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [products, search]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10">
      {/* Header row: title/subtitle on the left, search on the right */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-2">
            Shop Lara's Crochet
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Shop the latest pieces and must-haves from Lara's Crochet
          </p>
        </div>

        <label className="relative w-full md:w-72 shrink-0">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full rounded-md border border-[var(--line)] bg-white py-2.5 pl-4 pr-10 text-sm outline-none focus-visible:border-[var(--ink)]"
          />
          <Search
            size={16}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
        </label>
      </div>

      {/* Breadcrumb */}
      <p className="text-xs text-[var(--muted)] mb-6">
        <Link to="/" className="hover:text-[var(--ink)]">Home</Link>
        {' / '}
        <span className="text-[var(--ink)]">Shop</span>
      </p>

      {/* Category tabs — bordered pills, matching the Figma. Kept
          horizontally scrollable on mobile so it doesn't wrap
          awkwardly if Lara adds more categories later. No "All" pill
          in the design, so clearing the filter happens by clicking
          the active pill again. */}
      <div className="flex gap-3 overflow-x-auto pb-1 mb-10 text-xs uppercase tracking-wide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? 'all' : cat)}
            className={`shrink-0 rounded-md border px-4 py-2 font-semibold transition-colors ${
              activeCategory === cat
                ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
            }`}
          >
            {formatLabel(cat)}
          </button>
        ))}
      </div>

      {/* TIP: distinct states so the person browsing always
          understands what's happening — loading, error, genuinely-
          empty, and no-search-results are each a different message
          rather than one blank grid. */}
      {loading ? (
        <p className="pb-24 text-sm text-[var(--muted)]">Loading products...</p>
      ) : error ? (
        <p className="pb-24 text-sm text-red-500">{error}</p>
      ) : visibleProducts.length > 0 ? (
        <>
          <ProductGrid products={visibleProducts} />
          {hasMore && (
            <div className="flex justify-center py-14">
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="rounded-md bg-[var(--maroon)] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[var(--maroon-dark)] cursor-pointer"
              >
                View More Products
              </button>
            </div>
          )}
        </>
      ) : search ? (
        <p className="pb-24 text-sm text-[var(--muted)]">
          No products match "{search}".
        </p>
      ) : (
        <p className="pb-24 text-sm text-[var(--muted)]">
          No products in this category yet — check back soon.
        </p>
      )}
    </section>
  );
}
