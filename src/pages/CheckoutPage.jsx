/*
  TIP: This is the Checkout Page — it matches the Figma design closely.
  Two-column layout: form on the left, order summary on the right.

  Key differences from the Bag Drawer:
  - The Bag Drawer is a slide-out panel for quick cart review
  - This page is the full checkout experience with address forms

  There is NO "Express checkout" / WhatsApp button on this page —
  that was added as an extra feature. The Figma design is clean
  with just the form fields and order summary.
*/
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AlertTriangle, MessageCircleQuestion } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { initializePayment } from '../api';
import Footer from '../components/Footer';
import laraCrochetLogo from '../assets/lara-crochet-logo.png';


/* TIP: Reusable input field component — renders a label + text input
   with shared styling matching the Figma's light gray borders.
   Now a controlled input (value + onChange) instead of defaultValue,
   since we need the actual values at submit time to send to the API. */
const Field = ({ label, value, onChange, ...props }) => (
  <label className="block text-xs">
    {label && <span className="mb-1 block text-[var(--muted)]">{label}</span>}
    <input
      {...props}
      value={value}
      onChange={onChange}
      required={!props.optional}
      className="w-full border border-[var(--line)] bg-white px-3 py-3 text-sm"
    />
  </label>
);

export default function CheckoutPage() {
  const { cartItems, cartTotal } = useCart();
  const { formatPrice } = useCurrency();
  const [code, setCode] = useState('');

  // TIP: one state object for every field the backend actually
  // needs (see server/routes/payments.js: customerName, customerEmail,
  // customerPhone, shippingAddress). Fields the Figma shows but the
  // backend doesn't use yet (apartment, postal code) still update
  // local state so the inputs work, they just aren't sent.
  const [form, setForm] = useState({
    email: '',
    newsletterOptIn: false,
    country: 'Nigeria',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: 'Lagos',
    postalCode: '',
    phone: '',
  });
  const updateField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // TIP — CHECKOUT METHOD (new, from the latest Figma): Standard vs
  // Express shipping, each with its own price. These numbers
  // (₦20,440 / ₦30,440) come straight from the Figma checkout
  // screenshot — they're notably different from the flat ₦10,000
  // shipping estimate used on the My Bag and Wishlist pages, so
  // that flat number is now just an ESTIMATE shown before checkout;
  // this is the real total once a method is picked. Worth deciding
  // with Lara which number is the actual policy and keeping both
  // pages in sync with it.
  const SHIPPING_METHODS = {
    standard: { label: 'Standard Checkout', eta: '10–14 business days', price: 20440 },
    express: { label: 'Express Checkout', eta: '4–5 business days', price: 30440 },
  };
  const [shippingMethod, setShippingMethod] = useState('standard');

  /* TIP: Shipping now comes from the selected Checkout Method above
     (₦0 if the cart is empty) instead of a flat ₦10,000. */
  const shipping = cartItems.length ? SHIPPING_METHODS[shippingMethod].price : 0;

  /* TIP: Total is subtotal + shipping. */
  const total = cartTotal + shipping;

  /* TIP: Total number of items in the cart (sum of all quantities). */
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  /* TIP: Real submit — builds the payload the backend expects and
     redirects the browser straight to Paystack's checkout page. The
     order is created as "pending" on the backend right away; it only
     flips to "paid" once /order-confirmation calls verifyPayment()
     after Paystack redirects back. */
  const submit = async (e) => {
    e.preventDefault();
    if (!cartItems.length) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { authorizationUrl } = await initializePayment({
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email,
        customerPhone: `+234${form.phone}`,
        // TIP: sending this so the backend CAN charge the right
        // shipping cost — but check server/routes/payments.js
        // actually reads it and adds SHIPPING_METHODS[shippingMethod]
        // .price to the order total. If it doesn't yet, Paystack will
        // charge whatever the backend currently hardcodes/computes,
        // which may not match what's shown on this page.
        shippingMethod,
        // TIP: server/models/Order.js stores shippingAddress as a plain
        // String field, not a nested object — so we format it into one
        // readable line here rather than sending the raw form object
        // (which Mongoose would otherwise coerce into "[object Object]").
        shippingAddress: [
          form.address,
          form.apartment,
          form.city,
          form.state,
          form.postalCode,
          form.country,
        ]
          .filter(Boolean)
          .join(', '),
        items: cartItems.map((item) => ({
          productId: item.product.id,
          color: item.selectedColor,
          size: item.selectedSize,
          quantity: item.quantity,
        })),
      });
      window.location.href = authorizationUrl;
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong starting payment. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <main className="min-h-screen">
        {/* TIP: Two-column grid — form on the left (1.1fr),
            order summary sidebar on the right (0.9fr).
            Stacks to single column on mobile. */}
        {/* Figma: form column (Frame 157) is 626px and the order-summary
            column is also 626px within the 1312px content area
            (626 + 60px gap + 626 = 1312) — an even 50/50 split, not the
            previous 1.1/.9 (~55/45) ratio.

            TIP: the columns used to add their OWN side padding
            (md:px-12 = 48px) on top of this wrapper's page margin. That
            pushed the logo and form 48px in from the page's left edge,
            pushed the order summary 48px in from the right edge, and
            squeezed each column to ~560px with a ~96px gap instead of
            Figma's 626px / 60px. Now the wrapper's margin is the ONLY
            side spacing (the same one as the navbar and footer), and the
            gap between the columns is what separates them. 60/1920 =
            3.125% of the width, clamped so it stays sensible on small
            laptops. */}
        <div className="px-5 md:px-8 lg:px-[15.83%] grid lg:grid-cols-2 lg:gap-x-[clamp(2rem,3.125vw,3.75rem)]">

          {/* ================================================================
              LEFT COLUMN — Checkout form
              ================================================================ */}
          <form onSubmit={submit} className="py-8">

            {/* TIP: Brand link back to the home/shop page. */}
            <Link to="/" aria-label="Lara's Crochet home">
              <img src={laraCrochetLogo} alt="Lara's Crochet" className="h-14 w-auto" />
            </Link>

            {/* TIP: Breadcrumb-style step indicator. This form covers
                Information + Shipping (address) in one step — Paystack
                itself handles the Payment step once we redirect there. */}
            <p className="mt-6 text-xs">
              <b>Information</b>{' '}
              <span className="mx-2 text-[var(--muted)]">
                {'>'} Shipping {'>'} Payment
              </span>
            </p>

            {/* TIP: Contact section — email field and newsletter opt-in. */}
            <section className="mt-8" data-auto-rise="true">
              <h2 className="text-sm font-semibold">Contact</h2>

              <div className="mt-3 relative">
                <Field type="email" placeholder="Email" value={form.email} onChange={updateField('email')} />
                {/* TIP: Help icon inside the email field */}
                <button
                  type="button"
                  aria-label="Email help"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mauve-muted)]"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('lara-toast', {
                        detail: 'We will send your order confirmation to this email.',
                      })
                    )
                  }
                >
                  <MessageCircleQuestion size={18} strokeWidth={1.5} />
                </button>
              </div>

              <label className="mt-3 flex gap-2 text-xs">
                <input type="checkbox" className="rounded-sm" checked={form.newsletterOptIn} onChange={updateField('newsletterOptIn')} />
                Email me with news and offers
              </label>
            </section>

            {/* TIP: Shipping address section — matches the Figma exactly. */}
            <section className="mt-8" data-auto-rise="true">
              <h2 className="text-sm font-semibold">Shipping Address</h2>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Please ensure your address is correct. We cannot change addresses after checkout.
              </p>

              <div className="mt-3 space-y-3">

                {/* TIP: Country/Region dropdown — label above value, matching Figma. */}
                <label className="block text-xs">
                  <span className="mb-1 block text-[var(--muted)]">Country/Region</span>
                  <select
                    className="w-full border border-[var(--line)] p-3 text-sm"
                    value={form.country}
                    onChange={updateField('country')}
                  >
                    <option>Nigeria</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>South Africa</option>
                  </select>
                </label>

                {/* TIP: First name and last name side by side. */}
                <div className="grid grid-cols-2 gap-3">
                  <Field placeholder="First name" value={form.firstName} onChange={updateField('firstName')} />
                  <Field placeholder="Last name" value={form.lastName} onChange={updateField('lastName')} />
                </div>

                <Field placeholder="Address" value={form.address} onChange={updateField('address')} />
                <Field
                  placeholder="Apartment, suite, etc. (optional)"
                  optional
                  value={form.apartment}
                  onChange={updateField('apartment')}
                />

                {/* TIP: City, State, and Postal Code — three columns.
                    State shows "Lagos" as default, matching the Figma. */}
                <div className="grid grid-cols-3 gap-3">
                  <Field placeholder="City" value={form.city} onChange={updateField('city')} />
                  <Field label="State" value={form.state} onChange={updateField('state')} />
                  <Field placeholder="Postal Code (Optional)" optional value={form.postalCode} onChange={updateField('postalCode')} />
                </div>

                {/* TIP: Phone number with Nigerian flag + country code. */}
                <div className="flex border border-[var(--line)]">
                  <span className="flex items-center gap-1.5 p-3 text-sm">
                    {/* Nigeria flag SVG */}
                    <svg viewBox="0 0 30 20" className="h-3.5 w-5 shrink-0" aria-hidden="true">
                      <path fill="#008751" d="M0 0h10v20H0zm20 0h10v20H20z" />
                      <path fill="#fff" d="M10 0h10v20H10z" />
                    </svg>
                    +234
                  </span>
                  <input
                    required
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={updateField('phone')}
                    className="min-w-0 flex-1 p-3 text-sm"
                  />
                  {/* TIP: Help icon inside the phone field */}
                  <button
                    type="button"
                    aria-label="Phone help"
                    className="mr-3 self-center text-[var(--mauve-muted)]"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('lara-toast', {
                          detail: 'Include your country code if different from +234.',
                        })
                      )
                    }
                  >
                    <MessageCircleQuestion size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </section>

            {/* ================================================================
                CHECKOUT METHOD — Standard vs Express shipping
                TIP: added from the latest Figma. Payment itself still
                happens on Paystack's own hosted page after this form
                submits (see the submit() function above) rather than
                raw card fields on this page — collecting card numbers
                in your own <input>s would put YOU in PCI-compliance
                scope, whereas redirecting to Paystack (or using their
                inline widget) keeps card data off your server
                entirely. Ask me if you'd rather switch to Paystack's
                inline popup so the payment step never leaves this
                page — the visual result is close to the Figma's card
                form without the compliance risk of DIY fields.
                ================================================================ */}
            <section className="mt-8">
              <h2 className="text-sm font-semibold">Checkout Method</h2>
              <div className="mt-3 divide-y divide-[var(--line)] border border-[var(--line)]">
                {Object.entries(SHIPPING_METHODS).map(([key, method]) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between gap-4 p-4 ${
                      shippingMethod === key ? 'bg-[var(--sand,#F6F1F1)]' : ''
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="shippingMethod"
                        checked={shippingMethod === key}
                        onChange={() => setShippingMethod(key)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold">{method.label}</span>
                        <span className="block text-xs text-[var(--muted)]">{method.eta}</span>
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-sm">{formatPrice(method.price)}</span>
                  </label>
                ))}
              </div>
            </section>

            {submitError && (
              <p className="mt-4 text-xs text-red-500">{submitError}</p>
            )}

            {/* TIP: Submit button — dark, full-width, uppercase.
                Disabled while the payment request is in flight, and
                whenever the bag is empty, so a person can't start
                checkout on nothing. */}
            <button
              type="submit"
              disabled={submitting || !cartItems.length}
              className="mt-8 w-full bg-[var(--ink)] py-4 text-xs font-bold tracking-widest text-white disabled:opacity-50"
            >
                {submitting ? 'REDIRECTING TO PAYMENT…' : 'CONTINUE TO PAYMENT'}
            </button>
          </form>

          {/* ================================================================
              RIGHT COLUMN — Order summary sidebar
              ================================================================ */}
          <aside className="py-8">

            {/* TIP: Section header — "Order Summary" in bold. */}
            <h2 className="text-sm font-semibold">Order Summary</h2>

            {/* TIP: Cart items list — each item shows thumbnail, name,
                variant details (color/size), quantity, and line price. */}
            <div className="mt-4 divide-y divide-[var(--line)]">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <article key={item.id} className="flex gap-3 py-5">
                    <img
                      src={item.product.image}
                      alt=""
                      className="h-20 w-16 bg-white object-contain"
                    />
                    <div className="flex-1 text-sm">
                      <b className="uppercase tracking-wide">
                        The {item.product.name}
                        {item.product.category === 'dresses' ? ' Dress' : ''}
                      </b>
                      <p className="mt-1 text-xs uppercase text-[var(--mauve-muted)]">
                        {[item.selectedColor, item.selectedSize, item.selectedShade]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                      <p className="text-xs uppercase text-[var(--mauve-muted)]">
                        {item.quantity} {item.quantity === 1 ? 'piece' : 'pieces'}
                      </p>
                    </div>
                    <b className="text-sm">
                      {formatPrice(item.product.price * item.quantity)}
                    </b>
                  </article>
                ))
              ) : (
                <p className="py-6 text-sm text-[var(--muted)]">
                  Your bag is empty.{' '}
                  <Link className="underline" to="/">
                    Shop pieces
                  </Link>
                </p>
              )}
            </div>

            {/* TIP: Discount code input — two-column row with input + Apply button. */}
            <div className="mt-4 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Gift card or discount code"
                className="min-w-0 flex-1 border border-[var(--line)] p-3 text-sm"
              />
              <button
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('lara-toast', {
                      detail: code
                        ? 'Discount codes are applied at payment.'
                        : 'Enter a discount code first.',
                    })
                  )
                }
                className="bg-[var(--ink)] px-4 text-xs uppercase text-white"
              >
                Apply
              </button>
            </div>

            {/* TIP: Price breakdown — subtotal (with item count), shipping, total. */}
            <div className="mt-6 space-y-3 border-y border-[var(--line)] py-5 text-sm">
              <p className="flex justify-between">
                <span>Subtotal · {totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                <span>{formatPrice(cartTotal)}</span>
              </p>
              <p className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  Shipping
                  <button
                    type="button"
                    aria-label="Shipping help"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('lara-toast', {
                          detail: 'Flat rate shipping within Nigeria. International rates calculated at payment.',
                        })
                      )
                    }
                  >
                    <MessageCircleQuestion size={16} strokeWidth={1.5} className="text-[var(--mauve-muted)]" />
                  </button>
                </span>
                <span>{formatPrice(shipping)}</span>
              </p>
              <p className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </p>
            </div>

            {/* TIP: Tax/duties warning banner — light gray box with
                warning triangle icon, matching the Figma exactly. */}
            <div className="mt-5 flex items-start gap-2 rounded bg-[#f0ebe5] p-3 text-xs text-[var(--muted)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>Local taxes, duties or customs clearance fees may apply</p>
            </div>

            {/* TIP: Policy notices — these match the Figma wording exactly. */}
            <div className="mt-5 space-y-3 text-xs leading-6 text-[var(--muted)]">
              <p>Limit 3 items per order.</p>
              <p>
                Check that the item(s) in your cart are correct. Orders cannot
                be changed or cancelled once placed.
              </p>
              <p>
                Please expect a processing time of 1-2 business days for orders
                placed with standard shipping.
              </p>
              <p>We appreciate your patience.</p>
            </div>
          </aside>
        </div>
      </main>

      {/* TIP: Footer — the Figma shows the footer at the bottom of the
          checkout page, so we include it here. */}
      <Footer />
    </>
  );
}