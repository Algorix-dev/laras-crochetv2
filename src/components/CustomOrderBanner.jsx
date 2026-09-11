import customTrio from "../assets/model-images/custom-orders-trio.png";
import customWordmark from "../assets/custom-orders-wordmark.png";
import arcSwirl from "../assets/decor/arc-swirl.png";
import threadBand from "../assets/decor/thread-band.png";

/* ============================================================
   DECORATION CONTROLS
   ============================================================ */

const CUSTOM_ARC_OPACITY = 1.0;
const CUSTOM_THREAD_OPACITY = 1.0;
const CUSTOM_ELLIPSE_OPACITY = 0.35;

/* ============================================================
   SHARED PAGE CONTAINER
   ============================================================ */

const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";

/* ============================================================
   CUSTOM ARTWORK POSITIONING

   These controls are intentionally independent.

   CUSTOM_ART_TOP_PX:
   Moves the complete models + wordmark artwork up/down.

   CUSTOM_WORDMARK_TOP_PERCENT:
   Moves ONLY the wordmark relative to the models.

   CUSTOM_WORDMARK_WIDTH_PX:
   Controls ONLY the wordmark width.

   CUSTOM_MODELS_WIDTH:
   Controls ONLY the model trio width.

   This prevents changing the wordmark size from accidentally
   changing the position of the models.
   ============================================================ */

const CUSTOM_ART_TOP_PX = 15;

const CUSTOM_WORDMARK_TOP_PERCENT = "-2.5%";

const CUSTOM_WORDMARK_WIDTH_PX = 547;

const CUSTOM_MODELS_WIDTH =
  "clamp(360px, 34vw, 650px)";

/*
  The wordmark is allowed to extend above the models wrapper.

  It is deliberately NOT clipped by the custom section.
*/
const CUSTOM_ART_Z_INDEX = 10;

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
        overflow-visible
        bg-[#FAFAFA]
      "
    >
      {/* ========================================================
          FULL-WIDTH DECORATION LAYER

          The decoration remains clipped to the banner so the arcs
          and thread do not spill into neighboring sections.
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
            opacity:
              CUSTOM_ARC_OPACITY,
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
            opacity:
              CUSTOM_ARC_OPACITY,
            transform:
              "scaleX(-1)",
            transformOrigin:
              "center",
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
            opacity:
              CUSTOM_THREAD_OPACITY,
          }}
        />
      </div>

      {/* ========================================================
          CONTENT LAYER

          overflow-visible is intentional.

          This allows the CUSTOM wordmark to overlap the model
          heads without being chopped by the banner's top edge.
          ======================================================== */}

      <div
        className={`relative z-10 mx-auto w-full overflow-visible ${PAGE_CONTAINER_PADDING}`}
      >
        {/* ======================================================
            MODELS + WORDMARK
            ====================================================== */}

        <div
          className="
            relative
            mx-auto
            flex
            justify-center
            overflow-visible
          "
          style={{
            paddingTop:
              `${CUSTOM_ART_TOP_PX}px`,
          }}
        >
          {/* ====================================================
              ARTWORK WRAPPER

              This wrapper is sized by the models image.

              The wordmark is absolutely positioned inside it,
              while the models remain in normal image positioning.
              ==================================================== */}

          <div
            className="
              relative
              inline-block
              overflow-visible
            "
          >
            {/* ==================================================
                CUSTOM WORDMARK

                z-0 = behind models
                z-20 = models above it

                Change CUSTOM_WORDMARK_TOP_PERCENT to move the
                wordmark independently without moving the models.
                ================================================== */}

            <div
              className="
                absolute
                left-1/2
                z-0
                -translate-x-1/2
                overflow-visible
                max-w-[80vw]
              "
              style={{
                top:
                  CUSTOM_WORDMARK_TOP_PERCENT,
                width:
                  `${CUSTOM_WORDMARK_WIDTH_PX}px`,
              }}
            >
              <img
                src={customWordmark}
                alt="Custom"
                className="
                  block
                  h-auto
                  w-full
                  max-w-none
                "
              />

              {/* =================================================
                  ORDERS LABEL

                  This remains attached to the wordmark itself,
                  so resizing or moving the wordmark keeps ORDERS
                  attached to it.
                  ================================================= */}

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

            {/* ==================================================
                GLOW

                Anchored to the models wrapper instead of a fixed
                page position.
                ================================================== */}

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
                opacity:
                  CUSTOM_ELLIPSE_OPACITY,
              }}
            />

            {/* ==================================================
                MODELS

                z-20 keeps the models above the CUSTOM wordmark
                and the glow.
                ================================================== */}

            <img
              src={customTrio}
              alt="Lara's Crochet custom pieces"
              className="
                relative
                z-20
                block
                h-auto
                max-w-[90vw]
                select-none
                object-contain
              "
              style={{
                width:
                  CUSTOM_MODELS_WIDTH,
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