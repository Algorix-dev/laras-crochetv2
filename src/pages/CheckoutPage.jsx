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
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AlertTriangle, Lock, MessageCircleQuestion, ShieldCheck, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { initializePayment } from '../api';
import { openPaystackPopup } from '../utils/paystack';
import { countries } from '../data/countries';
import { formatBusinessDays, formatDeliveryRange } from '../utils/delivery';
import Footer from '../components/Footer';
import laraCrochetLogo from '../assets/lara-crochet-logo.png';


/* TIP: Reusable input field component — renders a label + text input
   with shared styling matching the Figma's light gray borders.
   Now a controlled input (value + onChange) instead of defaultValue,
   since we need the actual values at submit time to send to the API. */
const Field = ({ label, value, onChange, ...props }) => (
  <label className="block text-base">
    {label && <span className="mb-1 block text-[var(--muted)]">{label}</span>}
    <input
      {...props}
      value={value}
      onChange={onChange}
      required={!props.optional}
      className="w-full border border-[var(--line)] bg-white px-3 py-3 text-base"
    />
  </label>
);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, removeFromBag } = useCart();
  /* TIP: `country` + `setCountry` come from the SAME currency context the
     navbar selector uses. The checkout dropdown used to be its own
     separate state, so picking "United States" here never switched the
     prices to $. Now both places share one source of truth. */
  const { formatPrice, country, setCountry } = useCurrency();
  const selectedCountry = countries.find((c) => c.code === country) || countries[0];
  const [code, setCode] = useState('');

  // TIP: one state object for every field the backend actually
  // needs (see server/routes/payments.js: customerName, customerEmail,
  // customerPhone, shippingAddress). Fields the Figma shows but the
  // backend doesn't use yet (apartment, postal code) still update
  // local state so the inputs work, they just aren't sent.
  const [form, setForm] = useState({
    email: '',
    newsletterOptIn: false,
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
  /* TIP: `base` = business days for ONE piece. The window shown to the
     customer grows with the number of pieces (see utils/delivery.js). */
  const SHIPPING_METHODS = {
    standard: { label: 'Standard Checkout', base: { min: 10, max: 14 }, price: 20440 },
    express: { label: 'Express Checkout', base: { min: 4, max: 5 }, price: 30440 },
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
    if (!cartItems.length || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { authorizationUrl, accessCode } = await initializePayment({
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email,
        customerPhone: `${selectedCountry.dial}${form.phone}`,
        // The backend looks the shipping PRICE up itself from this name
        // (server/routes/payments.js) and adds it to what Paystack charges.
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
          selectedCountry.name,
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

      /* TIP — THE PAYMENT BLOCK'S "PAY NOW": opens Paystack's secure
         window on top of this page. When it reports success we go to
         /order-confirmation?reference=…, which asks the backend to
         double-check the payment with Paystack before showing "Thank
         you". If the popup can't open (script blocked, no access code
         from an older backend) we fall back to the full-page Paystack
         checkout, so paying always still works. */
      if (!accessCode) {
        window.location.href = authorizationUrl;
        return;
      }
      try {
        await openPaystackPopup(accessCode, {
          onSuccess: (transaction) => {
            navigate(`/order-confirmation?reference=${encodeURIComponent(transaction.reference)}`);
          },
          onCancel: () => setSubmitting(false), // closed the window: let them press Pay now again
          onError: (error) => {
            setSubmitError(error?.message || 'Payment could not be completed. Please try again.');
            setSubmitting(false);
          },
        });
      } catch {
        window.location.href = authorizationUrl;
      }
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

            {/* TIP: Breadcrumb-style step indicator. Information +
                Shipping (address) + Payment are all on this one page:
                fill the form, pick a Checkout Method, then Pay now. */}
            <p className="mt-6 text-base">
              <b>Information</b>{' '}
              <span className="mx-2 text-[var(--muted)]">
                {'>'} Shipping {'>'} Payment
              </span>
            </p>

            {/* TIP: Contact section — email field and newsletter opt-in. */}
            <section className="mt-8" data-auto-rise="true">
              <h2 className="text-base font-semibold">Contact</h2>

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

              <label className="mt-3 flex gap-2 text-base">
                <input type="checkbox" className="rounded-sm" checked={form.newsletterOptIn} onChange={updateField('newsletterOptIn')} />
                Email me with news and offers
              </label>
            </section>

            {/* TIP: Shipping address section — matches the Figma exactly. */}
            <section className="mt-8" data-auto-rise="true">
              <h2 className="text-base font-semibold">Shipping Address</h2>
              <p className="mt-1 text-base text-[var(--muted)]">
                Please ensure your address is correct. We cannot change addresses after checkout.
              </p>

              <div className="mt-3 space-y-3">

                {/* TIP: Country/Region dropdown — label above value, matching Figma. */}
                <label className="block text-base">
                  <span className="mb-1 block text-[var(--muted)]">Country/Region</span>
                  <select
                    className="w-full border border-[var(--line)] p-3 text-base"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </label>

                {/* TIP: First name and last name side by side. */}
                <div className="sm:grid-cols-1 grid grid-cols-2 gap-3">
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
                <div className="sm:grid-cols-1 grid grid-cols-3 gap-3">
                  <Field placeholder="City" value={form.city} onChange={updateField('city')} />
                  <Field label="State" value={form.state} onChange={updateField('state')} />
                  <Field placeholder="Postal Code (Optional)" optional value={form.postalCode} onChange={updateField('postalCode')} />
                </div>

                {/* TIP: Phone number with Nigerian flag + country code. */}
                <div className="flex border border-[var(--line)]">
                  <span className="flex items-center gap-1.5 p-3 text-base">
                    {/* TIP: flag emojis show as plain letters ("NG") on
                        Windows, so only Nigeria gets a drawn SVG flag;
                        every other country just shows its dial code. */}
                    {selectedCountry.code === 'NG' && (
                      <svg viewBox="0 0 30 20" className="h-3.5 w-5 shrink-0" aria-hidden="true">
                        <path fill="#008751" d="M0 0h10v20H0zm20 0h10v20H20z" />
                        <path fill="#fff" d="M10 0h10v20H10z" />
                      </svg>
                    )}
                    {selectedCountry.dial}
                  </span>
                  <input
                    required
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={updateField('phone')}
                    className="min-w-0 flex-1 p-3 text-base"
                  />
                  {/* TIP: Help icon inside the phone field */}
                  <button
                    type="button"
                    aria-label="Phone help"
                    className="mr-3 self-center text-[var(--mauve-muted)]"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('lara-toast', {
                          detail: `Your number will be saved as ${selectedCountry.dial} followed by what you type.`,
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
                TIP: added from the latest Figma. The prices are repeated
                on the server (server/routes/payments.js) — that copy is
                the one Paystack actually charges.
                ================================================================ */}
            <section className="mt-8">
              <h2 className="text-base font-semibold">Checkout Method</h2>
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
                        <span className="block text-base font-semibold">{method.label}</span>
                        <span className="block text-base text-[var(--muted)]">
                          {formatBusinessDays(method.base, totalItems)} · est. {formatDeliveryRange(method.base, totalItems)}
                        </span>
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-base">{formatPrice(method.price)}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ================================================================
                PAYMENT BLOCK
                TIP: no card <input>s here on purpose. "Pay now" opens
                Paystack's secure window (card, bank transfer or USSD)
                on top of this page, so card numbers are typed into
                Paystack's window and never touch this site or our
                server. Building our own card fields would make the site
                responsible for PCI compliance.
                ================================================================ */}
            <section className="mt-8" data-auto-rise="true">
              <h2 className="text-base font-semibold">Payment</h2>
              <p className="mt-1 flex items-center gap-1.5 text-base text-[var(--muted)]">
                <Lock size={12} aria-hidden="true" />
                All transactions are secure and encrypted.
              </p>

              <div className="mt-3 border border-[var(--line)]">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-[var(--sand,#F6F1F1)] p-4">
                  <span className="flex items-center gap-3">
                    <input type="radio" name="paymentMethod" checked readOnly aria-label="Pay with Paystack" />
                    <span className="text-base font-semibold">Card, Bank Transfer or USSD</span>
                  </span>
                  <span className="flex items-center gap-1.5" aria-label="Accepted cards: Visa, Mastercard, Verve">
                    {['VISA', 'MASTERCARD', 'VERVE'].map((brand) => (
                      <span
                        key={brand}
                        className="border border-[var(--line-2)] bg-white px-1.5 py-0.5 text-base font-bold tracking-wide text-[var(--muted)]"
                      >
                        {brand}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="flex items-start gap-3 border-t border-[var(--line)] p-4 text-base leading-5 text-[var(--muted)]">
                  <ShieldCheck size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--mauve-muted)]" aria-hidden="true" />
                  <p>
                    When you press <b className="text-[var(--ink)]">Pay now</b>, a secure Paystack window opens
                    on this page where you enter your card details or choose bank transfer / USSD.
                    Your card details go straight to Paystack &mdash; we never see or store them.
                  </p>
                </div>
              </div>
            </section>

            {submitError && (
              <p role="alert" className="mt-4 text-base text-red-500">{submitError}</p>
            )}

            {/* TIP: Pay button — dark, full-width, uppercase. Disabled
                while the payment window is opening/open, and whenever
                the bag is empty, so a person can't start checkout on
                nothing. */}
            <button
              type="submit"
              disabled={submitting || !cartItems.length}
              className="mt-8 w-full bg-[#412B2D] py-4 text-base font-bold tracking-widest text-white disabled:opacity-50"
            >
              {submitting ? 'OPENING SECURE PAYMENT…' : 'PAY NOW'}
            </button>
          </form>

          {/* ================================================================
              RIGHT COLUMN — Order summary sidebar
              ================================================================ */}
          {/* TIP: sticky + self-start keeps the summary pinned while the form
              scrolls. `self-start` matters: without it the grid stretches the
              aside to the full column height and there's nothing to stick. To
              change the gap from the top of the screen, edit lg:top-6. */}
          <aside className="py-8 lg:sticky lg:top-6 lg:self-start">

            {/* TIP: Section header — "Order Summary" in bold. */}
            <h2 className="text-base font-semibold">Order Summary</h2>

            {/* TIP: Cart items list — each item shows thumbnail, name,
                variant details (color/size), quantity, and line price. */}
            <div className="mt-4 divide-y divide-[var(--line)] lg:max-h-[42vh] lg:overflow-y-auto lg:pr-1">
              {cartItems.length ? (
                cartItems.map((item) => (
                  <article key={item.id} className="flex gap-3 py-5">
                    <img
                      src={item.product.image}
                      alt=""
                      className="h-20 w-16 bg-white object-contain"
                    />
                    <div className="flex-1 text-base">
                      <b className="uppercase tracking-wide">
                        The {item.product.name}
                        {item.product.category === 'dresses' ? ' Dress' : ''}
                      </b>
                      <p className="mt-1 text-base uppercase text-[var(--mauve-muted)]">
                        {[item.selectedColor, item.selectedSize, item.selectedShade]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                      <p className="text-base uppercase text-[var(--mauve-muted)]">
                        {item.quantity} {item.quantity === 1 ? 'piece' : 'pieces'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <b className="text-base">
                        {formatPrice(item.product.price * item.quantity)}
                      </b>
                      {/* TIP: removes the whole line (all pieces of this variant). */}
                      <button
                        type="button"
                        aria-label={`Remove ${item.product.name} from order`}
                        onClick={() => removeFromBag(item.id)}
                        className="p-1 text-[var(--muted)] hover:text-[var(--ink)]"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="py-6 text-base text-[var(--muted)]">
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
                className="min-w-0 flex-1 border border-[var(--line)] p-3 text-base"
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
                className="bg-[var(--ink)] px-4 text-base uppercase text-white"
              >
                Apply
              </button>
            </div>

            {/* TIP: Price breakdown — subtotal (with item count), shipping, total. */}
            <div className="mt-6 space-y-3 border-y border-[var(--line)] py-5 text-base">
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
              <p className="flex justify-between">
                <span>Est. delivery</span>
                <span>{formatDeliveryRange(SHIPPING_METHODS[shippingMethod].base, totalItems)}</span>
              </p>
              <p className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </p>
            </div>

            {/* TIP: Tax/duties warning banner — light gray box with
                warning triangle icon, matching the Figma exactly. */}
            <div className="mt-5 flex items-start gap-2 rounded bg-[#f0ebe5] p-3 text-base text-[var(--muted)]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p>Local taxes, duties or customs clearance fees may apply</p>
            </div>

            {/* TIP: Policy notices — these match the Figma wording exactly. */}
            <div className="mt-5 space-y-3 text-base leading-6 text-[var(--muted)]">
              <p>
                Check that the item(s) in your cart are correct. Orders cannot
                be changed or cancelled once placed.
              </p>
              {cartItems.length > 0 && (
                <p>
                  Every piece is handmade, so delivery time grows with the number of
                  pieces. With {totalItems} {totalItems === 1 ? 'piece' : 'pieces'} in
                  your order, we estimate delivery between{' '}
                  <b className="text-[var(--ink)]">
                    {formatDeliveryRange(SHIPPING_METHODS[shippingMethod].base, totalItems)}
                  </b>.
                </p>
              )}
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