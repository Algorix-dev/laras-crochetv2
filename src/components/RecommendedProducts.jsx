import { useEffect, useState } from 'react';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from './ProductGrid';

/* -----------------------------------------------------------
   RecommendedProducts — "Lara Thinks You'd Love These Too"

   Shared recommendation section used across:
   - ProductDetail
   - OrderHistory
   - Addresses
   - Account
   - Wishlist
   - MyBag
   - BagDrawer

   Mobile Figma:
   - Heading: 18px / 28px
   - Recommendation cards: 196px wide
   - Recommendation image: 196px × 260px
   - Cards scroll horizontally
   - Gap between cards: 10px

   Desktop behavior remains controlled by ProductGrid and
   ProductCard's responsive desktop styles.
----------------------------------------------------------- */

export default function RecommendedProducts({
  category,
  excludeId,
  className = 'mt-16',
  enabled = true,
  columns = 4,
  headingClassName =
    'text-[18px] font-bold leading-[26px] tracking-[-0.36px] md:text-[36px] md:leading-[44px] md:tracking-[-0.72px]',
  onProductClick,
}) {
  const [products, setProducts] = useState([]);

  // excludeId can be:
  // - one product id
  // - an array of product ids
  const excludeIds = Array.isArray(excludeId)
    ? excludeId
    : excludeId
      ? [excludeId]
      : [];

  useEffect(() => {
    if (!enabled || products.length > 0) return;

    getProducts(category)
      .then(async (data) => {
        let mapped = data
          .map(normalizeProduct)
          .filter((product) => !excludeIds.includes(product.id));

        // If the category has no other products, fall back
        // to the full catalogue.
        if (mapped.length === 0 && category) {
          const all = await getProducts();

          mapped = all
            .map(normalizeProduct)
            .filter(
              (product) => !excludeIds.includes(product.id)
            );
        }

        // Keep the recommendation section limited to four products.
        setProducts(mapped.slice(0, 4));
      })
      .catch(() => setProducts([]));

    // excludeIds is intentionally serialized for dependency tracking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, JSON.stringify(excludeIds), enabled]);

  if (products.length === 0) return null;

  return (
    <section className={className}>
      {/* Recommendation heading */}
      <h2
        className={headingClassName}
        style={{
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        Lara Thinks You&apos;d Love These Too
      </h2>

      {/* Recommendation products */}
      <div
        className="mt-6"
        onClick={onProductClick}
      >
        <ProductGrid
          products={products}
          columns={columns}
          cardVariant="recommendation"
          wrapInSection={false}
          scrollOnMobile={columns === 4}
        />
      </div>
    </section>
  );
}