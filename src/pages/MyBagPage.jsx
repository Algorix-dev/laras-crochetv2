/*
  TIP: This is the full-page "My Bag" page — different from the
  BagDrawer (which is a slide-out panel). This page matches the
  Figma design: two-column layout with the item table on the left
  and the order summary on the right, followed by a recommendations
  section below.

  The "View Bag" button in the BagDrawer navigates here.
*/
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { getProducts, normalizeProduct } from '../api';

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
  const [recommendations, setRecommendations] = useState([]);

  // TIP: shipping is flat ₦10,000 (same as CheckoutPage) — keep
  // these in sync, or pull them into a shared constants file later.
  const shipping = cartItems.length ? 10000 : 0;
  const total = cartTotal + shipping;

  // TIP: "Limit 3 items per order" is stated as real policy copy on
  // the Checkout page, so it's enforced here too — total quantity
  // across the whole bag, not per line item. Same sum-of-quantities
  // calc as Checkout's totalItems, kept local since CartContext
  // doesn't expose this directly.
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const atLimit = totalItems >= 3;

  // Recommendations: fetch real products from the API (like ShopPage
  // and ProductDetail do) and filter out anything already in the bag,
  // instead of reading the old hardcoded products.js array.
  useEffect(() => {
    getProducts('all')
      .then((data) => {
        const cartProductIds = new Set(cartItems.map((item) => item.product.id));
        setRecommendations(
          data.map(normalizeProduct).filter((p) => !cartProductIds.has(p.id)).slice(0, 4)
        );
      })
      .catch(() => setRecommendations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  if (!cartItems.length) {
    return (
      <>
        <main className="min-h-screen">
          <section className="mx-auto max-w-[984px] px-5 py-16 text-center md:px-0">
            <p className="mb-4 text-xs text-[var(--muted)]">
              <Link to="/" className="hover:underline">Home</Link> /{' '}
              <Link to="/shop" className="hover:underline">Shop</Link> / Bag
            </p>
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-3">
              My Bag
            </h1>
            <p className="text-sm text-[var(--muted)] mb-8">
              Your bag is empty — start shopping to add items.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-[var(--ink)] text-white text-xs uppercase tracking-widest px-8 py-3.5 hover:bg-[var(--maroon)] transition-colors font-bold"
            >
              Continue Shopping
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
        <section className="mx-auto max-w-[984px] px-5 pt-8 pb-16 md:px-0 md:pt-10">
          {/* Breadcrumb */}
          <p className="mb-4 text-xs text-[var(--muted)]">
            <Link to="/" className="hover:underline">Home</Link> /{' '}
            <Link to="/shop" className="hover:underline">Shop</Link> / Bag
          </p>

          {/* Page header */}
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-[var(--ink)] mb-1">
            My Bag ({cartCount})
          </h1>
          <p className="text-xs text-[var(--muted)] mb-10">
            Enjoy international shipping rates and pre-pay duties &amp; taxes at checkout.
          </p>

          {/* ================================================================
              Two-column layout: items table (left) + order summary (right)
              ================================================================ */}
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr] lg:gap-6">

            {/* ---- LEFT: Cart Items Table ---- */}
            <div>
              {/* Table header — hidden on mobile, visible on desktop.
                  TIP: this grid template is the source of truth for
                  the row layout below — both use the exact same
                  md:grid-cols-[...] so header and item cells actually
                  line up in the same columns, instead of the item
                  row just approximating the header's widths inside a
                  separate flex layout. */}
              <div className="hidden md:grid md:grid-cols-[1fr_68px_88px_120px] gap-3 border-b border-[var(--line)] pb-2 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                <span>Item</span>
                <span>Size</span>
                <span>Color</span>
                <span>Qty</span>
              </div>

              <div className="mt-5 space-y-0">
                {cartItems.map((item) => (
                  <article
                    key={item.id}
                    className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-[var(--line)] py-5 first:pt-0 md:grid-cols-[6rem_1fr_68px_88px_120px] md:items-center md:gap-3"
                  >
                    {/* Product image */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="row-span-2 shrink-0 md:row-span-1"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-28 w-24 bg-white object-contain md:h-24"
                      />
                    </Link>

                    {/* Product name/price column */}
                    <div className="min-w-0">
                      {/* TIP: category sits as its own muted uppercase
                          line above the bold name — Figma shows these
                          stacked, not run together on one line. */}
                      <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                        {item.product.category === 'two-pieces'
                          ? 'Two-Piece'
                          : item.product.category === 'bikinis'
                            ? 'Bikini'
                            : item.product.category === 'skirts'
                              ? 'Skirt'
                              : item.product.category === 'shirts'
                                ? 'Shirt'
                                : 'Dress'}
                      </p>
                      <Link
                        to={`/product/${item.product.id}`}
                        className="text-sm font-bold uppercase tracking-wide hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-sm">
                        {formatPrice(item.product.price)}
                      </p>

                      {/* Mobile labels — shown only on small screens,
                          since the size/color columns collapse away below md.
                          Figma has Size on its own line, then Color with
                          "Move to wishlist" inline at the end of that same
                          line — not paired with Size like the old version. */}
                      <div className="mt-2 space-y-0.5 text-xs text-[var(--muted)] md:hidden">
                        <p>
                          Size{' '}
                          <span className="font-bold text-[var(--ink)]">
                            {[item.selectedSize, item.selectedShade].filter(Boolean).join('/')}
                          </span>
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p>
                            Color <span className="font-bold text-[var(--ink)]">{item.selectedColor}</span>
                          </p>
                          <button
                            onClick={() => {
                              toggleWishlist(item.product.id);
                              removeFromBag(item.id);
                            }}
                            className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--muted)] underline"
                          >
                            Move to wishlist
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: size and color as real grid columns, aligned to the header */}
                    <span className="hidden md:block md:text-xs md:text-[var(--muted)]">
                      {item.selectedSize}
                    </span>
                    <span className="hidden md:block md:text-xs md:text-[var(--muted)]">
                      {item.selectedColor}
                    </span>

                    {/* TIP: quantity control differs by breakpoint,
                        matching the two different Figma screenshots
                        exactly — mobile (My_Bag_Page mobile shots)
                        shows a plain Minus/qty/Plus stepper with no
                        way to fully remove an item; desktop (the
                        "MY BAG (2)" table shot) replaces the minus
                        with a Trash icon that removes the line
                        outright, and never shows a minus at all.
                        Both share the same 3-item cap on the plus
                        button. This is its own grid cell (the Qty
                        column) on desktop, stacked stepper-then-link
                        exactly like the Figma table row. */}
                    <div className="col-span-2 mt-3 flex items-center gap-4 md:col-span-1 md:mt-0 md:flex-col md:items-start md:gap-2">
                      {/* Mobile stepper — Minus / qty / Plus */}
                      <div className="flex items-center border border-[var(--line)] md:hidden">
                        <button
                          className="p-2 disabled:opacity-30"
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus size={12} />
                        </button>
                        <span className="flex-1 text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          className="p-2 disabled:opacity-30"
                          aria-label="Increase quantity"
                          disabled={atLimit}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Desktop stepper — Trash / qty / Plus */}
                      <div className="hidden w-full items-center justify-between border border-[var(--line)] md:flex">
                        <button
                          className="p-2 text-[var(--muted)] hover:text-[var(--ink)]"
                          aria-label={`Remove ${item.product.name}`}
                          onClick={() => removeFromBag(item.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                        <span className="flex-1 text-center text-xs">
                          {item.quantity}
                        </span>
                        <button
                          className="p-2 disabled:opacity-30"
                          aria-label="Increase quantity"
                          disabled={atLimit}
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          toggleWishlist(item.product.id);
                          removeFromBag(item.id);
                        }}
                        className="hidden text-[10px] uppercase tracking-wider text-[var(--muted)] underline md:block"
                      >
                        Move to wishlist
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* TIP: only shows once the cap is actually hit, so it
                  doesn't clutter the page for every normal order. */}
              {atLimit && (
                <p className="mt-4 text-xs text-[var(--muted)]">
                  Limit 3 items per order.
                </p>
              )}
            </div>

            {/* ---- RIGHT: Order Summary ---- */}
            <aside className="lg:sticky lg:top-20 lg:self-start lg:pl-0">
              {/* Promo code accordion */}
              <div className="border-b border-[var(--line)]">
                <button
                  className="flex w-full items-center justify-between py-4 text-sm"
                  onClick={() => setPromoOpen(!promoOpen)}
                  aria-expanded={promoOpen}
                >
                  Promo Code or Gift Card?
                  <ChevronDown
                    size={16}
                    className={promoOpen ? 'rotate-180' : ''}
                  />
                </button>
                {promoOpen && (
                  <div className="flex gap-2 pb-4">
                    <input
                      aria-label="Promo code"
                      placeholder="Enter code"
                      className="min-w-0 flex-1 border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ink)]"
                    />
                    <button className="bg-[var(--ink)] px-4 text-xs uppercase text-white hover:bg-[var(--maroon)]">
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Total box */}
              <div className="bg-[#f0ebe5] px-5 py-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>TOTAL</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <Link
                to="/checkout"
                className="block w-full bg-[var(--ink)] py-4 text-center text-xs font-bold tracking-widest text-white hover:bg-[var(--maroon)] transition-colors"
              >
                CHECKOUT
              </Link>

              {/* Terms & Conditions accordion */}
              <div className="mt-4 border-b border-[var(--line)]">
                <button
                  className="flex w-full items-center justify-between py-4 text-sm"
                  onClick={() => setTermsOpen(!termsOpen)}
                  aria-expanded={termsOpen}
                >
                  Terms & Conditions
                  <ChevronDown
                    size={16}
                    className={termsOpen ? 'rotate-180' : ''}
                  />
                </button>
                {termsOpen && (
                  <div className="pb-4 text-xs leading-relaxed text-[var(--muted)]">
                    <p>
                      By placing an order, you agree that each item is made to
                      order and cannot be returned for change of mind. If you
                      receive a defective item, please contact us within 7 days
                      of delivery.
                    </p>
                  </div>
                )}
              </div>

              {/* Delivery accordion */}
              <div className="border-b border-[var(--line)]">
                <button
                  className="flex w-full items-center justify-between py-4 text-sm"
                  onClick={() => setDeliveryOpen(!deliveryOpen)}
                  aria-expanded={deliveryOpen}
                >
                  Delivery
                  <ChevronDown
                    size={16}
                    className={deliveryOpen ? 'rotate-180' : ''}
                  />
                </button>
                {deliveryOpen && (
                  <div className="pb-4 text-xs leading-relaxed text-[var(--muted)]">
                    <p>
                      Each piece is handmade to order from Lagos, Nigeria.
                      Production time is 2-3 weeks. Shipping within Nigeria
                      takes 3-5 business days. International shipping rates
                      vary by destination.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>

        {/* ================================================================
            Recommendations section
            ================================================================ */}
        {recommendations.length > 0 && (
          <section className="border-t border-[var(--line)] bg-[#fafafa] py-14 md:py-16">
            <div className="mx-auto w-full max-w-[984px] px-5 md:px-0">
              <h2 className="font-display text-2xl leading-tight md:text-3xl">
                Lara Thinks You'd Love These Too
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-3 md:gap-y-10">
                {recommendations.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="recommendation"
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}