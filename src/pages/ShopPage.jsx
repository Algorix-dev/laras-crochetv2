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
import { useEffect, useState } from 'react';
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

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // TIP: this effect re-runs every time activeCategory changes,
  // because activeCategory is in the dependency array below. Click
  // a different tab → state changes → effect re-fires → new fetch
  // with the new category in the query string.
  useEffect(() => {
    setLoading(true);
    setError(null);
    getProducts(activeCategory)
      .then((data) => setProducts(data.map(normalizeProduct)))
      .catch(() => setError('Could not load products — check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10">
      {/* Page header */}
      <h1 className="font-display text-3xl md:text-4xl italic mb-2">
        Shop Lara's Crochet
      </h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Shop the latest pieces and made items from Lara's Crochet
      </p>

      {/* Category tabs — horizontally scrollable on mobile so it
          doesn't wrap awkwardly if Lara adds more categories later */}
      <div className="flex gap-6 overflow-x-auto border-b border-[var(--line)] pb-3 mb-10 text-sm uppercase tracking-wide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 pb-1 ${
            activeCategory === 'all'
              ? 'border-b-2 border-[var(--ink)] font-bold text-[var(--ink)]'
              : 'text-[var(--muted)] hover:text-[var(--ink)]'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 pb-1 ${
              activeCategory === cat
                ? 'border-b-2 border-[var(--ink)] font-bold text-[var(--ink)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {formatLabel(cat)}
          </button>
        ))}
      </div>

      {/* TIP: three distinct states now instead of one — loading,
          error, and empty each need their own message so the person
          browsing always understands what's happening, rather than
          a blank grid that looks the same whether it's still
          fetching or genuinely has nothing to show. */}
      {loading ? (
        <p className="pb-24 text-sm text-[var(--muted)]">Loading products...</p>
      ) : error ? (
        <p className="pb-24 text-sm text-red-500">{error}</p>
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="pb-24 text-sm text-[var(--muted)]">
          No products in this category yet — check back soon.
        </p>
      )}
    </section>
  );
}
