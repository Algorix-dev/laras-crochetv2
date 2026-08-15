/*
  TIP: This page needs zero new "remove from wishlist" logic — the
  ProductCard's heart icon already calls toggleWishlist(), and since
  it's filled-in (fill="currentColor") for anything in the wishlist,
  clicking it here removes the item and the grid just re-renders
  without it. Reusing ProductGrid instead of writing new grid markup
  is exactly the same trick as ShopPage.jsx.
*/
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { products } from '../data/products';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

export default function WishlistPage() {
  const { wishlistItems } = useWishlist();

  // TIP: wishlistItems is just an array of product IDs (see
  // WishlistContext) — this looks up the full product objects so
  // ProductGrid has what it needs to actually render cards.
  const wishlistedProducts = products.filter((p) => wishlistItems.includes(p.id));

  // "You might also like" — recommend products NOT already in the wishlist
  const recommended = products.filter((p) => !wishlistItems.includes(p.id));

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-10 md:px-8">
        {wishlistedProducts.length > 0 ? (
          <>
            <h1 className="font-display text-2xl italic mb-1">
              Wishlist ({wishlistedProducts.length})
            </h1>
            <p className="mb-8 text-sm text-[var(--muted)]">
              Some pieces you loved from Lara's Crochet.
            </p>
            <ProductGrid products={wishlistedProducts} />
          </>
        ) : (
          <div className="mb-12">
            <h1 className="font-display text-2xl italic mb-1">Wishlist</h1>
            <p className="text-sm text-[var(--muted)]">
              You have 0 items in your wishlist.{' '}
              <Link to="/shop" className="underline underline-offset-2 hover:text-[var(--ink)]">
                Start shopping →
              </Link>
            </p>
          </div>
        )}

        {recommended.length > 0 && (
          <div className={wishlistedProducts.length > 0 ? '' : 'mt-2'}>
            <h2 className="mb-6 text-sm font-bold">Lara Thinks You'd Love These Too</h2>
            <ProductGrid products={recommended} />
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
