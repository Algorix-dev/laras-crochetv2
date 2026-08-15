/*
  TIP: The Bag Drawer is a slide-out panel from the right side of
  the screen — similar to how Skims or other DTC brands show their
  cart. It's controlled by the Navbar: clicking the bag icon opens
  it, clicking the backdrop or the X closes it.

  The drawer uses framer-motion's AnimatePresence to animate the
  panel sliding in/out and the backdrop fading in/out.
*/
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Heart, Minus, Plus, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';


export default function BagDrawer({ open, onClose }) {
  const {
    cartItems,
    cartCount,
    cartTotal,
    removeFromBag,
    updateQuantity,
  } = useCart();

  const { formatPrice: money } = useCurrency();
  const { toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [promoOpen, setPromoOpen] = useState(false);
  const [giftBag, setGiftBag] = useState(false);

  /* TIP: "Frequently Bought Together" — just reusing our existing
     product data. When we have real recommendations, this could
     come from a backend or a curated list. */
  const recommendations = products.slice(0, 3);

  const finalTotal = cartTotal + (giftBag ? 7400 : 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — clicking it closes the drawer */}
          <motion.button
            aria-label="Close bag"
            className="fixed inset-0 z-[60] cursor-default bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer panel — slides in from the right */}
          <motion.aside
            aria-modal="true"
            role="dialog"
            aria-labelledby="bag-title"
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[420px] flex-col bg-white shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {/* ---- Header ---- */}
            <header className="border-b border-[var(--line)] px-5 py-5">
              <div className="flex items-center justify-between">
                <h2
                  id="bag-title"
                  className="font-bold text-sm tracking-wide"
                >
                  MY BAG ({cartCount})
                </h2>
                <button aria-label="Close bag" onClick={onClose}>
                  <X size={21} />
                </button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
                Enjoy international shipping rates and pre-pay duties &amp;
                taxes at checkout.
              </p>
            </header>

            {/* ---- Scrollable Content ---- */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {!cartItems.length ? (
                /* Empty state */
                <div className="py-16 text-center">
                  <p className="font-display text-3xl">Your bag is empty</p>
                  <Link
                    to="/"
                    onClick={onClose}
                    className="mt-5 inline-block border-b border-[var(--ink)] text-xs uppercase tracking-wider"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                /* Cart items */
                <div className="space-y-5">
                  {cartItems.map((item) => (
                    <article
                      key={item.id}
                      className="flex gap-3 border-b border-[var(--line)] pb-5"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-28 w-20 bg-[#efece6] object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <div>
                            <h3 className="text-sm uppercase tracking-wide">
                              The {item.product.name} Dress
                            </h3>
                            <p className="mt-1 text-sm">
                              {money(item.product.price)}
                            </p>
                          </div>
                          <button
                            aria-label={`Remove ${item.product.name}`}
                            onClick={() => removeFromBag(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Size: {item.selectedSize} · Color:{' '}
                          {item.selectedColor}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity selector */}
                          <div className="flex items-center border border-[var(--line)]">
                            <button
                              className="p-1.5"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-xs">
                              {item.quantity}
                            </span>
                            <button
                              className="p-1.5"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              toggleWishlist(item.product.id);
                              removeFromBag(item.id);
                            }}
                            className="text-[10px] uppercase tracking-wider underline"
                          >
                            Move to Wishlist
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* Gift bag option */}
              <label className="mt-6 flex cursor-pointer items-center gap-3 border-y border-[var(--line)] py-4 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={giftBag}
                  onChange={(e) => setGiftBag(e.target.checked)}
                  className="accent-[var(--maroon)]"
                />
                ADD GIFT BAG FOR {money(7400)}
              </label>

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
                      className="min-w-0 flex-1 border border-[var(--line)] px-3 py-2 text-sm"
                    />
                    <button className="bg-[var(--ink)] px-4 text-xs uppercase text-white">
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Frequently Bought Together */}
              <section className="pt-7">
                <h3 className="text-xs font-bold uppercase tracking-wide">
                  Frequently Bought Together
                </h3>
                <div className="mt-4 flex gap-3 overflow-x-auto">
                  {recommendations.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={onClose}
                      className="relative w-28 shrink-0"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="aspect-[3/4] w-full bg-[#efece6] object-contain"
                      />
                      <Heart size={14} className="absolute right-2 top-2" />
                      <p className="mt-2 text-[11px] uppercase">
                        {product.name}
                      </p>
                      <p className="text-[11px] text-[var(--muted)]">
                        {money(product.price)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* ---- Sticky Footer with Checkout Button ---- */}
            <footer className="border-t border-[var(--line)] bg-white px-5 py-4">
              <Link to="/checkout" onClick={onClose} className={`block w-full bg-[var(--ink)] py-4 text-center text-xs font-bold tracking-wider text-white ${!cartItems.length ? "pointer-events-none opacity-50" : ""}`}>
                {money(finalTotal)} — CHECKOUT
              </Link>
              <button
                onClick={() => {
                  onClose();
                  navigate('/bag');
                }}
                className="mt-3 w-full text-xs uppercase underline"
              >
                View Bag
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}