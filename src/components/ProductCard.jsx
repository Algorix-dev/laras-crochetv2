/*
  TIP: Each ProductCard is a self-contained unit — image, name,
  price, and an "Add to Bag" button. The image and the name/price
  both link to the product detail page. The bag icon adds the
  product directly with default options (first color, shade, size).

  We use <Link> from react-router-dom instead of <a> tags so
  navigation happens without a full page reload.
*/
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductPlaceholder from './ProductPlaceholder';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';

export default function ProductCard({ product }) {
  const { addToBag } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  /* TIP: This shortcut adds the product with default selections
     (first color, first shade, first size) — useful for the grid
     where you don't want to force someone through the detail page
     just to add something to their bag. */
  const handleAddToBag = () =>
    addToBag(
      product,
      product.colors?.[0] || 'Default',
      product.shades?.[0] || 'Default',
      product.sizes?.[0] || 'S'
    );

  return (
    <div className="group">
      {/* Image — white card background (was #efece6 grey), aspect
          ratio 640/731 from Figma's Frame 34 (640x818.11 card minus
          the 69.25px footer row and 17.86px gap between them). */}
      <Link
        to={`/product/${product.id}`}
        className="relative block overflow-hidden bg-white"
        style={{ aspectRatio: "640 / 731" }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ProductPlaceholder className="h-full w-full" />
        )}

        {/* Wishlist heart — Figma's "Favorites" badge: 28x28 circle,
            #EFE7E7, positioned 20px from top/left of the image. */}
        <button
          aria-label={`${isInWishlist(product.id) ? 'Remove' : 'Add'} ${product.name} ${isInWishlist(product.id) ? 'from' : 'to'} wishlist`}
          aria-pressed={isInWishlist(product.id)}
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#EFE7E7] hover:text-[var(--maroon)]"
        >
          <Heart
            size={14}
            strokeWidth={1.5}
            fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
          />
        </button>
      </Link>

      {/* Footer row — Figma's Frame 23: 17.86px gap above, 12px
          side padding, category label stacked over name, price
          below, bag icon top-aligned on the right (no circle/border
          around it in the Figma, unlike the old version). */}
      <div className="mt-[1.1rem] flex items-start justify-between gap-2 px-3">
        <Link to={`/product/${product.id}`} className="min-w-0 flex-1">
          <div className="whitespace-nowrap text-xs leading-[18px] text-[#737373]">
            {product.categoryLabel?.toUpperCase() || 'PRODUCT'}
          </div>
          <div className="truncate text-base font-bold leading-6 text-[#404040] uppercase">
            {product.name}
          </div>
          <div className="whitespace-nowrap text-base leading-6 text-[#404040]">
            {formatPrice(product.price)}
          </div>
        </Link>

        <button
          aria-label={`Add ${product.name} to bag`}
          onClick={handleAddToBag}
          className="shrink-0 text-[#404040] transition-colors hover:text-[var(--maroon)]"
        >
          <ShoppingBag size={19} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}