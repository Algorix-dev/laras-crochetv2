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

  TIP — IMAGE FIT (changed from object-cover/p-3):
  The old `p-3` + `object-cover` combo was CROPPING every photo to
  fill the box — which is exactly what was slicing heads off the
  top of some cards (object-cover always crops when the photo's own
  proportions don't match the card's, it never letterboxes). Since
  Lara specifically chose/posed each product photo on purpose, no
  photo should ever be cropped here.

  Fixed with two changes together:
  1. `object-contain` instead of `object-cover` — this CANNOT crop.
     The whole photo is always fully visible, scaled to fit.
  2. The flat `p-3` (a fixed 12px, same at every screen size) is
     replaced with a percentage-based inset matching Figma's actual
     "Rectangle 37" spec (506.26 x 667.57 photo inside a 640 x 731
     card): 4.24% top / 4.44% bottom / 10.45% left+right. Using
     percentages means the inset scales correctly whether this card
     is rendered small (2-up mobile grid) or large (3-up desktop
     Shop grid), instead of only being correct at one fixed pixel
     size.

  Because real product photos vary in their own width-to-height
  ratio (some are photographed tighter/wider than others), you may
  see a little more empty space on the left/right of some photos
  than others — that's expected and correct: it's the trade-off for
  guaranteeing nothing is ever cropped. If a specific photo still
  looks too small/swimming in whitespace, that's a photo-cropping
  fix on the source image itself, not something to solve by going
  back to object-cover (which brings the head-cropping bug back).

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

// Figma "Rectangle 37" inset, expressed as % of the 640x731 card so
// it scales correctly at any rendered size: top 31/731, bottom
// (731-31-667.57)/731, left/right (640-506.26)/2/640.
const IMAGE_INSET = "4.24% 10.45% 4.44%";

// TIP: isPlaceholder is true for the brief window where a card is
// showing static fallback data (e.g. HomePage's "Shop Our Pieces"
// before the live fetch resolves — see App.jsx). Those fake IDs
// ("wisteria", "sunset", etc.) don't exist in the real database, so
// clicking through, wishlisting, or bagging one at that moment would
// 404 on the product page or leave a broken phantom item in the
// cart/wishlist. Rather than patch each interaction separately, this
// one flag turns the whole card into a non-interactive preview until
// real data swaps in — image still shows, nothing is clickable.
export default function ProductCard({ product, variant = 'default', isPlaceholder = false }) {
  const { addToBag, openBag } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPriceNumber } = useCurrency();
  const isRecommendation = variant === 'recommendation';
  const inWishlist = isInWishlist(product.id);

  const handleAddToBag = () => {
    if (isPlaceholder) return;
    addToBag(
      product,
      product.colors?.[0] || 'Default',
      product.shades?.[0] || 'Default',
      product.sizes?.[0] || 'S'
    );
    openBag();
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    if (isPlaceholder) return;
    toggleWishlist(product.id);
  };

  // Swaps between a real <Link> and an inert <div> with the exact
  // same classes/layout — so the card looks and sizes identically
  // either way, it just isn't a navigation target while placeholder.
  const CardLink = isPlaceholder ? 'div' : Link;
  const cardLinkProps = isPlaceholder ? {} : { to: `/product/${product.id}` };

  return (
    <div className="group">
      <CardLink
        {...cardLinkProps}
        className="relative block overflow-hidden bg-white"
        style={{ aspectRatio: "640 / 731" }}
      >
        {/* Photo sits inside this proportionally-inset wrapper,
            never the full card — see TIP above. */}
        <div className="absolute inset-0" style={{ padding: IMAGE_INSET }}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <ProductPlaceholder className="h-full w-full" />
          )}
        </div>

        {!isRecommendation && (
          <button
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            aria-disabled={isPlaceholder}
            onClick={handleToggleWishlist}
            className={`absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#EFE7E7] ${isPlaceholder ? 'cursor-default opacity-60' : 'hover:text-[var(--maroon)]'}`}
          >
            <Heart
              size={14}
              strokeWidth={1.5}
              fill={inWishlist ? 'currentColor' : HEART_UNFILLED}
            />
          </button>
        )}
      </CardLink>

      <div className="mt-[1.1rem] flex items-start justify-between gap-2 px-3">
        <CardLink {...cardLinkProps} className="min-w-0 flex-1">
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
        </CardLink>

        {isRecommendation ? (
          <button
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            aria-disabled={isPlaceholder}
            onClick={handleToggleWishlist}
            className={`shrink-0 text-[#404040] transition-colors ${isPlaceholder ? 'cursor-default opacity-60' : 'hover:text-[var(--maroon)]'}`}
          >
            <Heart size={19} strokeWidth={1.5} fill={inWishlist ? 'currentColor' : HEART_UNFILLED} />
          </button>
        ) : (
          <button
            aria-label={`Add ${product.name} to bag`}
            aria-disabled={isPlaceholder}
            onClick={handleAddToBag}
            className={`shrink-0 text-[#404040] transition-colors ${isPlaceholder ? 'cursor-default opacity-60' : 'hover:text-[var(--maroon)]'}`}
          >
            <ShoppingBag size={19} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}