import Reveal from './Reveal';
import ProductCard from './ProductCard';

const GRID_COLS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
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
              w-full
              flex-nowrap
              snap-x
              snap-mandatory
              gap-[0.625rem]
              overflow-x-auto
              overflow-y-hidden
              [scrollbar-width:none]
              [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden
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
              gap-x-[0.9375rem]
              gap-y-[2.5rem]

              md:gap-x-[clamp(1rem,1.67vw,2rem)]
              md:gap-y-[clamp(2.5rem,5.21vw,6.25rem)]
            `
      }
    >
      {products.map((product, index) => (
        <Reveal
          key={product.id}
          className={
            scrollOnMobile
              ? `
                  w-[12.25rem]
                  min-w-[12.25rem]
                  shrink-0
                  snap-start

                  lg:w-auto
                  lg:min-w-0
                `
              : 'min-w-0'
          }
        >
          <ProductCard
            product={product}
            variant={cardVariant}
            isPlaceholder={isPlaceholder}
            priority={index < 3}
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
        pt-[3.0625rem]
        pb-[3.0625rem]

        md:px-8
        md:pt-0
        md:pb-24

        lg:px-[15.83%]
      "
    >
      {grid}
    </section>
  );
}
