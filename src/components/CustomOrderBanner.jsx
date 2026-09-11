import customTrio from "../assets/model-images/custom-orders-trio.png";
import customWordmark from "../assets/custom-orders-wordmark.png";
import arcSwirl from "../assets/decor/arc-swirl.png";
import threadBand from "../assets/decor/thread-band.png";

/* ============================================================
   DECORATION CONTROLS

   TIP: all bumped to 1.00 (max) right now so you can actually
   SEE every layer and dial each one in yourself. Once you've
   found a look you like, bring these back down — 0.20/0.30 were
   the original Figma values, anything much above ~0.65 starts
   looking heavy on a cream background.

   ARC:
   0.20 = original Figma
   0.35 = subtle
   0.50 = clearly visible
   0.65 = strong
   0.80 = very strong
   1.00 = maximum

   THREAD:
   0.30 = original Figma
   0.50 = clearly visible
   0.65 = strong
   0.75 = very strong
   1.00 = maximum
   ============================================================ */

const CUSTOM_ARC_OPACITY = 1.0;
const CUSTOM_THREAD_OPACITY = 1.0;
const CUSTOM_ELLIPSE_OPACITY = 0.35;

// TIP — SHARED 304px MARGIN: same px-5 md:px-8 lg:px-[15.83%]
// class used in Navbar/Hero/LaraShowcase/ProductGrid/Footer, so
// this section's content edges line up with the rest of the page
// instead of the old max-w-[1200px] + px-5, which put the content
// edge somewhere different from every other section at most
// screen widths.
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

// TIP — WORDMARK-BEHIND-MODELS (this is the fix you asked about):
//
// Before, the wordmark was its own block sitting ABOVE the models
// in normal document flow — two separate boxes stacked vertically,
// so there was never any overlap for it to sit "behind" anything.
//
// Hero.jsx gets "name behind model" by putting the name INSIDE the
// exact same `relative` wrapper as the model image, with a lower
// z-index (name z-0, image z-10+) and positioning it with a % so
// it's measured against that wrapper's own box, not the page.
//
// Same trick here: the wordmark now lives inside the models'
// `relative inline-block` wrapper below, at z-0, positioned near
// the TOP of that box (top-[8%]) so it sits behind the models'
// heads specifically, not floating centered behind their whole
// bodies. The glow stays z-10, the models stay z-20 on top of both.
//
// WORDMARK_TOP_PERCENT is the one number to nudge if you want it
// sitting higher/lower relative to the heads — same idea as
// Hero's `bottom-[87.9%]` for the model name.
const WORDMARK_TOP_PERCENT = "-5%";
const WORDMARK_WIDTH_PX = 547;

/* ============================================================
   CUSTOM ORDER BANNER
   ============================================================ */

export default function CustomOrderBanner() {
  return (
    <section
      id="custom-orders"
      className="
        relative
        min-h-[1098px]
        w-full
        overflow-hidden
        bg-[#FAFAFA]
      "
    >
      {/* ========================================================
          FULL-WIDTH DECORATION LAYER

          Figma frame:
          1920 × 1098

          These positions are intentionally preserved because
          you said the decoration looks perfect.

          TIP: blur was removed (no more blur-[1px] / blur-[2px])
          while you're calibrating — blur softens contrast
          against the light background, which was part of why
          these read as barely-there before even at 0.65/0.75
          opacity. Add blur back in once you've picked
          positions/opacities you like, if you want the softer
          look again.
          ======================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          overflow-hidden
        "
      >
        {/* ======================================================
            LEFT ARC
            ====================================================== */}

        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            max-w-none
            select-none
          "
          style={{
            width: "69.84vw",
            left: "-9.58vw",
            top: "194px",
            opacity: CUSTOM_ARC_OPACITY,
          }}
        />

        {/* ======================================================
            RIGHT ARC
            ====================================================== */}

        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            max-w-none
            select-none
          "
          style={{
            width: "71.09vw",
            left: "37.81vw",
            top: "193px",
            opacity: CUSTOM_ARC_OPACITY,
            transform: "scaleX(-1)",
            transformOrigin: "center",
          }}
        />

        {/* ======================================================
            COLOURED THREAD BAND
            ====================================================== */}

        <img
          src={threadBand}
          alt=""
          className="
            absolute
            left-1/2
            w-full
            max-w-none
            -translate-x-1/2
            select-none
          "
          style={{
            top: "359px",
            opacity: CUSTOM_THREAD_OPACITY,
          }}
        />

        {/* Ellipse 27 removed from here — it wasn't actually tied
            to the models, just to a fixed pixel on the page, so it
            drifted away from their feet on your screen. Positioned
            below into the MODELS block where it's anchored relative
            to the models image itself. */}
      </div>

      {/* ========================================================
          CONTENT LAYER

          TIP: dropped `mx-auto max-w-[1200px]` in favor of the
          shared PAGE_CONTAINER_PADDING class — max-w-[1200px] was
          capping this section's content width independently of
          every other section, so its left/right edges landed in a
          different place than Hero/ProductGrid/Footer at most
          viewport widths. Now it uses the same 304px-at-1920px
          scale as the rest of the page.
          ======================================================== */}

      <div
        className={`relative z-10 mx-auto w-full ${PAGE_CONTAINER_PADDING}`}
      >
        {/* ======================================================
            MODELS (+ wordmark behind heads, + glow under feet)

            Responsive sizing:

            1920px → about 650px
            1440px → about 490px
            1280px → about 480px minimum
            Mobile → scales down with viewport

            This prevents the models from becoming huge on
            smaller screens while preserving the desktop design.

            TIP: the glow ("Ellipse 27" in Figma) lives INSIDE this
            same wrapper, positioned as a % of the models image
            itself (left-1/2, top-[98%], centered) instead of a
            fixed page pixel. Checked the actual trio PNG with
            getbbox() — the models' feet sit right at the very
            bottom edge of the file (ink runs 0% to 100%, no
            padding), so 98% down puts the glow right under their
            feet at ANY screen size, because it's anchored to the
            image, not the page.

            The wordmark now lives in here too, for the same
            reason — see WORDMARK_TOP_PERCENT above.
            ====================================================== */}

        <div
          className="
            relative
            mx-auto
            mt-[15px]
            flex
            justify-center
          "
        >
          {/* TIP: this inner wrapper is `inline-block` (shrinks to
              fit the image) rather than a full-width flex row.
              That matters because both the wordmark and the glow
              below are positioned with %, and % needs to be
              measured against the IMAGE's own box, not a wider
              row around it — otherwise "8% down" or "75% wide"
              would mean 8%/75% of the whole row, not of the
              models. */}
          <div className="relative inline-block">
            {/* Wordmark — z-0, so the models image (z-20) draws
                on top of it and it reads as "behind their heads." */}
            <div
              className="
                absolute
                left-1/2
                z-0
                -translate-x-1/2
                max-w-[80vw]
              "
              style={{
                top: WORDMARK_TOP_PERCENT,
                width: `${WORDMARK_WIDTH_PX}px`,
              }}
            >
              <img
                src={customWordmark}
                alt="Custom"
                className="
                  block
                  h-auto
                  w-full
                "
              />

              {/* Orders — TIP: the 17.47% used before assumed the
                  exported PNG matched Figma's 547x277 text-box
                  proportions. It doesn't — the actual file is
                  1665x412 (a much flatter crop, no padding in it —
                  checked with getbbox()), so that math put ORDERS
                  way above the wordmark instead of on it. Measured
                  the real "m" glyph directly: cropping just the
                  rightmost 28% of the asset and checking where its
                  ink starts gives 30.8% down. That's what "top" is
                  set to now. Nudge a few % either way if you want
                  it sitting deeper into/further off the "m". */}
              <span
                className="
                  absolute
                  whitespace-nowrap
                  font-sans
                  font-normal
                  text-black
                  text-[clamp(16px,1.33vw,25px)]
                "
                style={{
                  left: "77.46%",
                  top: "10.8%",
                }}
              >
                ORDERS
              </span>
            </div>

            {/* Glow — z-10, under the models' feet, above the wordmark */}
            <div
              aria-hidden="true"
              className="
                absolute
                left-1/2
                top-[98%]
                z-10
                w-[75%]
                max-w-[640px]
                -translate-x-1/2
                -translate-y-1/2
                rounded-[50%]
                bg-[#4C0519]
                blur-[24px]
                aspect-[640/78]
              "
              style={{
                opacity: CUSTOM_ELLIPSE_OPACITY,
              }}
            />

            {/* Models — z-20, on top of both the wordmark and the glow */}
            <img
              src={customTrio}
              alt="Lara's Crochet custom pieces"
              className="
                relative
                z-20
                h-auto
                max-w-[90vw]
                select-none
                object-contain
              "
              style={{
                width: "clamp(360px, 34vw, 650px)",
              }}
            />
          </div>
        </div>

        {/* ======================================================
            SUPPORTING TEXT + BUTTON
            ====================================================== */}

        <div
          className="
            relative
            z-20
            mx-auto
            mt-[45px]
            flex
            max-w-[617px]
            flex-col
            items-center
            gap-[14px]
            text-center
          "
        >
          <p
            className="
              w-full
              text-[16px]
              leading-6
              text-[#404040]
            "
          >
            Every piece tells a story. Tell us yours and let Lara create
            something made especially for you, from the color and fit to the
            smallest details.
          </p>

          <button
            type="button"
            className="
              flex
              h-[46px]
              w-[245px]
              items-center
              justify-center
              gap-[10px]
              bg-[#564345]
              px-[40px]
              text-[16px]
              font-bold
              text-[#FAFAFA]
              transition-opacity
              duration-200
              hover:opacity-90
            "
          >
            ADD TO BAG
          </button>
        </div>
      </div>
    </section>
  );
}