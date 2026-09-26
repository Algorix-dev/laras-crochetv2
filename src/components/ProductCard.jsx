import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductPlaceholder from './ProductPlaceholder';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';

const HEART_UNFILLED = 'rgba(64, 64, 64, 0.15)';

export default function ProductCard({
  product,
  variant = 'default',
  isPlaceholder = false,
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
        ${isRecommendation ? 'w-[196px]' : 'w-[164px]'}
        lg:w-auto
        lg:max-w-none
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
              ? 'h-[260px] lg:aspect-[313/404] lg:h-auto'
              : 'h-[272px] lg:aspect-[640/731] lg:h-auto'
          }
        `}
      >
        {/* The mobile Figma defines the image frame itself.
            The product image fills the frame without an additional
            percentage inset, so the actual garment appears larger. */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
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

        {/* ========================================================
            DEFAULT CARD WISHLIST BADGE
        ========================================================= */}
        {!isRecommendation && (
          <button
            type="button"
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${
              product.name
            } ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            aria-disabled={isPlaceholder}
            onClick={handleToggleWishlist}
            className={`
              absolute
              left-[16px]
              top-[6px]
              flex
              h-[28px]
              w-[28px]
              items-center
              justify-center
              rounded-full
              bg-[#EFE7E7]

              md:left-5
              md:top-5
              md:h-7
              md:w-7

              ${
                isPlaceholder
                  ? 'cursor-default opacity-60'
                  : 'hover:text-[var(--maroon)]'
              }
            `}
          >
            <Heart
              size={10}
              strokeWidth={0.625}
              fill={
                inWishlist
                  ? 'currentColor'
                  : HEART_UNFILLED
              }
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
                h-[43.25px]
                w-[196px]
                gap-[3.25px]
                px-[10px]
                pt-0
                mt-[10px]
              `
              : `
                h-[61.25px]
                w-[164px]
                gap-[5.25px]
                px-[12px]
                pt-0
                mt-[17.86px]
              `
          }

          lg:mt-[1.1rem]
          lg:h-auto
          lg:w-auto
          lg:px-3
        `}
      >
        <CardLink
          {...cardLinkProps}
          className={`
            min-w-0
            flex-1
            ${
              isRecommendation
                ? 'w-[162px]'
                : 'w-[124px]'
            }
          `}
        >
          {/* Category */}
          {!isRecommendation && (
            <div
              className="
                truncate
                whitespace-nowrap
                text-[12px]
                font-normal
                leading-[18px]
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
              text-[14px]
              font-bold
              leading-[20px]
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
              text-[14px]
              font-normal
              leading-[20px]

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
          </div>
        </CardLink>

        {/* ========================================================
            ACTION ICON
        ========================================================= */}
        {isRecommendation ? (
          <button
            type="button"
            aria-label={`${inWishlist ? 'Remove' : 'Add'} ${
              product.name
            } ${inWishlist ? 'from' : 'to'} wishlist`}
            aria-pressed={inWishlist}
            aria-disabled={isPlaceholder}
            onClick={handleToggleWishlist}
            className={`
              flex
              h-[14px]
              w-[14px]
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
            <Heart
              size={14}
              strokeWidth={0.875}
              fill={
                inWishlist
                  ? 'currentColor'
                  : HEART_UNFILLED
              }
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label={`Add ${product.name} to bag`}
            aria-disabled={isPlaceholder}
            onClick={handleAddToBag}
            className={`
              flex
              h-[16px]
              w-[16px]
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
            <ShoppingBag
              size={16}
              strokeWidth={1}
              fill={inBag ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </div>
    </div>
  );
}
