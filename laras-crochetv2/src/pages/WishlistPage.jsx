/*
  TIP: This page needs zero new "remove from wishlist" logic — the
  ProductCard's heart icon already calls toggleWishlist(), and since
  it's filled-in (fill="currentColor") for anything in the wishlist,
  clicking it here removes the item and the grid just re-renders
  without it. Reusing ProductGrid instead of writing new grid markup
  is exactly the same trick as ShopPage.jsx.
*/
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // TIP: wishlistItems is just an array of product IDs (see
  // WishlistContext) — we fetch the full catalog once from the API
  // (like ShopPage does) and match IDs client-side, instead of
  // reading the old hardcoded products.js array.
  useEffect(() => {
    getProducts('all')
      .then((data) => setAllProducts(data.map(normalizeProduct)))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const wishlistedProducts = allProducts.filter((p) => wishlistItems.includes(p.id));

  // "Lara Thinks You'd Love These Too" — recommend products NOT already in the wishlist
  const recommended = allProducts.filter((p) => !wishlistItems.includes(p.id)).slice(0, 4);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-5 pt-10 pb-24 text-sm text-[var(--muted)] md:px-8">
        Loading your wishlist...
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-10 md:px-8">
        {wishlistedProducts.length > 0 ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-1">
              Wishlist ({wishlistedProducts.length})
            </h1>
            <p className="mb-8 text-sm text-[var(--muted)]">
              Some pieces you love from Lara's Crochet.
            </p>
            <ProductGrid products={wishlistedProducts} />
          </>
        ) : (
          <div className="mb-12">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-1">
              Wishlist
            </h1>
            <p className="text-sm text-[var(--muted)] mb-3">
              You have 0 items in your wishlist
            </p>
            <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 hover:text-[var(--maroon)]">
              Start shopping →
            </Link>
          </div>
        )}

        {recommended.length > 0 && (
          <div className={wishlistedProducts.length > 0 ? 'mt-16 pb-16' : 'mt-2 pb-16'}>
            <h2 className="font-display text-2xl md:text-3xl mb-8">Lara Thinks You'd Love These Too</h2>
            <ProductGrid products={recommended} />
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
