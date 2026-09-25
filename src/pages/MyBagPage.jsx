import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import RecommendedProducts from '../components/RecommendedProducts';
import Footer from '../components/Footer';
import { formatDeliveryRange } from '../utils/delivery';

export default function MyBagPage() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    removeFromBag,
    updateQuantity,
  } = useCart();

  const { formatPrice } = useCurrency();
  const { toggleWishlist } = useWishlist();

  const [promoOpen, setPromoOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const shipping = cartItems.length ? 10000 : 0;
  const total = cartTotal + shipping;

  if (!cartItems.length) {
    return (
      <>
        <main className="min-h-screen">
          <section className="mx-auto max-w-[984px] px-4 py-16 text-center md:px-0">
            <h1 className="text-2xl font-bold uppercase tracking-wide md:text-3xl lg:text-[36px]">
              My Bag (0)
            </h1>

            <p className="mt-4 text-sm text-[var(--muted)] md:text-base">
              Your bag is currently empty.
            </p>

            <Link
              to="/shop"
              className="mt-8 inline-flex h-[42px] items-center justify-center bg-[var(--ink)] px-8 text-sm font-bold tracking-widest text-white transition-colors hover:bg-[var(--maroon)]"
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

          <p className="mt-2 mb-8 text-[14px] text-[var(--muted)] md:mb-10 md:text-base">
            Enjoy international shipping rates and pre-pay duties & taxes at checkout.
          </p>

          {/* BREADCRUMB */}
          <p className="mb-4 text-[14px] text-[var(--muted)] md:text-base">
            Home / Shop / Bag
          </p>

          {/* MAIN CONTENT */}
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-6">
            {/* =========================
                CART ITEMS
            ========================== */}
            <div>
              {/* DESKTOP TABLE HEADER */}
              <div className="hidden border-b border-[var(--line)] pb-4 md:grid md:grid-cols-[6rem_1fr_96px_120px_140px] md:items-center md:gap-3">
                <span className="text-sm font-bold uppercase tracking-wide">
                  Item
                </span>

                <span />

                <span className="text-sm font-bold uppercase tracking-wide">
                  Size
                </span>

                <span className="text-sm font-bold uppercase tracking-wide">
                  Color
                </span>

                <span className="text-sm font-bold uppercase tracking-wide">
                  Qty
                </span>
              </div>

              {/* CART LIST */}
              <div className="mt-5 space-y-0">
                {cartItems.map((item) => (
                  <article
                    key={item.id}
                    className="
                      grid
                      min-h-[201px]
                      grid-cols-[105px_minmax(0,1fr)]
                      gap-[14px]
                      border-b
                      border-[#D4D4D4]
                      md:min-h-0
                      md:grid-cols-[6rem_1fr_96px_120px_140px]
                      md:items-center
                      md:gap-3
                      md:py-5
                    "
                  >
                    {/* =========================
                        PRODUCT IMAGE
                    ========================== */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="
                        flex
                        h-[200px]
                        w-[105px]
                        shrink-0
                        items-center
                        justify-center
                        bg-[#FAFAFA]
                        px-4
                        py-[7px]
                        md:h-24
                        md:w-24
                        md:bg-white
                        md:p-0
                      "
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="
                          h-[186px]
                          w-[71px]
                          object-contain
                          md:h-24
                          md:w-full
                        "
                      />
                    </Link>

                    {/* =========================
                        PRODUCT INFORMATION
                    ========================== */}
                    <div className="flex min-w-0 flex-col py-1 md:py-0">
                      <p className="text-[12px] uppercase tracking-wider text-[#564345] md:text-sm">
                        category mapping
                      </p>

                      <Link
                        to={`/product/${item.product.id}`}
                        className="mt-1 text-[14px] font-bold uppercase tracking-wide hover:underline md:text-base"
                      >
                        {item.product.name}
                      </Link>

                      <p className="mt-1 text-[14px] text-[#564345] md:text-base">
                        {formatPrice(item.product.price)}
                      </p>

                      {/* MOBILE SIZE + COLOR */}
                      <div className="mt-2 space-y-1 text-[14px] text-[#564345] md:hidden">
                        <p>
                          Size{' '}
                          <span className="font-bold text-[var(--ink)]">
                            {[item.selectedSize, item.selectedShade]
                              .filter(Boolean)
                              .join('/')}
                          </span>
                        </p>

                        <p>
                          Color{' '}
                          <span className="font-bold text-[var(--ink)]">
                            {item.selectedColor}
                          </span>
                        </p>
                      </div>

                      {/* MOBILE WISHLIST */}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.product)}
                        className="mt-2 w-fit text-left text-[12px] font-bold uppercase tracking-wide text-[#564345] underline underline-offset-2 md:hidden"
                      >
                        Move to wishlist
                      </button>

                      {/* MOBILE QUANTITY */}
                      <div className="mt-auto pt-3 md:hidden">
                        <div className="flex h-[34px] w-full items-center justify-between border border-[#DED3D4] text-[14px] text-[#564345]">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1
                                );
                              } else {
                                removeFromBag(item.id);
                              }
                            }}
                            className="flex h-full w-10 items-center justify-center"
                            aria-label={
                              item.quantity > 1
                                ? 'Decrease quantity'
                                : 'Remove item'
                            }
                          >
                            {item.quantity > 1 ? (
                              <Minus size={14} strokeWidth={1.5} />
                            ) : (
                              <Trash2 size={14} strokeWidth={1.5} />
                            )}
                          </button>

                          <span className="font-medium">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1
                              )
                            }
                            className="flex h-full w-10 items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* =========================
                        DESKTOP SIZE
                    ========================== */}
                    <span className="hidden text-sm text-[#564345] md:block">
                      {item.selectedSize}
                    </span>

                    {/* =========================
                        DESKTOP COLOR
                    ========================== */}
                    <span className="hidden text-sm text-[#564345] md:block">
                      {item.selectedColor}
                    </span>

                    {/* =========================
                        DESKTOP QUANTITY
                    ========================== */}
                    <div className="hidden md:flex md:flex-col md:items-start md:gap-2">
                      <div className="flex w-full items-center justify-between border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(
                                item.id,
                                item.quantity - 1
                              );
                            } else {
                              removeFromBag(item.id);
                            }
                          }}
                          className="flex h-9 w-9 items-center justify-center"
                          aria-label={
                            item.quantity > 1
                              ? 'Decrease quantity'
                              : 'Remove item'
                          }
                        >
                          {item.quantity > 1 ? (
                            <Minus size={14} strokeWidth={1.5} />
                          ) : (
                            <Trash2 size={14} strokeWidth={1.5} />
                          )}
                        </button>

                        <span className="text-sm">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.product)}
                        className="text-sm font-bold uppercase tracking-wide text-[#564345] underline underline-offset-2"
                      >
                        Move to wishlist
                      </button>
                    </div>
                  </article>
                ))}
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
                  onClick={() => setPromoOpen((open) => !open)}
                  className="flex h-[28px] w-full items-center justify-between text-[14px] font-bold text-[#564345]"
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
                      className="h-10 min-w-0 flex-1 border border-[#DED3D4] bg-white px-3 text-sm outline-none"
                    />

                    <button
                      type="button"
                      className="h-10 bg-[var(--ink)] px-5 text-sm font-bold text-white"
                    >
                      APPLY
                    </button>
                  </div>
                )}
              </div>

              {/* TOTAL */}
              <div className="mt-10">
                <div className="flex h-10 items-center justify-between bg-[#EFE7E7] px-[30px] text-[14px] text-[#564345]">
                  <span>TOTAL</span>

                  <span>{formatPrice(total)}</span>
                </div>

                {/* CHECKOUT */}
                <Link
                  to="/checkout"
                  className="
                    mt-4
                    flex
                    h-[42px]
                    w-full
                    items-center
                    justify-center
                    bg-[#412B2D]
                    text-[14px]
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
                  onClick={() => setTermsOpen((open) => !open)}
                  className="flex h-[45px] w-full items-center justify-between border-b border-[#EFE7E7] text-[14px] font-bold text-[#564345]"
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
                  <div className="border-b border-[#EFE7E7] px-1 py-4 text-[13px] leading-5 text-[#564345]">
                    Please review our terms and conditions before completing
                    your purchase.
                  </div>
                )}
              </div>

              {/* DELIVERY */}
              <div>
                <button
                  type="button"
                  onClick={() => setDeliveryOpen((open) => !open)}
                  className="flex h-[45px] w-full items-center justify-between border-b border-[#EFE7E7] text-[14px] font-bold text-[#564345]"
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
                  <div className="border-b border-[#EFE7E7] px-1 py-4 text-[13px] leading-5 text-[#564345]">
                    {formatDeliveryRange()}
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
            excludeId={cartItems.map((item) => item.product.id)}
            className=""
          />
        </section>
      </main>

      <Footer />
    </>
  );
}