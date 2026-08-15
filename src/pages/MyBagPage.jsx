/*
  TIP: This is the full-page "My Bag" page — different from the
  BagDrawer (which is a slide-out panel). This page matches the
  Figma design: two-column layout with the item table on the left
  and the order summary on the right, followed by a recommendations
  section below.

  The "View Bag" button in the BagDrawer navigates here.
*/
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Minus, Plus, Trash2, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';
import { products } from '../data/products';

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

  // TIP: shipping is flat ₦10,000 (same as CheckoutPage) — keep
  // these in sync, or pull them into a shared constants file later.
  const shipping = cartItems.length ? 10000 : 0;
  const total = cartTotal + shipping;

  // Recommendations: show products that are NOT already in the cart
  const cartProductIds = new Set(cartItems.map((item) => item.product.id));
  const recommendations = products.filter((p) => !cartProductIds.has(p.id));

  if (!cartItems.length) {
    return (
      <>
        <main className="min-h-screen">
          <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 text-center">
            <p className="mb-4 text-xs text-[var(--muted)]">
              <Link to="/" className="hover:underline">Home</Link> /{' '}
              <Link to="/shop" className="hover:underline">Shop</Link> / Bag
            </p>
            <h1 className="font-display text-3xl md:text-4xl italic mb-3">
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
        <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 pb-16">
          {/* Breadcrumb */}
          <p className="mb-4 text-xs text-[var(--muted)]">
            <Link to="/" className="hover:underline">Home</Link> /{' '}
            <Link to="/shop" className="hover:underline">Shop</Link> / Bag
          </p>

          {/* Page header */}
          <h1 className="font-display text-3xl md:text-4xl italic mb-1">
            My Bag ({cartCount})
          </h1>
          <p className="text-xs text-[var(--muted)] mb-10">
            Enjoy international shipping rates and pre-pay duties &amp; taxes at checkout.
          </p>

          {/* ================================================================
              Two-column layout: items table (left) + order summary (right)
              ================================================================ */}
          <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr]">

            {/* ---- LEFT: Cart Items Table ---- */}
            <div>
              {/* Table header — hidden on mobile, visible on desktop */}
              <div className="hidden md:grid md:grid-cols-[1fr_80px_80px_80px] gap-3 border-b border-[var(--line)] pb-2 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                <span>Item</span>
                <span>Size</span>
                <span>Color</span>
                <span>Qty</span>
              </div>

              <div className="mt-4 space-y-6">
                {cartItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 border-b border-[var(--line)] pb-6"
                  >
                    {/* Product image */}
                    <Link
                      to={`/product/${item.product.id}`}
                      className="shrink-0"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-32 w-24 bg-[#efece6] object-contain"
                      />
                    </Link>

                    {/* Product details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/product/${item.product.id}`}
                            className="text-sm uppercase tracking-wide hover:underline"
                          >
                            {item.product.category === 'two-pieces'
                              ? 'Two-Piece'
                              : item.product.category === 'bikinis'
                                ? 'Bikini'
                                : item.product.category === 'skirts'
                                  ? 'Skirt'
                                  : item.product.category === 'shirts'
                                    ? 'Shirt'
                                    : 'Dress'}{' '}
                            — {item.product.name}
                          </Link>
                          <p className="mt-1 text-sm">
                            {formatPrice(item.product.price)}
                          </p>
                        </div>
                        <button
                          aria-label={`Remove ${item.product.name}`}
                          onClick={() => removeFromBag(item.id)}
                          className="text-[var(--muted)] hover:text-[var(--ink)]"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Mobile labels — shown only on small screens */}
                      <div className="mt-2 flex gap-3 text-xs text-[var(--muted)] md:hidden">
                        <span>Size: {item.selectedSize}</span>
                        <span>Color: {item.selectedColor}</span>
                      </div>

                      {/* Desktop: size and color in table columns */}
                      <div className="hidden md:flex md:items-center md:gap-3 md:mt-2 md:text-xs md:text-[var(--muted)]">
                        <span className="w-[80px]">{item.selectedSize}</span>
                        <span className="w-[80px]">{item.selectedColor}</span>
                      </div>

                      {/* Quantity selector + move to wishlist */}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center border border-[var(--line)]">
                          <button
                            className="p-2"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-xs">
                            {item.quantity}
                          </span>
                          <button
                            className="p-2"
                            aria-label="Increase quantity"
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
                          className="text-[10px] uppercase tracking-wider text-[var(--muted)] underline"
                        >
                          Move to wishlist
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* ---- RIGHT: Order Summary ---- */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
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
                className="mt-4 block w-full bg-[var(--ink)] py-4 text-center text-xs font-bold tracking-widest text-white hover:bg-[var(--maroon)] transition-colors"
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
          <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16">
            <h2 className="font-display text-2xl md:text-3xl italic mb-8">
              Lara Thinks You'd Love These Too
            </h2>
            <ProductGrid products={recommendations} />
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}