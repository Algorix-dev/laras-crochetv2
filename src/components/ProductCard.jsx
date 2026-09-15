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

  TIP: the image sits inside a `p-3` inset on its container (not
  flush edge-to-edge with the white card) so there's visible
  breathing room between the photo and the card boundary on all
  four sides. The `aspectRatio: 640/731` still governs the OUTER
  box (so every card in a grid stays the same size) — the padding
  just eats into that box, so `object-cover` still fills the
  (now-smaller) inner area with no gaps or letterboxing. If Lara
  wants a specific measurement off Figma instead of this p-3
  default, swap that one class.

  TIP: the un-wishlisted heart now fills faintly instead of being
  a pure stroke-only outline (fill="none"). At the size this icon
  renders (14px in the badge, still fairly small at 19px in the
  recommendation variant), a hollow heart's two top lobes compress
  down to looking like two separate little blobs rather than one
  heart shape. A faint fill gives the eye enough mass in the middle
  to read it as one shape. Wishlisted state is unchanged — solid
  currentColor fill, no ambiguity there.
*/
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductPlaceholder from './ProductPlaceholder';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';

// Faint fill for the un-wishlisted state — see the TIP above about
// why a fully hollow heart reads as "two blobs" at this size.
const HEART_UNFILLED = 'rgba(64, 64, 64, 0.15)';

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
        className="relative block overflow-hidden bg-white p-3"
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
              fill={inWishlist ? 'currentColor' : HEART_UNFILLED}
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
            <Heart size={19} strokeWidth={1.5} fill={inWishlist ? 'currentColor' : HEART_UNFILLED} />
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