/*
  TIP: This is the Product Detail Page (PDP) — the page you land on
  when you click a product from the grid or hero carousel. It follows
  the Figma design closely: two-column layout (gallery left, purchase
  options right), then info tabs, reviews, and recommendations below.

  The page reads the product ID from the URL via react-router-dom's
  useParams(), looks it up in our products array, and renders everything.
  When you add more products to products.js, they automatically get
  their own detail page at /product/{id}.
*/
import { Check, Star, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, getProducts, normalizeProduct } from '../api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import ShareButton from '../components/ShareButton';

/* -----------------------------------------------------------
   Static data kept outside the component so React doesn't
   recreate these objects on every render.
----------------------------------------------------------- */

/* TIP: Tab content — the key is the tab label, the value is
   the paragraph that shows when that tab is active. Adding a
   new tab is just one more key/value pair here, plus the tab
   will appear automatically because we map over Object.keys(). */
const tabs = {
  Details:
    'Hand-crocheted from premium yarn. Each piece is made to order from Lagos, Nigeria. Production time: 2-3 weeks. Ships within Nigeria and internationally.',
  'Fit & Fabric':
    'Hand wash cold. Lay flat to dry. Do not bleach. Store folded to maintain shape. For sizing questions, contact us.',
  Returns:
    'As each piece is made to order, we cannot accept returns for change of mind. However, if you receive a defective item, please contact us within 7 days of delivery.',
};

/* TIP: Each review includes a `fit` field — "small", "true", or "large" —
   which positions the dot on the vertical fit indicator scale.
   The `photo` field holds a customer-submitted image; leave undefined
   if the customer didn't upload one. */
const reviews = [
  {
    name: 'Oreoluwa F.',
    date: '3 months ago',
    title: 'Amazing Quality',
    text: 'The fabric was amazing. It fit my body like a glove! Best purchase ever fr!!!',
    fit: 'true',
    rating: 4,
    photo: undefined,
    variant: 'Navy mix · Size M',
  },
  {
    name: 'Zainab A.',
    date: '2 months ago',
    title: 'So thoughtfully made',
    text: 'Lara was helpful with sizing and the dress arrived exactly as I hoped. Worth the wait.',
    fit: 'true',
    rating: 5,
    photo: undefined,
    variant: 'Slate mix · Size S',
  },
];

/* -----------------------------------------------------------
   Helper: renders a square color swatch button.
   The `active` boolean adds an outline ring so the user
   knows which color is selected.
----------------------------------------------------------- */
function ColorSwatch({ value, active, onClick, label }) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 w-8 border border-white outline-offset-2 ${
        active ? 'outline outline-1 outline-[var(--ink)]' : ''
      }`}
      style={{ backgroundColor: value }}
    />
  );
}

/* -----------------------------------------------------------
   Fit Indicator — a vertical scale showing how the garment
   fits relative to its label size. The dot position tells the
   customer whether it runs small, true to size, or runs large.

   This is super useful for made-to-order pieces where sizing
   can be tricky — it gives social proof from real buyers.
----------------------------------------------------------- */
function FitIndicator({ fit }) {
  /* TIP: The dot position maps to the three fit options.
     "small" = top, "true" = middle, "large" = bottom. */
  const dotPosition = fit === 'small' ? 'top-0' : fit === 'large' ? 'bottom-0' : 'top-1/2 -translate-y-1/2';

  return (
    <div className="flex h-full items-stretch gap-2">
      {/* Vertical line with labels */}
      <div className="relative flex w-4 flex-col items-center justify-between py-1">
        <span className="text-[9px] leading-tight text-[var(--muted)]">Runs small</span>
        <span className="text-[9px] leading-tight text-[var(--muted)]">True to size</span>
        <span className="text-[9px] leading-tight text-[var(--muted)]">Runs large</span>
      </div>

      {/* The scale line with the dot marker */}
      <div className="relative h-full w-px self-stretch bg-[var(--line)]">
        <div
          className={`absolute left-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[var(--ink)] ${dotPosition}`}
        />
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   Reviews section — pulled out as its own component so the
   main ProductDetail stays readable.

   Layout matches the Figma: each review card is a three-column
   row — reviewer info + fit scale on the left, review content
   in the middle, timestamp on the right.
----------------------------------------------------------- */
function Reviews() {
  return (
    <section className="mt-20">
      <h2 className="font-display text-4xl">Reviews</h2>

      {/* Rating summary + UGC photo placeholders */}
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <strong className="text-3xl">4.5</strong>
            <span className="flex text-[var(--maroon)]">
              {/* 4 full stars + 1 half-filled star = 4.5 rating */}
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < 4 ? 'currentColor' : 'none'}
                />
              ))}
            </span>
            <span className="text-xs text-[var(--muted)]">
              Based on 10 reviews
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
            Customers love the one-of-a-kind crochet work, thoughtful fit, and
            the care that goes into every order.
          </p>
        </div>

        {/* TIP: These are placeholder boxes for real customer photos.
            When Lara sends UGC (user-generated content) photos,
            replace the divs below with <img> tags. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-square bg-[#d7d1ca] p-4 text-xs text-[var(--muted)]">
            Customer style<br />photo
          </div>
          <div className="aspect-square bg-[#b7adb1] p-4 text-xs text-white">
            Customer style<br />photo
          </div>
        </div>
      </div>

      {/* Individual review cards — three-column layout matching Figma */}
      <div className="mt-8 space-y-4">
        {reviews.map((review) => (
          <article key={review.name} className="border-b border-[var(--line)] pb-6">
            {/* Three-column layout: reviewer + fit | content | timestamp */}
            <div className="flex gap-6">
              {/* LEFT: Reviewer info + fit indicator scale */}
              <div className="flex w-24 shrink-0 flex-col gap-4">
                <div>
                  <p className="text-sm font-medium">{review.name}</p>
                  <span className="mt-1 flex items-center gap-1 text-[10px] uppercase text-[var(--muted)]">
                    <Check size={11} /> Verified Buyer
                  </span>
                </div>
                <FitIndicator fit={review.fit} />
              </div>

              {/* MIDDLE: Stars, title, photo, text */}
              <div className="min-w-0 flex-1">
                <div className="flex text-[var(--maroon)]">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill={i < (review.rating || 5) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>

                <h3 className="mt-2 text-sm font-semibold">{review.title}</h3>

                {/* TIP: Customer photo — show only if the review has one */}
                {review.photo && (
                  <img
                    src={review.photo}
                    alt={`Customer photo for ${review.title}`}
                    className="mt-3 h-40 w-32 rounded object-cover"
                  />
                )}

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {review.text}
                </p>

                <p className="mt-3 text-[11px] uppercase tracking-wide text-[var(--muted)]">
                  Purchased: {review.variant}
                </p>
              </div>

              {/* RIGHT: Timestamp */}
              <time className="shrink-0 text-xs text-[var(--muted)]">
                {review.date}
              </time>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -----------------------------------------------------------
   Main Product Detail Page component
----------------------------------------------------------- */
export default function ProductDetail() {
  /* TIP: useParams() reads the :id from the URL — this is now a
     real Mongo _id coming from ProductCard's <Link to={`/product/${product.id}`}>,
     not a hardcoded slug like "reina". So instead of looking the
     product up in a local array, we fetch it from the API, the same
     way ShopPage does. */
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProduct(null);
    getProduct(id)
      .then((data) => setProduct(normalizeProduct(data)))
      .catch(() => setError('This product could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  // TIP: once we know the product's category, fetch a few more from
  // the same category for the "Lara Thinks You'd Love These Too"
  // section, excluding the product already on the page.
  useEffect(() => {
    if (!product?.category) return;
    getProducts(product.category)
      .then((data) =>
        setRelated(
          data.map(normalizeProduct).filter((p) => p.id !== product.id).slice(0, 4)
        )
      )
      .catch(() => setRelated([]));
  }, [product?.category, product?.id]);

  /* Gallery images come straight from the product's `images` array
     (Cloudinary URLs from the backend) — no more hardcoded angles.
     Every product needs at least one image (enforced by the schema),
     so this is safe once `product` is loaded. */
  const gallery = product?.images?.length ? product.images : [];

  /* TIP: Each selector (color, shade, size) has its own state.
     When the user clicks "Add to Bag", we send all three
     selections to the cart context so we know exactly which
     variant they ordered. Initialized once the product loads —
     see the effect below. */
  const [selectedImage, setSelectedImage] = useState(0);
  const [color, setColor] = useState(null);
  const [shade, setShade] = useState(null);
  const [size, setSize] = useState(null);
  const [activeTab, setActiveTab] = useState('Details');

  // TIP: product arrives asynchronously, so we can't set these
  // default selections at useState() time above — this effect fires
  // once the fetch resolves and seeds the first color/shade/size.
  useEffect(() => {
    if (!product) return;
    setSelectedImage(0);
    setColor(product.colors?.[0] ?? null);
    setShade(product.shades?.[0] ?? null);
    setSize(product.sizes?.[0] ?? null);
  }, [product]);

  /* Toast notification — shows briefly when item is added to bag */
  const [toast, setToast] = useState(false);
  const { addToBag } = useCart();
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAddToBag = () => {
    addToBag(product, color, shade, size);
    setToast(true);
    window.setTimeout(() => setToast(false), 2500);
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-24 text-center text-sm text-[var(--muted)] md:px-8">
        Loading product...
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-24 text-center md:px-8">
        <p className="text-sm text-red-500">{error || 'Product not found.'}</p>
        <Link to="/shop" className="mt-4 inline-block text-xs uppercase tracking-wider text-[var(--maroon)]">
          ← Back to shop
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {/* Back to shop link */}
        <Link
          to="/shop"
          className="mb-6 inline-block text-xs uppercase tracking-wider text-[var(--muted)] hover:text-[var(--maroon)]"
        >
          ← Back to shop
        </Link>

        {/* ============================
            TWO-COLUMN MAIN SECTION
            ============================ */}
        <div className="grid gap-10 lg:grid-cols-[1.18fr_.82fr] lg:gap-16">
          {/* ---- LEFT: Image Gallery ---- */}
          <section>
            {/* Main image in a light gray container */}
            <div className="aspect-[4/5] bg-[#efece6]">
              {gallery[selectedImage] && (
                <img
                  src={gallery[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            {/* Thumbnail row — clicking switches the main image.
                Only renders when there's more than one shot. */}
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {gallery.map((src, index) => (
                  <button
                    key={src + index}
                    aria-label={`View ${product.name} angle ${index + 1}`}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-[#efece6] ${
                      index === selectedImage
                        ? 'ring-1 ring-[var(--ink)] ring-offset-2'
                        : ''
                    }`}
                  >
                    <img src={src} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ---- RIGHT: Product Info & Purchase ---- */}
          <section className="lg:pt-4">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] underline">
              {product.category?.replace('-', ' ')}
            </p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-none md:text-6xl">
              {product.name}
            </h1>
            <div className="mt-4 flex items-center gap-4">
              <p className="text-xl">{formatPrice(product.price)}</p>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
              >
                <Heart
                  size={18}
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                />
              </button>
              <ShareButton product={product} />
            </div>

            <p className="mt-7 max-w-lg text-sm leading-7 text-[var(--muted)]">
              At Lara&apos;s Crochet, every piece here starts as a single
              strand of yarn and a pair of hands, no factories, no shortcuts.
              Made to order, one piece at a time, out of Lagos, Nigeria.
            </p>

            {/* Selectors — each section only renders if the product
                actually has that attribute, since real DB products
                (unlike the old hardcoded data) might not have colors
                or shades set. */}
            <div className="mt-8 space-y-7">
              {/* Color Mix */}
              {product.colors?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium">Color Mix</p>
                  <div className="flex gap-3">
                    {product.colors.map((c, i) => (
                      <ColorSwatch
                        key={c}
                        value={c}
                        active={color === c}
                        onClick={() => setColor(c)}
                        label={`Select color mix ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Shades */}
              {product.shades?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium">Shades</p>
                  <div className="flex gap-3">
                    {product.shades.map((s, i) => (
                      <ColorSwatch
                        key={`${s}-${i}`}
                        value={s}
                        active={shade === s}
                        onClick={() => setShade(s)}
                        label={`Select shade ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sizing */}
              {product.sizes?.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium">Sizing</p>
                  <div className="flex gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        aria-pressed={size === s}
                        onClick={() => setSize(s)}
                        className={`rounded-sm border px-4 py-2 text-xs tracking-wide transition-colors ${
                          size === s
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                            : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add to Bag button */}
            <button
              onClick={handleAddToBag}
              className="mt-8 w-full bg-[var(--ink)] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[var(--maroon)]"
            >
              Add to Bag
            </button>

            {/* Toast confirmation */}
            {toast && (
              <p className="mt-3 text-center text-xs text-[var(--maroon)]">
                ✓ Added to bag
              </p>
            )}
          </section>
        </div>

        {/* ============================
            INFO TABS
            ============================ */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-[var(--line)]">
            {Object.keys(tabs).map((tabName) => (
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName)}
                className={`pb-3 text-sm tracking-wide transition-colors ${
                  activeTab === tabName
                    ? 'border-b-2 border-[var(--ink)] font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {tabs[activeTab]}
          </p>
        </div>

        {/* ============================
            REVIEWS
            ============================ */}
        <Reviews />

        {/* ============================
            RECOMMENDATIONS
            ============================ */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl md:text-4xl">
              Lara Thinks You&apos;d Love These Too
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}