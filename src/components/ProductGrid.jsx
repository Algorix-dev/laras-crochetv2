import Reveal from './Reveal';
import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-6">
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
