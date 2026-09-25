import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { getProducts, normalizeProduct } from '../api';
import ProductGrid from '../components/ProductGrid';
import InlineLoader from '../components/InlineLoader';
import Footer from '../components/Footer';
import BrandedLoader from '../components/BrandedLoader';
import { shouldShowSplash } from '../utils/splashOnce';

const formatLabel = (slug) =>
  slug
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

const PAGE_SIZE = 9;

export default function ShopPage() {
  const [showSplash] = useState(() => shouldShowSplash('/shop'));
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setError(null);
    setLoading(true);
    setVisibleCount(PAGE_SIZE);

    getProducts(activeCategory)
      .then((data) => setProducts(data.map(normalizeProduct)))
      .catch(() =>
        setError(
          'Could not load products — check your connection and try again.'
        )
      )
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return products;

    return products.filter((p) =>
      p.name?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <>
      <section className="bg-[#FAFAFA] pt-0 md:pt-10">
        {/* =========================================================
            MOBILE SHOP HEADER
            Figma: 375px frame / 16px horizontal padding
        ========================================================== */}
        <div className="px-4 md:px-8 lg:px-[15.83%]">

          {/* Header / intro */}
          <div className="flex flex-col gap-5 pt-5 md:flex-row md:items-start md:justify-between md:gap-4 md:pt-0">

            {/* Title + description */}
            <div className="flex flex-col gap-8 md:gap-2">
              <div>
                <h1 className="text-[24px] font-bold leading-[32px] tracking-[-0.48px] text-[#564345] md:text-[36px] md:leading-[1.05] md:tracking-[-2%]">
                  Shop Lara's Crochet
                </h1>

                <p className="mt-0 text-[14px] leading-[20px] text-[#564345] md:mt-2 md:text-lg">
                  Shop the latest pieces and must-haves from Lara's Crochet
                </p>
              </div>

              {/* Breadcrumb */}
              <p className="md:mt-8 text-[14px] leading-[20px] text-[#564345]">
                <Link
                  to="/"
                  className="hover:text-[var(--ink)]"
                >
                  Home
                </Link>

                <span className="mx-1">/</span>

                <span>Shop</span>
              </p>
            </div>

            {/* Search */}
            <label className="relative block w-full md:w-161.5">
              <span className="sr-only">
                Search products
              </span>

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="
                  h-[44px]
                  w-full
                  rounded-[20px]
                  border
                  border-[#D4D4D4]
                  bg-[#F5F5F5]
                  py-2.5
                  pl-[48px]
                  pr-4
                  text-[16px]
                  leading-[24px]
                  text-[#404040]
                  outline-none
                  shadow-[0_0_1px_rgba(0,0,0,0.25)]
                  placeholder:text-[#737373]
                  focus-visible:border-[#412B2D]

                  md:rounded-md
                  md:border-[var(--line)]
                  md:bg-white
                  md:pl-4
                  md:shadow-none
                "
              />

              <Search
                size={20}
                strokeWidth={1.5}
                className="
                  pointer-events-none
                  absolute
                  left-[16px]
                  top-1/2
                  -translate-y-1/2
                  text-[#737373]
                  md:left-auto
                  md:right-3.5
                "
              />
            </label>
          </div>

          {/* =========================================================
              CATEGORY FILTERS

              Mobile Figma:
              343px wide
              wraps
              20px gaps
        ========================================================== */}
          <div className="mt-5 flex w-full flex-wrap gap-[20px] md:mt-6 md:gap-3">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setActiveCategory(active ? 'all' : cat)
                  }
                  className={`
                    h-[26px]
                    shrink-0
                    border
                    px-[10px]
                    py-[4px]
                    text-[12px]
                    font-normal
                    leading-[18px]
                    uppercase
                    tracking-normal
                    transition-colors

                    ${
                      active
                        ? 'border-[#412B2D] bg-[#412B2D] text-[#FFFCFC]'
                        : 'border-[#D4D4D4] bg-transparent text-[#404040]'
                    }

                    md:h-auto
                    md:px-4
                    md:py-2
                    md:text-xs
                    md:font-semibold
                    md:tracking-wide
                  `}
                >
                  {formatLabel(cat)}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================
            PRODUCTS
        ========================================================== */}
        {loading ? (
          showSplash ? (
            <BrandedLoader />
          ) : (
            <InlineLoader text="Loading products…" />
          )
        ) : error ? (
          <p className="px-4 py-14 text-center text-sm text-[var(--muted)] md:px-8 lg:px-[15.83%]">
            {error}
          </p>
        ) : (
          <>
            <ProductGrid
              products={visibleProducts}
              columns={3}
            />

            {hasMore && (
              <div className="flex justify-center px-4 py-10 md:py-14">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((n) => n + PAGE_SIZE)
                  }
                  className="
                    h-[42px]
                    w-full
                    bg-[#412B2D]
                    px-8
                    text-[14px]
                    font-bold
                    leading-[20px]
                    uppercase
                    text-[#FFFCFC]
                    transition-colors
                    hover:bg-[var(--maroon)]
                    cursor-pointer

                    md:h-auto
                    md:w-auto
                    md:py-3.5
                    md:text-xs
                    md:tracking-widest
                  "
                >
                  ADD TO BAG
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </>
  );
}