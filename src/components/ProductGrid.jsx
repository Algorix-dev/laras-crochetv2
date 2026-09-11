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

export default function ProductGrid({ products, columns = 2, cardVariant = 'default' }) {
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
  */
  return (
    <section className="px-5 md:px-8 lg:px-[15.83%] pb-16 md:pb-24">
      <div
        className={`grid ${GRID_COLS[columns] || GRID_COLS[2]}`}
        style={{
          columnGap: "clamp(1rem, 1.67vw, 2rem)",
          rowGap: "clamp(2.5rem, 5.21vw, 6.25rem)",
        }}
      >
        {products.map((product, i) => (
          // TIP: staggering the delay by index (i * 0.08) is what
          // makes the cards feel like they're arriving one after
          // another rather than all popping in at once — a small
          // touch that reads as "designed," not just "animated."
          <Reveal key={product.id} delay={(i % 3) * 0.08}>
            <ProductCard product={product} variant={cardVariant} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}