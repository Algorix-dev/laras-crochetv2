import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import RecommendedProducts from '../components/RecommendedProducts';
import Footer from '../components/Footer';
import Select from '../components/Select';
import { realVariant } from '../utils/variantLabel';
import { toast } from '../utils/toast';
import { formatDeliveryRange, formatDeliveryDays, DELIVERY_WINDOWS } from '../utils/delivery';

// TIP — SIZE CHOICES IN THE BAG. A customer can change the size of a bag line with the little dropdown.
// It offers the sizes Lara enabled for that piece (product.sizes); if the piece has none saved, the
// standard set. The current size is always in the list, and the list is kept in XS-to-XXL order.
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function sizeChoices(product, current) {
  const base = product?.sizes?.length ? product.sizes : STANDARD_SIZES;
  const list = base.includes(current) ? [...base] : [current, ...base];
  const rank = (s) => {
    const i = SIZE_ORDER.indexOf(String(s).toUpperCase());
    return i === -1 ? 99 : i;
  };
  return list.filter(Boolean).sort((a, b) => rank(a) - rank(b));
}

// TIP — STYLED SIZE DROPDOWN. This uses the site's own <Select> (components/Select.jsx) instead of the
// browser's plain select, so the open list is styled like the rest of the site. The closed box is styled
// by the classes below (height, border, padding); the open list is styled inside Select.jsx.
function SizeSelect({ item, onChange, className = '' }) {
  return (
    <Select
      value={item.selectedSize || ''}
      onChange={(e) => onChange(item.id, e.target.value)}
      aria-label={`Size for ${item.product.name}`}
      className={`h-9 border border-[#DED3D4] bg-white px-2.5 text-base font-semibold text-[#564345] outline-none transition-colors hover:border-[#564345] focus-visible:border-[#564345] ${className}`}
    >
      {sizeChoices(item.product, item.selectedSize).map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  );
}

function QtyStepper({ item, updateQuantity, removeFromBag, variant }) {
  const mobile = variant === 'mobile';
  const minus = () => {
    if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
    else removeFromBag(item.id);
  };
  const side = mobile ? 'flex h-full w-10 items-center justify-center' : 'flex h-full w-6 items-center justify-center';
  return (
    <div
      className={
        mobile
          ? 'flex h-[34px] w-full items-center justify-between border border-[#DED3D4] text-base text-[#564345]'
          : 'flex h-10 w-full items-center justify-between border border-[#EFE7E7] px-2 py-[7px]'
      }
    >
      <button
        type="button"
        onClick={minus}
        className={side}
        aria-label={item.quantity > 1 ? 'Decrease quantity' : 'Remove item'}
      >
        {item.quantity > 1 ? (
          <Minus size={mobile ? 14 : 24} strokeWidth={1.5} />
        ) : (
          <Trash2 size={mobile ? 14 : 16} strokeWidth={1.5} />
        )}
      </button>
      <span className={mobile ? 'font-medium' : 'text-base'}>{item.quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(item.id, item.quantity + 1)}
        className={side}
        aria-label="Increase quantity"
      >
        <Plus size={mobile ? 14 : 24} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// TIP: client's desktop review flagged this whole page as too small
// ("16px is not that small") — every text-sm/text-[12–14px] class below
// was bumped up to text-base (16px). If a specific label still reads too
// big/cramped once you see it live, that's the class to dial back.
export default function MyBagPage() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    removeFromBag,
    updateQuantity,
    updateSize,
  } = useCart();

  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [promoOpen, setPromoOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const shipping = cartItems.length ? 10000 : 0;
  const total = cartTotal + shipping;
  // TIP — SAME OUTFIT = ONE PRODUCT ROW. Bag lines for the same piece are grouped whatever the size or
  // colour, so e.g. a Reina dress in S/Black and in M/Red shows as ONE product with both lines listed
  // under it, not as two separate products. (The cart itself still keeps one line per size + colour.)
  // To group by colour as well again, change the key to `${item.product.id}|${item.selectedColor}|${item.selectedShade}`.
  const groups = [];
  for (const item of cartItems) {
    const key = String(item.product.id);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, lines: [] };
      groups.push(group);
    }
    group.lines.push(item);
  }

  // Move = add to wishlist (only if it isn't there already), then take the whole product out of the bag.
  const moveGroupToWishlist = (group) => {
    const { product } = group.lines[0];
    if (!isInWishlist(product.id)) toggleWishlist(product.id, { silent: true });
    group.lines.forEach((line) => removeFromBag(line.id, { silent: true }));
    toast.success('Moved to wishlist', { duration: 2500 });
  };

  if (!cartItems.length) {
    return (
      <>
        <main className="min-h-screen">
          <section className="mx-auto max-w-[984px] px-4 py-16 text-center md:px-0">
            <h1 className="text-2xl font-bold uppercase tracking-wide md:text-3xl lg:text-[36px]">
              My Bag (0)
            </h1>

            <p className="mt-4 text-base text-[var(--muted)] md:text-base">
              Your bag is currently empty.
            </p>

            <Link
              to="/shop"
              className="
                mt-8
                inline-flex
                h-[42px]
                items-center
                justify-center
                bg-[var(--ink)]
                px-8
                text-base
                font-bold
                tracking-widest
                text-white
                transition-colors
                hover:bg-[var(--maroon)]
              "
            >
              CONTINUE SHOPPING
            </Link>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen">
        <section className="px-4 pt-8 pb-16 md:px-8 md:pt-10 lg:px-[15.83%]">
          {/* PAGE HEADING */}
          <h1 className="text-[24px] font-bold uppercase tracking-wide md:text-3xl lg:text-[36px]">
            My Bag ({cartCount})
          </h1>

          <p className="mt-2 mb-8 text-base text-[var(--muted)] md:mb-10 md:text-base">
            Enjoy international shipping rates and pre-pay duties & taxes at checkout.
          </p>

          {/* BREADCRUMB */}
          <p className="mb-4 text-base text-[var(--muted)] md:text-base">
            Home / Shop / Bag
          </p>

          {/* MAIN CONTENT */}
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-6">
            {/* =========================
                CART ITEMS
            ========================== */}
            <div>
              {/* DESKTOP TABLE HEADER */}
              <div className="hidden border-b border-[var(--line)] pb-4 md:grid md:grid-cols-[6rem_1fr_96px_120px_223px] md:items-center md:gap-3">
                <span className="text-[14px] text-[#564345]">Item</span>
                <span />
                <span className="text-[14px] text-[#564345]">Size</span>
                <span className="text-[14px] text-[#564345] md:pl-4">Color</span>
                <span className="text-[14px] text-[#564345]">Qty</span>
              </div>

              {/* CART LIST */}
              <div className="mt-5 space-y-0">
                {groups.map((group) => {
                  const first = group.lines[0];
                  const { product } = first;
                  return (
                  <article
                    key={group.key}
                    className="
                      grid
                      min-h-[201px]
                      grid-cols-[105px_minmax(0,1fr)]
                      gap-[14px]
                      border-b
                      border-[#D4D4D4]

                      md:min-h-0
                      md:grid-cols-[6rem_1fr_96px_120px_223px]
                      md:items-start
                      md:gap-3
                      md:py-5
                    "
                  >
                    {/* PRODUCT IMAGE */}
                    <Link
                      to={`/product/${product.id}`}
                      className="
                        flex
                        h-[200px]
                        w-[105px]
                        shrink-0
                        items-center
                        justify-center
                        bg-[#FAFAFA]
                        px-4
                        py-[5px]

                        md:h-24
                        md:w-24
                        md:bg-white
                        md:p-0
                      "
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="
                          h-[190px]
                          w-[91px]
                          object-contain

                          md:h-24
                          md:w-full
                        "
                      />
                    </Link>

                    {/* PRODUCT INFORMATION */}
                    <div className="flex min-w-0 flex-col py-1 md:py-0">
                      <p className="text-[12px] uppercase tracking-wider text-[#AF9D9E] md:text-[12px]">
                        {product.category === 'two-pieces'
                          ? 'Two-Piece'
                          : product.category === 'bikinis'
                            ? 'Bikini'
                            : product.category === 'skirts'
                              ? 'Skirt'
                              : product.category === 'shirts'
                                ? 'Shirt'
                                : 'Dress'}
                      </p>

                      <Link
                        to={`/product/${product.id}`}
                        className="mt-1 text-base font-bold uppercase tracking-wide text-[#000000] hover:underline md:text-base"
                      >
                        {product.name}
                      </Link>

                      <p className="mt-1 text-base text-[#000000] md:text-base">
                        {formatPrice(product.price)}
                      </p>

                      {/* MOBILE WISHLIST */}
                      <button
                        type="button"
                        onClick={() => moveGroupToWishlist(group)}
                        className="
                          mt-2
                          w-fit
                          text-left
                          text-base
                          font-bold
                          uppercase
                          tracking-wide
                          text-[#564345]
                          underline
                          underline-offset-2
                          md:hidden
                        "
                      >
                        Move to wishlist
                      </button>

                      {/* MOBILE: one line per size — change the size, change the quantity */}
                      <div className="mt-auto space-y-2 pt-3 md:hidden">
                        {group.lines.map((line) => (
                          <div key={line.id} className="space-y-1">
                            {(realVariant(line.selectedColor) || realVariant(line.selectedShade)) && (
                              <p className="text-base text-[#564345]">
                                {realVariant(line.selectedColor) && (
                                  <>
                                    Color{' '}
                                    <span className="font-bold text-[var(--ink)]">{realVariant(line.selectedColor)}</span>
                                  </>
                                )}
                                {realVariant(line.selectedShade) && (
                                  <>
                                    {realVariant(line.selectedColor) ? ' · Shade ' : 'Shade '}
                                    <span className="font-bold text-[var(--ink)]">{realVariant(line.selectedShade)}</span>
                                  </>
                                )}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <SizeSelect item={line} onChange={updateSize} className="w-[84px] shrink-0" />
                              <div className="min-w-0 flex-1">
                                <QtyStepper
                                  item={line}
                                  updateQuantity={updateQuantity}
                                  removeFromBag={removeFromBag}
                                  variant="mobile"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DESKTOP: size / color / quantity, one line per size under the same product */}
                    <div className="hidden md:col-span-3 md:flex md:flex-col md:gap-4">
                      {group.lines.map((line) => (
                        <div
                          key={line.id}
                          className="md:grid md:grid-cols-[96px_120px_223px] md:items-start md:gap-3"
                        >
                          <SizeSelect item={line} onChange={updateSize} className="w-[80px]" />
                          <span className="pt-2 pl-4 text-base font-semibold leading-[18px] text-[#564345]">
                            {realVariant(line.selectedColor)}
                            {realVariant(line.selectedShade) && (
                              <span className="block font-normal text-[#AF9D9E]">{realVariant(line.selectedShade)}</span>
                            )}
                          </span>
                          <QtyStepper
                            item={line}
                            updateQuantity={updateQuantity}
                            removeFromBag={removeFromBag}
                            variant="desktop"
                          />
                        </div>
                      ))}
                      <div className="md:grid md:grid-cols-[96px_120px_223px] md:gap-3">
                        <button
                          type="button"
                          onClick={() => moveGroupToWishlist(group)}
                          className="w-fit whitespace-nowrap text-left text-base font-semibold text-[#564345] underline underline-offset-2 md:col-start-3"
                        >
                          Move to wishlist
                        </button>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>

            {/* =========================
                ORDER SUMMARY
            ========================== */}
            <aside className="mt-10 lg:sticky lg:top-20 lg:mt-0 lg:self-start">
              {/* PROMO */}
              <div className="border-b border-[#EFE7E7] pb-0">
                <button
                  type="button"
                  onClick={() =>
                    setPromoOpen((open) => !open)
                  }
                  className="flex h-[28px] w-full items-center justify-between text-base font-bold text-[#564345]"
                >
                  <span>Promo Code or Gift Card?</span>

                  <ChevronDown
                    size={20}
                    className={`transition-transform ${
                      promoOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {promoOpen && (
                  <div className="flex gap-2 pb-4 pt-4">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="h-10 min-w-0 flex-1 border border-[#DED3D4] bg-white px-3 text-base outline-none"
                    />

                    <button
                      type="button"
                      className="h-10 bg-[var(--ink)] px-5 text-base font-bold text-white"
                    >
                      APPLY
                    </button>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="mt-10">
                <div className="flex h-10 items-center justify-between bg-[#EFE7E7] px-[30px] text-base text-[#564345]">
                  <span>TOTAL</span>

                  <span>{formatPrice(total)}</span>
                </div>

                {/* CHECKOUT */}
                <Link
                  to="/checkout"
                  className="
                    mt-2
                    flex
                    h-[42px]
                    w-full
                    items-center
                    justify-center
                    bg-[#412B2D]
                    text-base
                    font-bold
                    tracking-widest
                    text-[#FFFCFC]
                    transition-colors
                    hover:bg-[var(--maroon)]
                  "
                >
                  CHECKOUT
                </Link>
              </div>

              {/* TERMS */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setTermsOpen((open) => !open)
                  }
                  className="flex h-[45px] w-full items-center justify-between border-b border-[#EFE7E7] text-base font-bold text-[#564345]"
                >
                  <span>Terms & Conditions</span>

                  <ChevronDown
                    size={24}
                    className={`transition-transform ${
                      termsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {termsOpen && (
                  <div className="border-b border-[#EFE7E7] px-1 py-4 text-base leading-5 text-[#564345]">
                    Please review our terms and conditions before completing
                    your purchase.
                  </div>
                )}
              </div>

              {/* DELIVERY */}
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryOpen((open) => !open)
                  }
                  className="flex h-[45px] w-full items-center justify-between border-b border-[#EFE7E7] text-base font-bold text-[#564345]"
                >
                  <span>Delivery</span>

                  <ChevronDown
                    size={24}
                    className={`transition-transform ${
                      deliveryOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {deliveryOpen && (
                  <div className="border-b border-[#EFE7E7] px-1 py-4 text-base leading-5 text-[#564345]">
                    <p>Standard: {formatDeliveryDays(DELIVERY_WINDOWS.standard)} · est. {formatDeliveryRange(DELIVERY_WINDOWS.standard)}</p>
                    <p className="mt-2">Express: {formatDeliveryDays(DELIVERY_WINDOWS.express)} · est. {formatDeliveryRange(DELIVERY_WINDOWS.express)}</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* =========================
            RECOMMENDATIONS
        ========================== */}
        <section className="border-t border-[var(--line)] bg-[#FAFAFA] px-4 pt-20 pb-10 md:px-8 md:py-16 lg:px-[15.83%]">
          <RecommendedProducts
            excludeId={cartItems.map(
              (item) => item.product.id
            )}
            className=""
          />
        </section>
      </main>

      <Footer />
    </>
  );
}