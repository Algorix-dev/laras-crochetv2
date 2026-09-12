/*
  SHOP OUR PIECES
  Figma desktop layout:

  Section:
  - 1920px frame
  - 304px left/right content padding
  - #FAFAFA background

  Product grid:
  - 2 columns
  - 640px card width
  - 5.25px horizontal gap
  - 100px row gap

  Product card:
  - 640px wide
  - 818.11px total height
  - image frame: 640px × 731px
  - image: 506.26px × 667.57px
  - image top: 31px
  - information row: 640px × 69.25px
*/

import lagoonFront from "../assets/model-images/lagoon-front.png";
import sunsetFront from "../assets/model-images/sunset-front.png";
import rosewoodFront from "../assets/model-images/rosewood-front.png";
import palmFront from "../assets/model-images/palm-front.png";

const DEMO_ITEMS = [
  lagoonFront,
  sunsetFront,
  rosewoodFront,
  palmFront,
];

function HeartIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 12.3s-5.25-3.2-5.25-7.05A3.05 3.05 0 0 1 7 3.3a3.05 3.05 0 0 1 5.25 1.95C12.25 9.1 7 12.3 7 12.3Z"
        stroke="var(--maroon-dark)"
        strokeWidth="0.875"
        fill="var(--maroon-dark)"
        fillOpacity="0.12"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="6.5"
        width="14"
        height="10.5"
        rx="0.5"
        stroke="black"
        strokeWidth="1.18"
      />
      <path
        d="M6.5 6.5v-1a3 3 0 0 1 6 0v1"
        stroke="black"
        strokeWidth="1.18"
      />
    </svg>
  );
}

function ProductCard({ image }) {
  return (
    <div className="w-full lg:w-[640px] flex-none">
      {/* Frame 33 — exact Figma image area */}
      <div
        className="relative w-full bg-white overflow-hidden"
        style={{
          aspectRatio: "640 / 731",
        }}
      >
        {/* Favorites */}
        <button
          type="button"
          aria-label="Toggle wishlist"
          className="
            absolute
            left-5
            top-5
            z-10
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            bg-[#EFE7E7]
            p-0
          "
        >
          <HeartIcon />
        </button>

        {/* Product image
            NOTE: was object-cover at 91.32% height / 4.24% top, matching
            the Figma "Rectangle 37" box exactly. That box assumed a
            source photo already cropped to the box's own ratio — the
            real photos (lagoon-front.png etc.) are tall, narrow
            full-body shots with ZERO margin above the head in the raw
            file itself (checked: hair starts ~1.9% down, basically
            touching row 0). object-cover on a wider box was scaling
            those up and cropping in, which is what pushed heads to the
            top edge. Switched to object-contain (shows the whole photo,
            no crop) and pulled the height in to 78% with more top
            offset, so there's real white space above the head. This is
            a code-side stopgap — since the source images have no
            headroom to begin with, the cleaner long-term fix is
            re-exporting the photos with headroom above the head, which
            you mentioned you're already doing. */}
        <img
          src={image}
          alt="Reina"
          className="absolute left-1/2 top-[10%] h-[78%] w-[79.1%] max-w-none -translate-x-1/2 object-contain"
        />
      </div>

      {/* Frame 23 — exact Figma information row */}
      <div
        className="
          flex
          h-[69.25px]
          w-full
          items-start
          justify-between
          px-3
          pt-0
        "
        style={{
          marginTop: "17.86px",
        }}
      >
        {/* Frame 22 */}
        <div
          className="
            flex
            h-[69.25px]
            min-w-0
            flex-1
            flex-col
            items-start
          "
          style={{
            gap: "5.25px",
          }}
        >
          {/* Frame 181 */}
          <div className="flex h-10 flex-col items-start">
            <p
              className="
                m-0
                text-xs
                font-normal
                uppercase
                leading-[18px]
                text-[#737373]
              "
            >
              TWO-PIECE
            </p>

            <p
              className="
                m-0
                text-base
                font-bold
                uppercase
                leading-6
                text-[#404040]
              "
            >
              REINA
            </p>
          </div>
        </div>

        {/* Price + bag */}
        <div
          className="
            flex
            shrink-0
            items-center
            justify-end
          "
          style={{
            gap: "12px",
          }}
        >
          <span
            className="
              text-base
              font-normal
              leading-6
              text-[#404040]
            "
          >
            70,000
          </span>

          <BagIcon />
        </div>
      </div>
    </div>
  );
}

export default function ShopGrid() {
  return (
    <section className="w-full bg-[#FAFAFA]">
      {/* Frame 182 / section heading area */}
      <div
        className="
          flex
          w-full
          flex-col
          items-center
          justify-center
          gap-[10px]
          px-5
          pb-[140px]
          pt-10
        "
      >
        <div
          className="
            flex
            w-full
            max-w-none
            items-end
            justify-between
          "
          style={{
            paddingLeft: "0",
            paddingRight: "0",
          }}
        >
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
      </div>

      {/* Frame 291 */}
      <div
        className="
          grid
          w-full
          grid-cols-1
          lg:grid-cols-2
        "
        style={{
          paddingLeft: "304px",
          paddingRight: "304px",
          paddingBottom: "77px",
          columnGap: "5.25px",
          rowGap: "100px",
        }}
      >
        {DEMO_ITEMS.map((image, i) => (
          <ProductCard key={i} image={image} />
        ))}
      </div>

      {/* Frame 182 — Add to Bag */}
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
        <button
          type="button"
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
          ADD TO BAG
        </button>
      </div>
    </section>
  );
}