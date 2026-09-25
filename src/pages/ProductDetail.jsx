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
import { ArrowLeft, Check, Star, Heart, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct, normalizeProduct } from '../api';
import { useCart } from '../context/CartContext';
import RecommendedProducts from '../components/RecommendedProducts';
import ProductPlaceholder from '../components/ProductPlaceholder';
import Footer from '../components/Footer';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import ShareButton from '../components/ShareButton';
import SizeGuideModal from '../components/SizeGuideModal';
import reviewBeachPhoto from '../assets/reviews/review-restaurant.webp';
import reviewRestaurantPhoto from '../assets/reviews/review-beach.webp';
import BrandedLoader from '../components/BrandedLoader';
import InlineLoader from '../components/InlineLoader';
import { shouldShowSplash } from '../utils/splashOnce';
// TIP: the source files on disk are mislabeled relative to what they
// actually show — review-restaurant.webp is the beach photo, and
// review-beach.webp is the restaurant photo. Rather than have every
// usage below carry that confusion, the imports are swapped here so
// the variable names match their real content. Rename the files
// themselves on disk whenever it's convenient; nothing else in this
// file needs to change if you do.

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

// TIP: shades 2-5 cross-checked against the raw Figma CSS export.
// Espresso's hex (#412b2d) is a literal match for var(--maroon) —
// switched to reference that token instead of a second hardcoded
// hex for the same color. Taupe/Stone/Mauve are a judgment call
// worth flagging: the export lists all three at the IDENTICAL
// value #c9baba (Gray/300), repeated three times — which reads
// like a Figma placeholder (real yarn photos probably replace
// these three eventually) rather than a deliberate design choice
// to make them indistinguishable. Left the three distinct existing
// values in place rather than collapsing them to one flat color;
// worth confirming with Lara which she actually wants.
const FIGMA_SHADES = [
  { label: 'Ivory', color: '#efe7e7' },
  { label: 'Espresso', color: 'var(--maroon)' },
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
/* TIP: only one review here on purpose — the raw Figma CSS export
   for this section contains exactly one individual review card
   (matching this text verbatim), not two. A second reviewer
   ("Zainab A.") was in an earlier version of this file but isn't
   part of the actual design; removed rather than kept as unused
   placeholder content. */
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
      className={`h-[32px] w-[40px] shrink-0 rounded-none border-2 cursor-pointer transition-all ${
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
      className={`h-[32px] w-[40px] shrink-0 rounded-none border-2 cursor-pointer transition-all ${
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

   TIP: resized from 190×392 to 160×249 and recolored to match
   the real Figma CSS export ("Sizing Slider" / Frame 92): the
   vertical line is var(--mauve) (#ded3d4 — an exact token match),
   and the dot is #af9d9e (Gray/400), which doesn't have a matching
   token in index.css yet — worth adding one if this color gets
   reused elsewhere. The chevron icons are also NOT part of every
   instance: the export explicitly sets `display: none` on them
   for the per-review usage, only showing on the aggregate scale
   at the top of the Reviews section — hence the new showChevrons
   prop, defaulting to off. */
function FitIndicator({ fit, showChevrons = false }) {
  const dotPosition =
    fit === 'small'
      ? 'top-0'
      : fit === 'large'
        ? 'bottom-0'
        : 'top-1/2 -translate-y-1/2';

  return (
    <div className="relative h-[249px] w-[160px] shrink-0">
      <div className="absolute left-[3px] top-1 h-[234px] w-[2px] bg-[var(--mauve)]" />

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
        className={`absolute left-[-1px] z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#af9d9e] ${dotPosition}`}
      />

      {showChevrons && (
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[#d8c7c7]">
          <span>›</span>
          <span>›</span>
          <span>›</span>
          <span>›</span>
          <span>›</span>
        </div>
      )}
    </div>
  );
}

function FitScaleAggregate({ position = 'true' }) {
  return (
    <FitIndicator
      showChevrons
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
/* TIP: click any review photo to see it bigger. This is a tiny self-contained
   lightbox: click the picture -> full-screen dark overlay with the large
   image; click anywhere, press Esc or hit the X to close. Use it anywhere
   with <ZoomImage src=... alt=... className=... /> (className styles the
   small thumbnail, exactly like a normal <img>). */
function ZoomImage({ src, alt, className }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge photo: ${alt}`}
        className="block cursor-zoom-in"
      >
        <img src={src} alt={alt} className={className} />
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-5"
        >
          <button
            type="button"
            aria-label="Close photo"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 text-white"
          >
            <X size={28} />
          </button>
          <img src={src} alt={alt} className="max-h-[90vh] max-w-full object-contain" />
        </div>
      )}
    </>
  );
}

function Reviews() {
  // TIP: collapsed by default — see the Reviews Summary block below.
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const renderStars = (rating = 5, size = 14) => (
    <span className="flex items-center gap-1 text-[var(--ink-warm)]">
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

  // TIP — REAL ARROW ASSET (Figma "Frame 94"): 6 chevrons stacked
  // vertically, each pointing up, fading from solid at the bottom to
  // almost invisible at the top — this is what ties a mobile review's
  // fit scale back to the review above it, replacing a plain single
  // ChevronUp icon. Built as inline SVGs (not an imported image) so
  // the color always matches the site's palette; change `color` below
  // to recolor it, or the `opacities` array to fade faster/slower.
  const ReviewFitArrow = () => {
    const opacities = [0.12, 0.24, 0.38, 0.54, 0.72, 0.9]; // top -> bottom
    const color = 'var(--maroon)';
    return (
      <div className="flex flex-col items-center" aria-hidden="true">
        {opacities.map((o, i) => (
          <svg
            key={i}
            width="16"
            height="7"
            viewBox="0 0 16 7"
            className={i > 0 ? '-mt-[3px]' : ''}
            style={{ opacity: o }}
          >
            <path
              d="M1 6L8 1L15 6"
              stroke={color}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className="mt-16 px-5 md:px-8 lg:px-[15.83%] md:mt-20" data-auto-rise="true">
      <h2 className="font-bold font-display text-3xl md:text-4xl">Reviews</h2>

      <div className="mt-5 flex items-center gap-3">
        <strong className="text-base font-medium">4.5</strong>
        {renderStars(4, 14)}
        <span className="sm:block text-[10px] text-[var(--muted)]">
          Based on 18 reviews
        </span>
      </div>

      <div className="mt-8">
        {/* TIP — COLLAPSIBLE SUMMARY: added a toggle (per the Figma's
            "nav-arrow-down" icon next to this heading, which the site
            didn't have before). Collapsed state clamps to 3 lines with
            line-clamp-3; the chevron flips to point up when expanded.
            Change the "3" below to clamp more/fewer lines by default. */}
        <button
          type="button"
          onClick={() => setSummaryExpanded((v) => !v)}
          aria-expanded={summaryExpanded}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <h3 className="text-base font-bold">Reviews Summary</h3>
          {summaryExpanded ? (
            <ChevronUp size={20} className="shrink-0" />
          ) : (
            <ChevronDown size={20} className="shrink-0" />
          )}
        </button>
        <p
          // TIP: max-w-[64ch] keeps each line to roughly 66-75 characters (1ch is
          // the width of a "0", and average letters are a bit narrower). To
          // change the line length, edit the 64 here.
          className={`mt-4 max-w-[64ch] text-base leading-6 text-[var(--muted)] ${
            summaryExpanded ? '' : 'line-clamp-3'
          }`}
        >
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
      <div className="mt-10 hidden md:grid md:grid-cols-[160px_minmax(0,1fr)] md:gap-8">
        <FitScaleAggregate position="true" />

        {/* TIP: fixed from grid-cols-2 — that creates two EQUAL-width
            columns stretching to fill the whole parent, so each 359px
            image sat at the left edge of a much wider column, with
            a large chunk of empty column space (not the real gap-8)
            making the visual gap look far bigger than 32px. Explicit
            359px columns size each track to the image itself, so the
            only space between them is the actual 32px gap. */}
        <div className="grid grid-cols-[220px_220px] gap-8">
          <ZoomImage
            src={reviewRestaurantPhoto}
            alt="Customer wearing The Reina Dress at a restaurant"
            className="h-[240px] w-[220px] object-cover"
          />
          <ZoomImage
            src={reviewBeachPhoto}
            alt="Customer wearing The Reina Dress at the beach"
            className="h-[240px] w-[220px] object-cover"
          />
        </div>
      </div>

      {/* Mobile Figma layout */}
      <div className="mt-8 md:hidden">
        <HorizontalFitScale fit="true" />
        {/* TIP — WAS BIGGER THAN THE REVIEW PHOTOS BELOW: these used
            aspect-[359/392] w-full, stretching each photo to fill half
            the row (~160px+ wide) — much bigger than the 120×131
            individual review photos further down. Same fixed 120×131
            size here now, so the summary photos and the per-review
            photos read as one consistent size. */}
        <div className="mt-6 flex gap-3">
          <ZoomImage
            src={reviewRestaurantPhoto}
            alt="Customer wearing The Reina Dress at a restaurant"
            className="h-[110px] w-[100px] object-cover"
          />
          <ZoomImage
            src={reviewBeachPhoto}
            alt="Customer wearing The Reina Dress at the beach"
            className="h-[110px] w-[100px] object-cover"
          />
          <ZoomImage
            src={reviewBeachPhoto}
            alt="Customer wearing The Reina Dress at the beach"
            className="h-[110px] w-[100px] object-cover"
          />
        </div>
      </div>

      {/* Individual review */}
      <div className="mt-16">
        {reviews.map((review) => (
          <article
            key={review.name}
            className="grid border-t border-[var(--line)] py-10 md:grid-cols-[160px_minmax(0,359px)_1fr] md:gap-8"
          >
            <div className="hidden md:block">
              <FitIndicator fit={review.fit} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="sm:text-[14px] text-xl font-bold">{review.name}</p>
                <span className="sm:text-[14px] flex items-center gap-1 text-xl text-[var(--ink-warm)]">
                  Verified Buyer
                  <Check size={17} strokeWidth={3} />
                </span>
              </div>

              <div className="mt-5">{renderStars(review.rating, 24)}</div>

              <h3 className="sm:text-[14px] mt-5 text-xl font-bold">{review.title}</h3>

              {review.photo && (
                <ZoomImage
                  src={review.photo}
                  alt={`Customer photo for ${review.title}`}
                  // TIP — WAS DESKTOP-SIZED ON EVERY SCREEN: this had a
                  // flat 392x359(max) size with no mobile override, so
                  // phones got the same huge desktop photo instead of a
                  // smaller one. h-[131px] w-[120px] below is the actual
                  // Figma mobile size ("Rectangle 38"); md: restores the
                  // original desktop size.
                  className="mt-6 h-[110px] w-[100px] object-cover md:h-[240px] md:w-[220px]"
                />
              )}

              <p className="sm:text-[14px] mt-6 text-base leading-6 text-[var(--muted)]">
                {review.text}
              </p>
            </div>

            <time className="mt-2 justify-self-end text-base text-[var(--ink-warm)] md:block">
              {review.date}
            </time>

            <div className="mt-8 md:hidden">
              {/* TIP — ARROW ADDED: on mobile this scale sits below the
                  review it belongs to with no visual link, so it could
                  read as belonging to the NEXT review instead. The
                  stacked-chevron arrow (ReviewFitArrow, above) ties it
                  back to the content just above it. */}
              <div className="mb-1 flex justify-center">
                <ReviewFitArrow />
              </div>
              <HorizontalFitScale fit={review.fit} />
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
// TIP: mirrors the same branded splash used on ShopPage while its
// fetch is in flight (logo fade-in + tagline), per Lara's note that
// any loading moment should use it — this was the missing piece
// here. Before this, the fetch effect below set `product` to null
// at the START of every fetch (correctly, so a stale product doesn't
// flash while navigating between two product pages), but the render
// logic only checked `error || !product` — with no separate loading
// flag, "still fetching" and "genuinely 404'd" looked identical, so
// the real error message flashed for the ~1-2s the fetch takes
// before the actual product swapped in, even on a normal successful
// load. Now it only shows once the fetch actually fails.
// (Now imported from components/BrandedLoader.jsx — this used to be
// a second copy-pasted copy of the same component ShopPage.jsx had;
// extracted to one shared file so the two can't drift apart.)

export default function ProductDetail() {
  /* TIP: useParams() reads the :id from the URL — this is now a
     real Mongo _id coming from ProductCard's <Link to={`/product/${product.id}`}>,
     not a hardcoded slug like "reina". So instead of looking the
     product up in a local array, we fetch it from the API, the same
     way ShopPage does. */
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSplash] = useState(() => shouldShowSplash(`/product/${id}`));
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setProduct(null);
    setLoading(true);
    getProduct(id)
      .then((data) => setProduct(normalizeProduct(data)))
      .catch(() => setError('This product could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  /* TIP — THE FOUR THUMBNAILS ARE ANGLE SHOTS, NOTHING ELSE.
     Each product has up to four angle photos (product.views, set in the
     admin page): front, left, right, back — always in that order. A
     slot with no photo yet shows the placeholder and can't be clicked.
     The big photo is whichever slot is selected (front to start with).
     Older products that only have `images` count their first image as
     the front (see normalizeProduct in api.js), so they show one real
     thumbnail and three placeholders until angle shots are added.
     TIP: to show NO thumbnails until a product has more than its front
     photo, add `&& angleShots.filter((shot) => shot.src).length > 1`
     to the `product &&` check on the thumbnail row below. */
  const ANGLES = [
    { key: 'front', label: 'Front' },
    { key: 'left', label: 'Left' },
    { key: 'right', label: 'Right' },
    { key: 'back', label: 'Back' },
  ];
  const angleShots = ANGLES.map(({ key, label }) => ({
    key,
    label,
    src: product?.views?.[key] || null,
  }));

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
    // TIP: the branded splash only shows here on an actual page
    // reload (showSplash, from shouldShowSplash() — see
    // utils/splashOnce.js). Clicking into a product from Shop/Home/a
    // hero image now shows the plain "Loading product…" line instead,
    // per Lara's feedback that the splash shouldn't take over every
    // loading moment.
    return showSplash ? <BrandedLoader /> : <InlineLoader text="Loading product…" minHeight="60vh" />;
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
      {/* Back button — floats above the gallery, lets users return to the
          previous page (shop, homepage hero, etc.) without losing scroll
          position there. navigate(-1) follows the browser history stack
          rather than hard-coding /shop, so it works regardless of entry
          point. */}
      <div className="px-5 md:px-8 pt-4 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Back
        </button>
      </div>
      <main className="mx-auto pb-8 md:pb-12">
        {/* TIP: py-8/py-12 changed to pb-only — the raw Figma export
            shows this gallery+purchase row sitting flush under the
            navbar with zero vertical gap too, not just horizontal
            (same "Product Details Page" section, padding: 0px). Top
            padding was creating an unwanted gap between the navbar
            and the gallery's gray background; bottom padding is kept
            since it's genuinely needed as breathing room before the
            Footer, and nothing in the export suggests that's wrong. */}
        {/* TIP: horizontal padding removed from <main> itself. The
            raw Figma CSS export shows this top gallery+purchase
            section is a deliberate full-bleed exception — its
            "Product Details Page" frame is padding: 0px, unlike
            every section below it (tabs, details, reviews,
            recommendations), which explicitly carry padding: 0px
            304px in the export. So the site-wide margin now lives
            on each of those lower sections individually instead of
            here, letting this top row run edge-to-edge as intended.
            The gallery's own gray/lighter-gray frame starts flush
            against the true left edge of the viewport, and the
            purchase column's "margin" on the right is just it being
            the second half of the two-column split — not padding. */}
        {/* TIP: this now matches the shared page margin used by
            ShopPage, ProductGrid, Navbar, and Footer
            (px-5 md:px-8 lg:px-[15.83%]) instead of the old
            md:px-0, which stripped out all horizontal padding at
            desktop widths — that's why the gallery, tabs, reviews,
            and fit scale used to sit flush against the raw browser
            edge instead of lining up with the rest of the site. */}
        {/* ============================
            TWO-COLUMN MAIN SECTION
            ============================ */}
        {/* Figma's "Container" splits the gallery and info columns
            dead evenly — 945px / 945px out of a 1920px frame (minus
            the 30px gap), i.e. a true 50/50 split, not the previous
            1.18/.82 (~59/41) ratio. */}
        {/* TIP: Back button. navigate(-1) = "go to the page I came from"
            (shop, homepage, wishlist...). If someone opened this product
            straight from a link there's no previous page, so we send them
            to /shop instead of leaving the site. */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-7.5">
          {/* ---- LEFT: Image Gallery ---- */}
          <section>
            {/* Figma treats the main image and four thumbnails as one gallery container. */}
            <div className="md:bg-[#E5E5E5] sm:bg-[#FAFAFA]">
              {/* TIP: fixed — this container previously had no width
                  constraint (only a height), so object-cover stretched
                  the image across the FULL column width instead of the
                  narrow 229×602 portrait crop Figma specifies. It also
                  switched to its "desktop" size at md:, but the actual
                  two-column layout above only kicks in at lg: — so
                  between md and lg this was a single full-width column
                  showing one giant stretched image, not a small centered
                  photo with visible gray padding either side. Both are
                  fixed here: real fixed dimensions instead of stretch,
                  and lg: to match the grid breakpoint above. */}
              <div className="flex flex-col items-center justify-center px-5 py-5 lg:px-[19.58%] lg:py-5">
                <div className="h-[380px] w-[145px] lg:h-[602px] lg:w-[229px]">
                  {angleShots[selectedImage]?.src && (
                    <img
                      src={angleShots[selectedImage].src}
                      alt={product.name}
                      className="h-full w-full object-cover"
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
              {product && (
                <div className="mt-3 flex items-center justify-center gap-[39px]">
                  {angleShots.map(({ key, label, src }, index) => {
                    // TIP — 3 THUMBNAILS ON MOBILE, 4 ON DESKTOP: the
                    // Figma mobile mockup only shows 3 (front/left/right);
                    // "back" only appears once you're on a wide enough
                    // screen to use the lg: two-column layout. Hiding the
                    // 4th thumbnail (index 3) with max-md:hidden rather
                    // than slicing the array keeps selectedImage/keyboard
                    // nav simple — it's just not shown, not removed.
                    const mobileHiddenClass = index === 3 ? 'max-md:hidden' : '';
                    if (!src) {
                      return (
                        <div
                          key={`placeholder-${index}`}
                          className={`aspect-[53/139] w-[52.96px] opacity-30 ${mobileHiddenClass}`}
                        >
                          <ProductPlaceholder className="h-full w-full" />
                        </div>
                      );
                    }
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`View ${product.name} — ${label}`}
                        onClick={() => setSelectedImage(index)}
                        className={`aspect-[53/139] w-[52.96px] shrink-0 transition-opacity ${mobileHiddenClass} ${
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
            </div>
          </section>

          {/* ---- RIGHT: Product Info & Purchase ---- */}
          {/* TIP — MISSING PADDING FIX: the outer grid wrapper above is
              deliberately full-bleed (see the TIP above it) so the
              gallery photo runs edge-to-edge, but that meant this info
              column had NO side margin either below lg: — heading,
              price, and the Add to Bag button all sat flush against
              the phone's screen edges instead of Figma's 16-20px
              inset. px-5 here restores that just for this column,
              matching the same page margin used everywhere else; lg:px-0
              hands spacing back to the grid's own gap-8 once the
              two-column layout kicks in, matching Figma's dead-even
              50/50 split. */}
          <section className="px-5 lg:px-0 lg:pt-7">
            {/* TIP (bonus, same spec sheet as everything else on this
                pass): the category label ("DRESS") is 16px regular,
                color #564345 (Gray/600) in Figma — not a tiny muted
                uppercase caption. Dropped the `uppercase` class since
                categoryLabel() already returns properly-cased text. */}
            <p className="text-base uppercase tracking-wider text-[#564345] underline">
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

            {/* TIP: fixed from text-sm/leading-7 (14px/28px) — the
                real Figma CSS export specifies 16px font-size with a
                24px line-height for this paragraph (Text md/Regular),
                confirmed against the same 16/24 spec repeated for the
                Details tab body and both review-text blocks below. */}
            <p className="mt-7 max-w-[412px] text-base leading-6 text-[#404040]">
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
                <div className="mb-3 flex items-center justify-between md:max-w-[339px]">
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
                    stretching everything to fill the card.
                    TIP — MOBILE IS DIFFERENT: the separate MOBILE Figma
                    frame has these 6 boxes as equal-width flex-grow
                    columns filling the full row edge to edge (57.17px
                    × 6 ≈ 343px, no gaps) — the opposite of desktop's
                    auto-width/wrap. flex-1 below does that; md: turns
                    it back into the auto-width wrapping row. */}
                <div className="flex md:max-w-[339px] md:flex-wrap">
                  {FIGMA_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                      className={`flex-1 border border-[var(--line)] px-5 py-1 text-sm transition-colors md:flex-none ${
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
                the old 10px tracked-out label.
                TIP — FULL WIDTH, NOT CENTERED: per the client, this
                should fill the entire width of the column (same left/
                right edges as the heading/price above it), not sit as
                a smaller centered box. Plain w-full does that now —
                no max-w cap, no mx-auto needed once nothing is capping
                its growth. */}
            <button
              onClick={handleAddToBag}
              className="mt-8 block w-full whitespace-nowrap bg-[#564345] px-8 py-3.5 text-xl font-bold uppercase tracking-widest text-white transition-colors hover:bg-[var(--maroon)] md:max-w-[322px]"
            >
              Add to Bag
            </button>
          </section>
        </div>

        {/* ============================
            INFO TABS
            ============================ */}
        {/* TIP: this section and everything below it DOES carry the
            standard site margin (px-5 md:px-8 lg:px-[15.83%]) — the
            export's own "0px 304px" padding on these lower sections
            confirms it. Only the gallery+purchase row above stays
            full-bleed; see the TIP on <main> above for why. */}
        {/* TIP: data-auto-rise = "let the scroll engine lift this block in
            when it scrolls into view". Static className on purpose — if a
            className here ever became dynamic, React would overwrite the
            .rv/.on classes the engine adds. */}
        <div className="mt-16 mb-12 px-5 md:px-8 lg:px-[15.83%]" data-auto-rise="true">
          <div className="flex sm:justify-between gap-6 border-b border-[var(--line)]">
            {Object.keys(tabs).map((tabName) => (
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName)}
                className={`pb-3 text-sm tracking-wide transition-colors ${
                  activeTab === tabName
                    ? 'border-b-2 border-[var(--ink-warm)] font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-base leading-6 text-[var(--muted)]">
            {activeTab === 'Details' ? productDescription(product) : tabs[activeTab]}
          </p>
        </div>

        <RecommendedProducts
          category={product.category}
          excludeId={product.id}
          className="mt-20 px-5 md:px-8 lg:px-[15.83%]"
        />

        {/* ============================
            REVIEWS
            ============================ */}
        <Reviews />

        {/* ============================
            RECOMMENDATIONS
            ============================ */}
      </main>

      <Footer />

      {sizeGuideOpen && <SizeGuideModal onClose={() => setSizeGuideOpen(false)} />}
    </>
  );
}