import Reveal from './Reveal';
import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
  /*
    Figma's "Content" wrapper: 1920px frame, padding: 0 304px 77px,
    row-gap 100px, bg #FAFAFA, exactly 2 cards per row (Frame 34 is
    640px wide, 2x640 + gap ≈ the 1312px left after the 304px side
    padding).

    304/1920 = 15.83vw side padding — that ratio is right for a
    1920px desktop frame, but applied at a 390px phone width it eats
    ~62px per side and crushes each card down to ~105px wide, which
    is what was causing the category-label/bag-icon to collide. So
    side padding tapers with normal breakpoints instead (matching
    what the rest of the site's sections already do) and only
    approaches the Figma ratio at larger desktop widths.
  */
  return (
    <section className="mx-auto max-w-7xl px-5 sm:px-8 md:px-12 lg:px-20 xl:px-28 pb-16 md:pb-24">
      <div
        className="grid grid-cols-2"
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
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
