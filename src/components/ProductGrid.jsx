import Reveal from './Reveal';
import ProductCard from './ProductCard';

// This grid is shared by two different places in Figma that use
// different column counts: the homepage's "Shop Our Pieces" teaser
// (2 columns) and the full Shop page (3 columns). It used to be
// hardcoded to grid-cols-2 everywhere, which is why the Shop page
// was inheriting the homepage's column count instead of its own.
// Figma shows 2 columns starting at mobile for every variant (Shop
// Page Mobile, Wishlist mobile) — it never drops to a single column,
// so none of these should start at grid-cols-1.
const GRID_COLS = {
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export default function ProductGrid({ products, columns = 2, cardVariant = 'default', isPlaceholder = false, wrapInSection = true, scrollOnMobile = false }) {
  /*
    Figma's "Content" wrapper: 1920px frame, padding: 0 304px 77px,
    row-gap 100px, bg #FAFAFA, exactly 2 cards per row (Frame 34 is
    640px wide, 2x640 + gap ≈ the 1312px left after the 304px side
    padding).

    304/1920 = 15.83% side padding. Using the SAME
    `px-5 md:px-8 lg:px-[15.83%]` class as Navbar/Hero/Footer now
    (instead of a separate xl:px-28 taper that topped out at 112px
    and never actually reached 304px) — that class only switches to
    the 15.83% figure at the lg breakpoint (1024px+), well above
    phone widths, so there's no card-crushing risk at the sizes
    where it applies; it's what keeps this section's edges lined up
    with every other section on the page. Also dropped max-w-7xl —
    it was capping this section's own width independently of the
    rest of the page, which is exactly the kind of per-section
    override that broke the "one shared margin" look.

    TIP: wrapInSection=false skips this component's own margin
    entirely. Needed for RecommendedProducts ("Lara Thinks You'd
    Love These Too"), which already applies the page margin itself
    around both its heading AND this grid — without this flag, the
    margin was being applied twice (once here, once by the parent),
    which pushed the cards further right than the heading sitting
    right above them, and shrank the cards below Figma's actual
    313px spec since they had less real width to work with.
  */
  const grid = (
    <div
      /* TIP: scrollOnMobile turns the grid into ONE horizontally-scrolling
         row on phones/tablets (swipe sideways), and it goes back to the normal
         grid from lg up. Used by "Lara Thinks You'd Love These Too". */
      className={
        scrollOnMobile
          ? `flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid ${(GRID_COLS[columns] || GRID_COLS[2]).replace('grid-cols-2 ', '')} lg:overflow-visible`
          : `grid ${GRID_COLS[columns] || GRID_COLS[2]}`
      }
      style={{
        columnGap: "clamp(1rem, 1.67vw, 2rem)",
        rowGap: "clamp(2.5rem, 5.21vw, 6.25rem)",
      }}
    >
      {/* TIP: each card is wrapped in <Reveal>, which marks it for the
          global rise engine (utils/scrollReveal.js). Cards that come into
          view together are sorted row by row, left to right, and each one
          starts a beat after the previous - so a row of cards rises one by
          one, and it plays again every time the grid is scrolled back into
          view. The old per-index delay is gone: the engine's stagger
          already does it, and adding both made the last card wait too long. */}
      {products.map((product) => (
        <Reveal
          key={product.id}
          className={scrollOnMobile ? 'w-[62%] max-w-[260px] shrink-0 snap-start lg:w-auto lg:max-w-none' : ''}
        >
          <ProductCard product={product} variant={cardVariant} isPlaceholder={isPlaceholder} />
        </Reveal>
      ))}
    </div>
  );

  if (!wrapInSection) return grid;

  return (
    <section className="px-5 md:px-8 lg:px-[15.83%] pb-16 md:pb-24">
      {grid}
    </section>
  );
}