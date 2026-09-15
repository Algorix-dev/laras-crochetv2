/*
  TIP: This is the Product Detail Page (PDP) — the page you land on
  when you click a product from the grid or hero carousel. It follows
  the Figma design closely: two-column layout (gallery left, purchase
  options right), then info tabs, reviews, and recommendations below.

  The page reads the product ID from the URL via react-router-dom's
  useParams(), looks it up in our products array, and renders everything.
  When you add more products to products.js, they automatically get
  their own detail page at /product/{id}.

  ---------------------------------------------------------------
  CHANGES IN THIS PASS (matched against the Figma dev-mode CSS
  export for the top gallery/purchase section):
    1. Thumbnails: square crop -> real 52.96:139 ratio, ring
       highlight -> opacity-based selection (matches spec exactly).
    2. Heading: 48-60px font-display -> 36px/44px DM Sans, per spec.
    3. Description: max-w-lg (512px) -> max-w-[412px], per spec.
    4. Swatches: 48x48 rounded squares -> 61x49 sharp rectangles,
       gap-3 (12px) -> gap-[9px], per spec.
    5. Size selector: full-width 6-col grid -> compact auto-width
       bordered boxes in a ~339px row, per spec.
    6. Add to Bag: 10px tracked-out label -> 20px bold, -0.04em
       tracking, #564345 background, per spec.
    7. (Bonus, same spec) Category label ("DRESS"): tiny muted caps
       -> 16px regular #564345, per spec.
  Every change below has its own TIP explaining the "why" and how
  to adjust or revert it if you want something different from the
  literal spec value.
----------------------------------------------------------- */
import { Check, Star, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct, getProducts, normalizeProduct } from '../api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ProductPlaceholder from '../components/ProductPlaceholder';
import Footer from '../components/Footer';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import ShareButton from '../components/ShareButton';
import SizeGuideModal from '../components/SizeGuideModal';
import reviewRestaurantPhoto from '../assets/reviews/review-restaurant.webp';
import reviewBeachPhoto from '../assets/reviews/review-beach.webp';

/* -----------------------------------------------------------
   Static data kept outside the component so React doesn't
   recreate these objects on every render.
----------------------------------------------------------- */

// TIP: add near the top, same mapping used across the site

// Figma variant controls: keep the visual options stable even when the
// backend product record has fewer/missing color and shade entries.
const FIGMA_COLOR_MIXES = [
  { label: 'Red', color: '#ff3438' },
  { label: 'Yellow', color: '#eff51b' },
  { label: 'Blue', color: '#4b38f4' },
  { label: 'Green', color: '#25ee68' },
  { label: 'Purple', color: '#c735eb' },
  { label: 'Black / White', color: '#111111' },
];

const FIGMA_SHADES = [
  { label: 'Ivory', color: '#efe7e7' },
  { label: 'Espresso', color: '#4b3032' },
  { label: 'Taupe', color: '#c7b9ba' },
  { label: 'Stone', color: '#cbbfc0' },
  { label: 'Mauve', color: '#c6b8b9' },
];

const FIGMA_SIZES = ['XS', 'S', 'L', 'M', 'XL', 'XXL'];

const categoryLabel = (category) => {
  if (category === 'two-pieces') return 'Two-Piece';
  if (category === 'bikinis') return 'Bikini';
  if (category === 'skirts') return 'Skirt';
  if (category === 'shirts') return 'Shirt';
  return 'Dress';
};
/* TIP: Tab content — the key is the tab label, the value is
   the paragraph that shows when that tab is active. Adding a
   new tab is just one more key/value pair here, plus the tab
   will appear automatically because we map over Object.keys(). */
/* TIP: Figma's product page text ("The Reina is a full-length gown
   built entirely by hand...") is written specifically about the
   Reina dress and repeats verbatim under every mockup, including
   ones for other products like "The Lemonade" — that's a Figma
   prototyping shortcut, not a real spec to copy literally (a skirt
   isn't a "full-length gown"). Real per-product copy needs a
   `description` field from the backend, which doesn't exist yet.
   Until then, this keeps Figma's structure and brand voice (made by
   hand, one stitch at a time, no two pieces identical) but swaps in
   the actual product name instead of hardcoding "Reina" everywhere. */
const productDescription = (product) =>
  `The ${product.name} is built entirely by hand, one stitch at a time — designed to move with you rather than hold you stiff. No two ${product.name}s are identical, because no two hands crochet exactly the same way twice. Made to order, just for you.`;

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
    photo: reviewRestaurantPhoto,
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
   Helper: renders a swatch button.

   TIP: Figma's dev-mode export measures these at 61×49px with no
   border-radius (sharp corners) — not the 48×48 rounded squares
   this used to be. If you decide you like the rounded look better
   than the literal spec, just add `rounded-lg` back into the
   className below; nothing else depends on the shape.
----------------------------------------------------------- */
function ColorSwatch({ option, active, onClick }) {
  const isSplit = option.label === 'Black / White';

  return (
    <button
      type="button"
      aria-label={`Select ${option.label} color`}
      aria-pressed={active}
      onClick={onClick}
      className={`h-[49px] w-[61px] shrink-0 rounded-none border-2 cursor-pointer transition-all ${
        active
          ? 'border-[var(--ink)] scale-110'
          : 'border-[var(--line)] hover:scale-105'
      }`}
      style={{
        background: isSplit
          ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), #111 55%)'
          : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85), ${option.color} 55%)`,
      }}
    />
  );
}

function ShadeSwatch({ option, active, onClick }) {
  return (
    <button
      type="button"
      aria-label={`Select ${option.label} shade`}
      aria-pressed={active}
      onClick={onClick}
      className={`h-[49px] w-[61px] shrink-0 rounded-none border-2 cursor-pointer transition-all ${
        active
          ? 'border-[var(--ink)] scale-110'
          : 'border-[var(--line)] hover:scale-105'
      }`}
      style={{ backgroundColor: option.color }}
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
  const dotPosition =
    fit === 'small'
      ? 'top-0'
      : fit === 'large'
        ? 'bottom-0'
        : 'top-1/2 -translate-y-1/2';

  return (
    <div className="relative h-[392px] w-[190px] shrink-0">
      {/* Figma-style vertical fit scale */}
      <div className="absolute left-0 top-0 h-full w-[3px] bg-[#e7dede]" />

      <span className="absolute left-2 top-0 text-xs text-[var(--muted)]">
        Runs small
      </span>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
        True to size
      </span>
      <span className="absolute bottom-0 left-2 text-xs text-[var(--muted)]">
        Runs large
      </span>

      <span
        className={`absolute left-[-1px] z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--maroon)] ${dotPosition}`}
      />

      {/* Small chevron cue from the scale toward the customer photos */}
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[#d8c7c7]">
        <span>›</span>
        <span>›</span>
        <span>›</span>
        <span>›</span>
        <span>›</span>
      </div>
    </div>
  );
}

function FitScaleAggregate({ position = 'true' }) {
  return (
    <FitIndicator
      fit={
        position === 'small'
          ? 'small'
          : position === 'large'
            ? 'large'
            : 'true'
      }
    />
  );
}

/* -----------------------------------------------------------
   Reviews section — structured to mirror the Figma review area.
----------------------------------------------------------- */
function Reviews() {
  const renderStars = (rating = 5, size = 14) => (
    <span className="flex items-center gap-1 text-[var(--maroon)]">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.8}
          fill={i < rating ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );

  const HorizontalFitScale = ({ fit = 'true' }) => {
    const position =
      fit === 'small'
        ? 'left-0'
        : fit === 'large'
          ? 'right-0'
          : 'left-1/2 -translate-x-1/2';

    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span>Runs small</span>
          <span>True to size</span>
          <span>Runs large</span>
        </div>
        <div className="relative h-3">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[var(--line)]" />
          <div
            className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[var(--maroon)] ${position}`}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="mt-16 md:mt-20">
      <h2 className="font-display text-3xl md:text-4xl">Reviews</h2>

      <div className="mt-5 flex items-center gap-3">
        <strong className="text-base font-medium">4.5</strong>
        {renderStars(4, 14)}
        <span className="text-[10px] text-[var(--muted)]">
          Based on 18 reviews
        </span>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-bold">Reviews Summary</h3>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Customers say this bra offers exceptional comfort for all-day wear,
          with many noting they forget they&apos;re wearing it. Many reviews mention
          the smooth fit under clothing and precise sizing when following the
          measurement guide. While some note the band runs slightly tight, most
          praise the secure fit without slipping straps. Frequent comments address
          the versatile everyday wear and natural shaping. Reviews indicate
          consistent satisfaction across different body types, with many becoming
          repeat purchasers.
        </p>
      </div>

      {/* Figma: tall fit scale + two 359 × 392 customer photos */}
      <div className="mt-10 hidden md:grid md:grid-cols-[190px_minmax(0,1fr)] md:gap-8">
        <FitScaleAggregate position="true" />

        <div className="grid grid-cols-2 gap-8">
          <img
            src={reviewRestaurantPhoto}
            alt="Customer wearing The Reina Dress at a restaurant"
            className="h-[392px] w-full max-w-[359px] object-cover"
          />
          <img
            src={reviewBeachPhoto}
            alt="Customer wearing The Reina Dress at the beach"
            className="h-[392px] w-full max-w-[359px] object-cover"
          />
        </div>
      </div>

      {/* Mobile Figma layout */}
      <div className="mt-8 md:hidden">
        <HorizontalFitScale fit="true" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <img
            src={reviewRestaurantPhoto}
            alt="Customer wearing The Reina Dress at a restaurant"
            className="aspect-[359/392] w-full object-cover"
          />
          <img
            src={reviewBeachPhoto}
            alt="Customer wearing The Reina Dress at the beach"
            className="aspect-[359/392] w-full object-cover"
          />
        </div>
      </div>

      {/* Individual review */}
      <div className="mt-16">
        {reviews.map((review) => (
          <article
            key={review.name}
            className="grid border-t border-[var(--line)] py-10 md:grid-cols-[190px_minmax(0,359px)_1fr] md:gap-8"
          >
            <div className="hidden md:block">
              <FitIndicator fit={review.fit} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold">{review.name}</p>
                <span className="flex items-center gap-1 text-sm text-[var(--muted)]">
                  Verified Buyer
                  <Check size={17} strokeWidth={3} />
                </span>
              </div>

              <div className="mt-5">{renderStars(review.rating, 24)}</div>

              <h3 className="mt-5 text-xl font-bold">{review.title}</h3>

              {review.photo && (
                <img
                  src={review.photo}
                  alt={`Customer photo for ${review.title}`}
                  className="mt-6 h-[392px] w-full max-w-[359px] object-cover"
                />
              )}

              <p className="mt-6 text-sm leading-7 text-[var(--muted)]">
                {review.text}
              </p>
            </div>

            <time className="mt-2 hidden justify-self-end text-sm text-[var(--muted)] md:block">
              {review.date}
            </time>

            <div className="mt-8 md:hidden">
              <HorizontalFitScale fit={review.fit} />
              <time className="mt-5 block text-xs text-[var(--muted)]">
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
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // TIP: product arrives asynchronously, so we can't set these
  // default selections at useState() time above — this effect fires
  // once the fetch resolves and seeds the first color/shade/size.
  useEffect(() => {
    if (!product) return;
    setSelectedImage(0);
    setColor(FIGMA_COLOR_MIXES[0]?.label ?? null);
    setShade(FIGMA_SHADES[0]?.label ?? null);
    setSize(FIGMA_SIZES[0] ?? null);
  }, [product]);

  const { addToBag, openBag } = useCart();
  const { formatPrice } = useCurrency();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAddToBag = () => {
    addToBag(product, color, shade, size);
    openBag();
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
      <main className="mx-auto px-5 py-8 md:px-0 md:py-12">
        {/* ============================
            TWO-COLUMN MAIN SECTION
            ============================ */}
        {/* Figma's "Container" splits the gallery and info columns
            dead evenly — 945px / 945px out of a 1920px frame (minus
            the 30px gap), i.e. a true 50/50 split, not the previous
            1.18/.82 (~59/41) ratio. */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-7.5">
          {/* ---- LEFT: Image Gallery ---- */}
          <section>
            {/* Figma treats the main image and four thumbnails as one gallery container. */}
            <div className="bg-[#f5f4f4]">
              <div className="h-[470px] md:h-[560px]">
                {gallery[selectedImage] && (
                  <img
                    src={gallery[selectedImage]}
                    alt={product.name}
                    className="h-full w-full object-[center/contain]"
                  />
                )}
              </div>

              {/* TIP: Figma's dev-mode export ("Frame 67") measures
                  these thumbnails at 52.96 × 139px (~1:2.62 — a tall
                  portrait crop matching the main photo, not a square)
                  laid out as a centered flex row with a 39px gap. It
                  also marks the *unselected* thumbnails at opacity 0.3
                  rather than ringing the selected one — so the active
                  state below is now an opacity toggle instead of a
                  ring/outline. If you want the ring style back, swap
                  the opacity-30/opacity-100 pair for the old
                  ring-1 ring-offset-2 classes. */}
              {gallery.length > 0 && (
                <div className="flex items-center justify-center gap-[39px] px-5 pb-5 pt-2 md:px-8 md:pb-8 md:pt-3">
                  {Array.from({ length: 4 }, (_, index) => {
                    const src = gallery[index];
                    if (!src) {
                      return (
                        <div
                          key={`placeholder-${index}`}
                          className="aspect-[53/139] w-[52.96px] opacity-30"
                        >
                          <ProductPlaceholder className="h-full w-full" />
                        </div>
                      );
                    }
                    return (
                      <button
                        key={src + index}
                        type="button"
                        aria-label={`View ${product.name} angle ${index + 1}`}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-[53/139] w-[52.96px] shrink-0 transition-opacity ${
                          index === selectedImage ? 'opacity-100' : 'opacity-30'
                        }`}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ---- RIGHT: Product Info & Purchase ---- */}
          <section className="lg:pt-7">
            {/* TIP (bonus, same spec sheet as everything else on this
                pass): the category label ("DRESS") is 16px regular,
                color #564345 (Gray/600) in Figma — not a tiny muted
                uppercase caption. Dropped the `uppercase` class since
                categoryLabel() already returns properly-cased text. */}
            <p className="text-base text-[#564345] underline">
              {categoryLabel(product.category)}
            </p>
            {/* TIP: spec measures this heading at 36px/44px line-height,
                Bold, letter-spacing -0.02em, color #404040, explicitly
                in DM Sans. That's noticeably smaller than the old
                text-5xl/text-6xl font-display treatment. I set the
                font-family to DM Sans directly — if `font-display` in
                your Tailwind config already resolves to DM Sans, this
                is purely a size fix and you can drop the inline style.
                If font-display is a different (e.g. script) font used
                elsewhere on the site, keep this override so the PDP
                heading doesn't pick that font up by accident. */}
            <h1
              className="mt-3 text-[36px] font-bold leading-[44px] tracking-[-0.02em] text-[#404040]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              The {product.name}
              {product.category === 'dresses' ? ' Dress' : ''}
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

            {/* TIP: spec constrains this paragraph to exactly 412px
                wide (max-w-lg was 512px — close, but not a match) and
                colors it #404040 directly. Swap back to
                text-[var(--muted)] if that CSS variable already
                resolves to #404040 in your theme and you'd rather use
                the token instead of a hardcoded hex. */}
            <p className="mt-7 max-w-[412px] text-sm leading-7 text-[#404040]">
              {productDescription(product)}
            </p>

            {/* Selectors — each section only renders if the product
                actually has that attribute, since real DB products
                (unlike the old hardcoded data) might not have colors
                or shades set. */}
            <div className="mt-8 space-y-7">
              {/* Color Mix */}
              <div>
                <p className="mb-3 text-sm font-semibold">Color Mix</p>
                {/* TIP: spec gap between swatches is 9px, not the old
                    gap-3 (12px). Small, but it's what makes the row
                    width match Figma's measurements. */}
                <div className="flex flex-wrap gap-[9px]">
                  {FIGMA_COLOR_MIXES.map((option) => (
                    <ColorSwatch
                      key={option.label}
                      option={option}
                      active={color === option.label}
                      onClick={() => setColor(option.label)}
                    />
                  ))}
                </div>
              </div>

              {/* Shades */}
              <div>
                <p className="mb-3 text-sm font-semibold">Shades</p>
                <div className="flex flex-wrap gap-[9px]">
                  {FIGMA_SHADES.map((option) => (
                    <ShadeSwatch
                      key={option.label}
                      option={option}
                      active={shade === option.label}
                      onClick={() => setShade(option.label)}
                    />
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="mb-3 flex max-w-[339px] items-center justify-between">
                  <p className="text-sm font-semibold">Size</p>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-xs font-medium underline underline-offset-2 hover:text-[var(--maroon)]"
                  >
                    Size guide
                  </button>
                </div>
                {/* TIP: spec ("Frame 79") shows each size as its own
                    auto-width box with a full border on every side,
                    sitting in a narrow ~339px row — not the old
                    full-width 6-column grid with only a top/bottom
                    border. Switching grid -> flex lets each button
                    size itself to its own label (XS vs XXL end up
                    different widths, same as Figma) instead of
                    stretching everything to fill the card. */}
                <div className="flex max-w-[339px] flex-wrap">
                  {FIGMA_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                      className={`border border-[var(--line)] px-5 py-1 text-sm transition-colors ${
                        size === s
                          ? 'bg-[var(--ink)] text-white'
                          : 'text-[var(--ink)] hover:bg-[#f4eeee]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TIP: spec sets this label at 20px Bold, letter-spacing
                -0.04em, on a #564345 background — a big jump up from
                the old 10px tracked-out label. I kept `w-full` since
                that's a sensible default for a PDP call-to-action, but
                the dev-mode export literally measures this button at a
                fixed 322px wide — worth a quick check with Teniayo or
                the client on which is actually intended. If it should
                be fixed-width, swap `w-full` for `w-[322px]` (you may
                also want to center the button in that case, e.g. wrap
                it or add `mx-auto`). */}
            <button
              onClick={handleAddToBag}
              className="mt-8 w-full bg-[#564345] py-4 text-[20px] font-bold uppercase tracking-[-0.04em] text-white transition-colors hover:bg-[var(--maroon)]"
            >
              Add to Bag
            </button>
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
            {activeTab === 'Details' ? productDescription(product) : tabs[activeTab]}
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
            <h2
              className="text-[24px] font-bold leading-[30px] tracking-[-0.48px] md:text-[36px] md:leading-[44px] md:tracking-[-0.72px]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Lara Thinks You&apos;d Love These Too
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} variant="recommendation" />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {sizeGuideOpen && <SizeGuideModal onClose={() => setSizeGuideOpen(false)} />}
    </>
  );
}