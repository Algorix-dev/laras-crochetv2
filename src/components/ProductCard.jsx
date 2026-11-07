import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductPlaceholder from './ProductPlaceholder';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import BagIcon from './BagIcon';
import { defaultVariant } from '../utils/variantLabel';
import { cardImageSrcSet, CARD_IMAGE_SIZES } from '../api';

const HEART_UNFILLED = 'rgba(64, 64, 64, 0.15)';

export default function ProductCard({
  product,
  variant = 'default',
  isPlaceholder = false,
  priority = false, // first row of a grid: load right away instead of lazily
}) {
  const { addToBag, openBag, cartItems } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  const isRecommendation = variant === 'recommendation';
  const inWishlist = isInWishlist(product.id);
  // TIP: client review — the bag icon should show filled once the piece is
  // added. cartItems doesn't key by product id alone (each line is a
  // color/shade/size variant), so this checks whether ANY line in the bag
  // is this product, regardless of which variant.
  const inBag = cartItems.some((item) => item.product.id === product.id);

  const handleAddToBag = () => {
    if (isPlaceholder) return;

    // TIP: same first colour / shade / size the product page pre-selects (see utils/variantLabel.js).
    const v = defaultVariant(product);
    addToBag(product, v.color, v.shade, v.size);

    openBag();
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();

    if (isPlaceholder) return;

    toggleWishlist(product.id);
  };

  const CardLink = isPlaceholder ? 'div' : Link;

  const cardLinkProps = isPlaceholder
    ? {}
    : {
        to: `/product/${product.id}`,
      };

  return (
    <div
      className={`
        group
        w-full
        min-w-0
      `}
    >
      {/* ==========================================================
          PRODUCT IMAGE
      =========================================================== */}
      <CardLink
        {...cardLinkProps}
        className={`
          relative
          block
          w-full
          overflow-hidden
          bg-white

          ${
            isRecommendation
              ? 'aspect-[196/260] lg:aspect-[313/404]'
              : 'aspect-[164/272] min-[375px]:aspect-auto min-[375px]:h-[calc(17rem+(100vw-23.4375rem)*0.3546)] md:h-auto md:aspect-[640/731]'
          }
        `}
        /* TIP: if the photo has its own solid background (no see-through parts), the server saved
           that colour when it was uploaded; painting the card with it hides the box edge around
           the photo. No saved colour = the normal white card, exactly as before. */
        style={product.viewBg?.front ? { backgroundColor: product.viewBg.front } : undefined}
      >
        {/* The mobile Figma defines the image frame itself.
            The product image fills the frame without an additional
            percentage inset, so the actual garment appears larger. */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              srcSet={cardImageSrcSet(product.image)}
              sizes={cardImageSrcSet(product.image) ? CARD_IMAGE_SIZES : undefined}
              alt={product.name}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              className="
                h-full
                w-full
                object-contain
                transition-transform
                duration-500
                group-hover:scale-105
              "
            />
          ) : (
            <ProductPlaceholder className="h-full w-full" />
          )}
        </div>

        {/* TIP: the tag Lara picks on the product form (New, Bestseller...). Change the look with the
            classes below; bg-[var(--maroon)] is the badge colour. */}
        {product.tag && (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-[var(--maroon)] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white md:bottom-3 md:left-3 md:text-[0.6875rem]">
            {product.tag}
          </span>
        )}

        {/* ========================================================
            DEFAULT CARD WISHLIST BADGE
        ========================================================= */}
        {!isRecommendation && (
          <button
            type="button"
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            aria-disabled={isPlaceholder}
            onClick={handleToggleWishlist}
            className={`
              absolute left-[1rem] top-[0.375rem]
              flex h-[1.75rem] w-[1.75rem] items-center justify-center
              rounded-full bg-[#EFE7E7] text-[#412B2D]
              md:left-5 md:top-5 md:h-8 md:w-8
              ${isPlaceholder ? 'cursor-default opacity-60' : 'hover:text-[var(--maroon)]'}
            `}
          >
            <Heart
              size={16}
              strokeWidth={1.5}
              fill={inWishlist ? 'currentColor' : HEART_UNFILLED}
            />
          </button>
        )}
      </CardLink>

      {/* ==========================================================
          PRODUCT INFORMATION
      =========================================================== */}
      <div
        className={`
          flex
          items-start
          justify-between

          ${
            isRecommendation
              ? `
                min-h-[2.7031rem]
                gap-[0.2031rem]
                px-[0.625rem]
                pt-0
                mt-[0.625rem]
              `
              : `
                min-h-[3.8281rem]
                gap-[0.3281rem]
                px-[0.75rem]
                pt-0
                mt-[1.1162rem]
              `
          }

          lg:mt-[1.1rem]
          lg:px-3
        `}
      >
        <CardLink
          {...cardLinkProps}
          className={`
            min-w-0
            flex-1
          `}
        >
          {/* Category */}
          {!isRecommendation && (
            <div
              className="
                truncate
                whitespace-nowrap
                text-[0.75rem]
                font-normal
                leading-[1.125rem]
                text-[#737373]
                lg:text-xs
              "
            >
              {(
                product.categoryLabel ||
                product.category ||
                'Product'
              ).toUpperCase()}
            </div>
          )}

          {/* Product name */}
          <div
            className={`
              truncate
              whitespace-nowrap
              text-[0.875rem]
              font-bold
              leading-[1.25rem]
              uppercase

              ${
                isRecommendation
                  ? 'text-[#000000]'
                  : 'text-[#404040]'
              }

              lg:text-base
              lg:leading-6
            `}
          >
            {product.name}
          </div>

          {/* Price */}
          <div
            className={`
              whitespace-nowrap
              text-[0.875rem]
              font-normal
              leading-[1.25rem]

              ${
                isRecommendation
                  ? 'text-[#000000]'
                  : 'text-[#404040]'
              }

              lg:text-base
              lg:leading-6
            `}
          >
            {formatPrice(product.price)}
            {/* while a discount is running, the normal price stays visible, crossed out */}
            {product.onSale && <span className="ml-2 font-normal text-[#8a8a8a] line-through">{formatPrice(product.compareAtPrice)}</span>}
          </div>
        </CardLink>

        {/* ========================================================
            ACTION ICON
        ========================================================= */}
        {isRecommendation ? (
          <button
            type="button"
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${product.name} ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            aria-disabled={isPlaceholder}
            onClick={handleToggleWishlist}
            className={`
              -mr-[0.1875rem] flex h-6 w-6 shrink-0 items-center justify-center
              text-[#000000] transition-colors
              ${isPlaceholder ? 'cursor-default opacity-60' : 'hover:text-[var(--maroon)]'}
            `}
          >
            <Heart
              size={18}
              strokeWidth={1.5}
              fill={inWishlist ? 'currentColor' : HEART_UNFILLED}
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Add ${product.name} to bag`}
            aria-disabled={isPlaceholder}
            onClick={handleAddToBag}
            className={`
              ml-auto
              flex
              h-[1rem]
              w-[1rem]
              shrink-0
              items-center
              justify-center
              text-[#000000]
              transition-colors

              ${
                isPlaceholder
                  ? 'cursor-default opacity-60'
                  : 'hover:text-[var(--maroon)]'
              }
            `}
          >
            <BagIcon size={16} filled={inBag} lineColor="#FFFFFF" />
          </button>
        )}
      </div>
    </div>
  );
}
