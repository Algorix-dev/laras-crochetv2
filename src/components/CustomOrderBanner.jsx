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
const CUSTOM_ELLIPSE_OPACITY = 1.0;

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
            drifted away from their feet on your screen. Moved
            below into the MODELS block where it's now positioned
            relative to the models image itself. */}
      </div>

      {/* ========================================================
          CONTENT LAYER
          ======================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[1200px]
          px-5
        "
      >
        {/* ======================================================
            CUSTOM WORDMARK + ORDERS
            ====================================================== */}

        <div
          className="
            relative
            mx-auto
            mt-[15px]
            w-[547px]
            max-w-[80vw]
          "
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
              checked with getbbox()), so that math put ORDERS way
              above the wordmark instead of on it. Measured the
              real "m" glyph directly: cropping just the rightmost
              28% of the asset and checking where its ink starts
              gives 30.8% down. That's what "top" is set to now.
              Nudge a few % either way if you want it sitting
              deeper into/further off the "m". */}
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
              top: "30.8%",
            }}
          >
            ORDERS
          </span>
        </div>

        {/* ======================================================
            MODELS

            Responsive sizing:

            1920px → about 650px
            1440px → about 490px
            1280px → about 480px minimum
            Mobile → scales down with viewport

            This prevents the models from becoming huge on
            smaller screens while preserving the desktop design.

            TIP: the glow ("Ellipse 27" in Figma) now lives INSIDE
            this same wrapper, positioned as a % of the models
            image itself (left-1/2, top-[98%], centered) instead
            of a fixed page pixel. Checked the actual trio PNG with
            getbbox() — the models' feet sit right at the very
            bottom edge of the file (ink runs 0% to 100%, no
            padding), so 98% down puts the glow right under their
            feet at ANY screen size, because it's now anchored to
            the image, not the page.
            ====================================================== */}

        <div
          className="
            relative
            mx-auto
            mt-[-15px]
            flex
            justify-center
          "
        >
          {/* TIP: this inner wrapper is `inline-block` (shrinks to
              fit the image) rather than the outer flex row (which
              spans the full container width). That matters because
              the glow below is positioned with %, and % needs to
              be measured against the IMAGE's own box, not the
              wider row around it — otherwise "75% wide" would mean
              75% of the whole row, not 75% of the models. */}
          <div className="relative inline-block">
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