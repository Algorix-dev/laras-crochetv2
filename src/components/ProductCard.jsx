/*
  TIP: Each ProductCard is a self-contained unit — image, name,
  price, and an "Add to Bag" button. The image and the name/price
  both link to the product detail page. The bag icon adds the
  product directly with default options (first color, shade, size).

  We use <Link> from react-router-dom instead of <a> tags so
  navigation happens without a full page reload.

  TIP: Figma actually uses two card looks, not one:
  - "default" — the main Shop grid / homepage teaser. Top-left
    wishlist badge over the image, a muted category line above the
    name, and a bag icon (add straight to cart) bottom-right.
  - "recommendation" — the "Lara Thinks You'd Love These Too"
    strips on My Bag / Wishlist / Shop. No badge over the image, no
    category line, and the bottom-right icon is a heart (toggles
    wishlist) instead of a bag. Confirmed against the Figma exports
    pixel-by-pixel — these aren't a simplified placeholder, the
    recommendation strips consistently drop the category line and
    swap the icon everywhere they appear.
*/
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductPlaceholder from './ProductPlaceholder';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';

export default function ProductCard({ product, variant = 'default' }) {
  const { addToBag, openBag } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPriceNumber } = useCurrency();
  const isRecommendation = variant === 'recommendation';
  const inWishlist = isInWishlist(product.id);

  const handleAddToBag = () => {
    addToBag(
      product,
      product.colors?.[0] || 'Default',
      product.shades?.[0] || 'Default',
      product.sizes?.[0] || 'S'
    );
    openBag();
  };

  return (
    <div className="group">
      <Link
        to={`/product/${product.id}`}
        className="relative block overflow-hidden bg-white"
        style={{ aspectRatio: "640 / 731" }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductPlaceholder className="h-full w-full" />
        )}

        {!isRecommendation && (
          <button
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className="absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#EFE7E7] hover:text-[var(--maroon)]"
          >
            <Heart
              size={14}
              strokeWidth={1.5}
              fill={inWishlist ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </Link>

      <div className="mt-[1.1rem] flex items-start justify-between gap-2 px-3">
        <Link to={`/product/${product.id}`} className="min-w-0 flex-1">
          {!isRecommendation && (
            <div className="whitespace-nowrap text-xs leading-[18px] text-[#737373]">
              {product.categoryLabel?.toUpperCase() || 'PRODUCT'}
            </div>
          )}
          <div className="truncate text-base font-bold leading-6 text-[#404040] uppercase">
            {product.name}
          </div>
          <div className="whitespace-nowrap text-base leading-6 text-[#404040]">
            {formatPriceNumber(product.price)}
          </div>
        </Link>

        {isRecommendation ? (
          <button
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className="shrink-0 text-[#404040] transition-colors hover:text-[var(--maroon)]"
          >
            <Heart size={19} strokeWidth={1.5} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        ) : (
          <button
            aria-label={`Add ${product.name} to bag`}
            onClick={handleAddToBag}
            className="shrink-0 text-[#404040] transition-colors hover:text-[var(--maroon)]"
          >
            <ShoppingBag size={19} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}