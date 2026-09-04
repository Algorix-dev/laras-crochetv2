import customTrio from "../assets/model-images/custom-orders-trio.png";
import customWordmark from "../assets/custom-orders-wordmark.png";
import arcSwirl from "../assets/decor/arc-swirl.png";
import threadBand from "../assets/decor/thread-band.png";

/* ============================================================
   DECORATION CONTROLS

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

const CUSTOM_ARC_OPACITY = 0.65;
const CUSTOM_THREAD_OPACITY = 0.75;

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

          Arcs:
          top ≈ 193px
          height ≈ 557px

          Thread band:
          top = 358.78px
          width = 1920px
          height = 193.73px
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
            Figma:
            left: -184px
            top: 194.1px
            width: 1341px
            ====================================================== */}

        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            max-w-none
            select-none
            blur-[1px]
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
            Figma:
            left: 726px
            top: 192.78px
            width: 1365px
            mirrored horizontally
            ====================================================== */}

        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            max-w-none
            select-none
            blur-[1px]
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

            Figma:
            width: 1920px
            top: 358.78px
            opacity: 0.3
            blur: 6.5px
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
            blur-[2px]
          "
          style={{
            top: "359px",
            opacity: CUSTOM_THREAD_OPACITY,
          }}
        />

        {/* ======================================================
            FIGMA ELLIPSE 27

            width: 640px
            height: 78px
            top: 744px
            opacity: 0.25
            blur: 24.4576px
            ====================================================== */}

        <div
          aria-hidden="true"
          className="
            absolute
            left-1/2
            top-[744px]
            h-[78px]
            w-[640px]
            -translate-x-1/2
            rounded-[50%]
            bg-[#4C0519]
            blur-[24px]
          "
          style={{
            opacity: 0.25,
          }}
        />
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
            CUSTOM WORDMARK
            ====================================================== */}

        <div className="flex justify-center pt-[15px]">
          <img
            src={customWordmark}
            alt="Custom Orders"
            className="
              relative
              z-20
              w-[547px]
              max-w-[80vw]
              select-none
            "
          />
        </div>

        {/* ======================================================
            MODELS

            Figma:
            Group 34
            left: 556.12px
            top: 94.78px
            width: 805.47px
            height: 746px
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
          <img
            src={customTrio}
            alt="Lara's Crochet custom pieces"
            className="
              relative
              z-20
              w-[805px]
              max-w-[90vw]
              select-none
            "
          />
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