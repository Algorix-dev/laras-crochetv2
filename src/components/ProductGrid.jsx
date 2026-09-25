import Reveal from './Reveal';
import ProductCard from './ProductCard';

const GRID_COLS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
};

export default function ProductGrid({
  products,
  columns = 2,
  cardVariant = 'default',
  isPlaceholder = false,
  wrapInSection = true,
  scrollOnMobile = false,
}) {
  const grid = (
    <div
      className={
        scrollOnMobile
          ? `
              flex
              snap-x
              snap-mandatory
              gap-[10px]
              overflow-x-auto
              pb-2

              lg:grid
              lg:gap-[clamp(1rem,1.67vw,2rem)]
              lg:overflow-visible
              ${
                (GRID_COLS[columns] || GRID_COLS[2])
                  .replace('grid-cols-2 ', '')
              }
            `
          : `
              grid
              ${GRID_COLS[columns] || GRID_COLS[2]}
              gap-x-[15px]
              gap-y-[40px]

              md:gap-x-[clamp(1rem,1.67vw,2rem)]
              md:gap-y-[clamp(2.5rem,5.21vw,6.25rem)]
            `
      }
    >
      {products.map((product) => (
        <Reveal
          key={product.id}
          className={
            scrollOnMobile
              ? `
                  w-[196px]
                  max-w-[196px]
                  shrink-0
                  snap-start

                  lg:w-auto
                  lg:max-w-none
                `
              : 'min-w-0'
          }
        >
          <ProductCard
            product={product}
            variant={cardVariant}
            isPlaceholder={isPlaceholder}
          />
        </Reveal>
      ))}
    </div>
  );

  if (!wrapInSection) {
    return grid;
  }

  return (
    <section
      className="
        px-4
        pb-[49px]
        pt-[49px]

        md:px-8
        md:pb-24
        md:pt-0

        lg:px-[15.83%]
      "
    >
      {grid}
    </section>
  );
}