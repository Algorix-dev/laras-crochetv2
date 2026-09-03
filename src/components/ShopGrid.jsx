import { Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import { products } from "../data/products";

/*
  Matches the "SHOP OUR PIECES" section from the full landing-page
  wireframe: a simple responsive grid, each card = photo, wishlist
  heart top-left, a small bag icon top-right, name + price below.
  Reuses the same cropped assets/data as the Hero so you can see the
  same 7 pieces both ways — as the big interactive picker up top,
  and as an ordinary shop grid here.
*/
export default function ShopGrid({ items = products }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  return (
    <section className="px-5 md:px-10 py-16 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-bold tracking-widest uppercase">Shop Our Pieces</h2>
        <a href="/shop" className="text-sm underline underline-offset-4">
          Go to shop
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
        {items.map((product) => (
          <div key={product.id} className="relative">
            <button
              aria-label="Toggle wishlist"
              aria-pressed={isInWishlist(product.id)}
              onClick={() => toggleWishlist(product.id)}
              className="absolute left-3 top-3 z-10 hover:text-[var(--maroon)]"
            >
              <Heart
                size={18}
                strokeWidth={1.5}
                fill={isInWishlist(product.id) ? "currentColor" : "none"}
              />
            </button>

            <button
              aria-label={`Add ${product.name} to bag`}
              className="absolute right-3 top-3 z-10 hover:text-[var(--maroon)]"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
            </button>

            <div className="bg-[var(--neutral-25,#FAFAFA)] aspect-[3/4] flex items-end justify-center overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-auto object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="uppercase tracking-wide text-[var(--ink,#404040)]">
                {product.name}
              </span>
              <span className="font-bold tracking-[-0.04em] text-[var(--ink,#404040)]">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}