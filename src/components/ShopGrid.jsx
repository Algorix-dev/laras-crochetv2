/*
  SHOP OUR PIECES — homepage teaser

  TIP: this used to be a fully separate, self-contained ProductCard
  defined right here in this file — its own HeartIcon SVG, its own
  hardcoded "REINA" / "70,000" text on every card, no onClick on the
  wishlist button, no onClick on Add to Bag, and a fixed 304px side
  padding on the grid (instead of the responsive
  `px-5 md:px-8 lg:px-[15.83%]` class every other section uses) while
  the heading row above it used a totally different `px-5`. That's
  three separate bugs from the fix list in one place:
  - "two hearts" — one heart icon, but drawn as a thin stroke-only
    path at 14px, which is what made the two lobes at the top read as
    two separate blobs once compressed. Fixed by filling it faintly
    (see ProductCard.jsx).
  - cards showing static/wrong info — every card said "REINA" because
    the name/price were literally hardcoded text, not read from data.
  - misalignment — 304px fixed padding breaks on anything narrower
    than ~1000px, and didn't match the heading row's own padding.

  Rather than patch all three individually, this now just renders the
  SAME ProductGrid + ProductCard used on the Shop page, Wishlist page,
  and Account recommendations — the one that's actually wired to
  useCart / useWishlist / useCurrency. Fixing the card once in
  ProductCard.jsx now fixes it everywhere, including here.

  NOTE: DEMO_PRODUCTS below is still static placeholder data (same 4
  images as before), not a live API fetch like ShopPage.jsx does. If
  you want this teaser to show your actual latest/featured catalog
  items instead, say so and I'll wire it to getProducts() the same
  way ShopPage does.
*/
import lagoonFront from "../assets/model-images/lagoon-front.png";
import sunsetFront from "../assets/model-images/sunset-front.png";
import rosewoodFront from "../assets/model-images/rosewood-front.png";
import palmFront from "../assets/model-images/palm-front.png";
import ProductGrid from "./ProductGrid";

const DEMO_PRODUCTS = [
  { id: "demo-lagoon", name: "Reina", price: 70000, image: lagoonFront, categoryLabel: "Two-Piece" },
  { id: "demo-sunset", name: "Reina", price: 70000, image: sunsetFront, categoryLabel: "Two-Piece" },
  { id: "demo-rosewood", name: "Reina", price: 70000, image: rosewoodFront, categoryLabel: "Two-Piece" },
  { id: "demo-palm", name: "Reina", price: 70000, image: palmFront, categoryLabel: "Two-Piece" },
];

// Same 304px shared margin as Navbar/Hero/Footer/BrandStory —
// `lg:px-[15.83%]` — so the heading row and the grid below line up
// with each other AND with every other section on the page.
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

export default function ShopGrid() {
  return (
    <section className="w-full bg-[#FAFAFA]">
      {/* Heading row */}
      <div className={`flex w-full items-end justify-between gap-[10px] pb-[60px] pt-10 ${PAGE_CONTAINER_PADDING}`}>
        <h2
          className="
            m-0
            font-['Raleway']
            text-[32px]
            font-bold
            leading-[38px]
            text-[#404040]
          "
        >
          SHOP OUR PIECES
        </h2>

        <a
          href="/shop"
          className="
            text-base
            font-normal
            leading-6
            text-[#404040]
            underline
          "
        >
          Go to shop
        </a>
      </div>

      {/* Real product grid — same component as Shop/Wishlist/Account */}
      <ProductGrid products={DEMO_PRODUCTS} columns={2} />

      {/* Section-level CTA */}
      <div
        className="
          flex
          w-full
          items-center
          justify-center
          bg-[#FAFAFA]
        "
        style={{
          paddingTop: "40px",
          paddingBottom: "140px",
        }}
      >
        <a
          href="/shop"
          className="
            flex
            h-[46px]
            w-[178px]
            items-center
            justify-center
            bg-[#412B2D]
            px-10
            text-base
            font-bold
            uppercase
            leading-6
            text-[#FFFCFC]
          "
        >
          Go to Shop
        </a>
      </div>
    </section>
  );
}