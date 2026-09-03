/*
  STATIC REBUILD of Figma's "SHOP OUR PIECES" section (Frame 291 +
  its "Large Product cards"). No click handlers, no wishlist/cart
  state, no data fetching — just the layout, per "make it static
  like the figma, we'll do interactions later." Figma's own mockup
  hardcodes the same "REINA" / "TWO-PIECE" / "70,000" text on every
  card (it's a wireframe, not real data), so this does the same —
  swap DEMO_ITEMS for real data once that's wired up.

  Card structure follows Figma's actual layers:
    Frame 33  — white photo box, heart-favorite circle top-left
    Frame 23  — category (small, gray) + name (bold) on the left,
                price + bag icon on the right, below the photo
  Grid is 2 columns at desktop width (Figma: two 640px cards fit
  the 1312px content area), 1 column below that.
*/

import lagoonFront from "../assets/model-images/lagoon-front.png";
import sunsetFront from "../assets/model-images/sunset-front.png";
import rosewoodFront from "../assets/model-images/rosewood-front.png";
import palmFront from "../assets/model-images/palm-front.png";

const DEMO_ITEMS = [lagoonFront, sunsetFront, rosewoodFront, palmFront];

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 12.3s-5.25-3.2-5.25-7.05A3.05 3.05 0 0 1 7 3.3a3.05 3.05 0 0 1 5.25 1.95C12.25 9.1 7 12.3 7 12.3Z"
        stroke="var(--maroon-dark)"
        strokeWidth="0.875"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
      <rect x="2.5" y="6.5" width="14" height="10.5" rx="0.5" stroke="black" strokeWidth="1.18" />
      <path d="M6.5 6.5v-1a3 3 0 0 1 6 0v1" stroke="black" strokeWidth="1.18" />
    </svg>
  );
}

function ProductCard({ image }) {
  return (
    <div>
      {/* Frame 33 — photo box */}
      <div className="relative bg-white aspect-[640/731]">
        <button
          aria-label="Toggle wishlist"
          className="absolute left-[1.56vw] top-[1.56vw] max-w-[30px] max-h-[30px] min-w-[20px] min-h-[20px] w-[3vw] h-[3vw] rounded-full bg-white shadow-sm flex items-center justify-center"
        >
          <HeartIcon />
        </button>
        <img
          src={image}
          alt="Reina"
          className="absolute left-1/2 -translate-x-1/2 top-[4.3vw] max-w-none h-[90%] w-auto object-contain"
        />
      </div>

      {/* Frame 23 — category/name left, price/bag right */}
      <div className="flex items-start justify-between px-3 mt-4">
        <div>
          <p className="text-xs uppercase text-[var(--neutral-400,#737373)]">Two-Piece</p>
          <p className="text-base font-bold text-[var(--ink,#404040)]">Reina</p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-base text-[var(--ink,#404040)]">70,000</span>
          <BagIcon />
        </div>
      </div>
    </div>
  );
}

export default function ShopGrid() {
  return (
    <section className="px-[clamp(1rem,15.83vw,19rem)] py-16">
      {/* Header row — title + "Go to shop", matching the section
          right above Frame 291 in the CSS. */}
      <div className="flex items-end justify-between mb-14">
        <h2 className="font-['Raleway'] font-bold text-2xl text-[var(--neutral-600,#404040)]">
          SHOP OUR PIECES
        </h2>
        <a href="/shop" className="text-base underline text-[var(--neutral-600,#404040)]">
          Go to shop
        </a>
      </div>

      {/* Frame 291 — 2 columns at desktop, matching Figma's two
          640px cards fitting the 1312px content width. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16 md:gap-y-24">
        {DEMO_ITEMS.map((image, i) => (
          <ProductCard key={i} image={image} />
        ))}
      </div>

      {/* Frame 182 — centered button below the grid */}
      <div className="flex justify-center mt-20">
        <button className="bg-[var(--gray-700,#412B2D)] text-[var(--gray-25,#FFFCFC)] text-sm font-bold uppercase tracking-wide px-10 py-3">
          Add to Bag
        </button>
      </div>
    </section>
  );
}