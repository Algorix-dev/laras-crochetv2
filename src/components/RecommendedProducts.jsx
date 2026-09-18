import { useEffect, useState } from 'react';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from './ProductGrid';

/* -----------------------------------------------------------
   RecommendedProducts — "Lara Thinks You'd Love These Too"

   TIP: this used to be copy-pasted independently into 7 different
   files (AddressesPage, OrderHistoryPage, AccountPage, WishlistPage,
   MyBagPage, BagDrawer, ProductDetail), each with its own slightly
   different heading style and column count — which is why it looked
   different on every page. Checked the Figma export for Order
   History, Addresses, and the Account page directly: all three use
   the IDENTICAL treatment (same heading size, full page width,
   4-column grid), so this component is that one shared design,
   used everywhere instead of guessed at per-page.

   Two ways to use it:
   - <RecommendedProducts category={product.category} excludeId={product.id} />
     for a specific product's page (ProductDetail) — recommends
     other products in the same category, excluding itself.
   - <RecommendedProducts /> with no props — recommends across all
     products, for the general account pages (Order History,
     Addresses, Account, Wishlist, Bag) where there's no single
     "current product" to match against.

   - <RecommendedProducts excludeId={wishlistItemIds} /> when excluding
     more than one product (WishlistPage, so it doesn't recommend
     something already sitting in the wishlist) — excludeId accepts
     either a single id or an array of ids.
   - <RecommendedProducts enabled={open} columns={2} headingClassName="..."
     onProductClick={onClose} /> for a compact, non-page context like
     BagDrawer: enabled gates the fetch (so a closed drawer doesn't
     fetch at all), columns/headingClassName override the default
     Figma page treatment for a narrow space, and onProductClick fires
     when a card is clicked (BagDrawer uses this to close itself so
     the drawer doesn't block navigating to the product).

   className is for the spacing/margin around this block, since that
   reasonably varies by where it's dropped in (a page with a lot of
   content above it might want more top margin than an empty state) —
   everything else (heading, grid, columns) stays consistent by
   default, matching the Figma page treatment, unless overridden.
----------------------------------------------------------- */
export default function RecommendedProducts({
  category,
  excludeId,
  className = 'mt-16',
  enabled = true,
  columns = 4,
  headingClassName = 'text-[24px] font-bold leading-[30px] tracking-[-0.48px] md:text-[36px] md:leading-[44px] md:tracking-[-0.72px]',
  onProductClick,
}) {
  const [products, setProducts] = useState([]);

  // TIP: excludeId can be a single id (ProductDetail excluding
  // itself) or an array of ids (WishlistPage excluding everything
  // already wishlisted) — normalized here so callers don't have to
  // wrap a single id in an array themselves.
  const excludeIds = Array.isArray(excludeId) ? excludeId : excludeId ? [excludeId] : [];

  useEffect(() => {
    if (!enabled || products.length > 0) return;
    getProducts(category)
      .then((data) => {
        const mapped = data.map(normalizeProduct).filter((p) => !excludeIds.includes(p.id));
        setProducts(mapped.slice(0, 4));
      })
      .catch(() => setProducts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, JSON.stringify(excludeIds), enabled]);

  if (products.length === 0) return null;

  return (
    <section className={className}>
      <h2
        className={headingClassName}
        style={{ fontFamily: 'DM Sans, sans-serif' }}
      >
        Lara Thinks You&apos;d Love These Too
      </h2>
      <div className="mt-6" onClick={onProductClick}>
        <ProductGrid products={products} columns={columns} cardVariant="recommendation" />
      </div>
    </section>
  );
}