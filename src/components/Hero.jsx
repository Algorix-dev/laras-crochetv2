import { useState } from "react";
import { motion } from "framer-motion";

import model2 from "../assets/model-images/model-coral.png";
import model3 from "../assets/model-images/model-marina.png";
import model5 from "../assets/model-images/model-sienna.png";
import model6 from "../assets/model-images/model-amber.png";
import heroCenter from "../assets/reina-front.png";

/* ============================================================
   HERO TUNING
   ============================================================ */

const SPIN_DURATION_SECONDS = 6;
const SIDE_TILT_DEGREES = 18;

/*
  Supporting models need to feel substantial like the Figma,
  but they must NOT be stretched vertically.
*/
const SUPPORT_SCALE_X = 1.12;
const SUPPORT_SCALE_Y = 1.0;

/*
  The selected model is intentionally larger.
*/
const SELECTED_SCALE_X = 1.0;
const SELECTED_SCALE_Y = 1.0;

const SIDE_MODEL_OPACITY = 0.45;

/*
  Increase/decrease this to control how close the five models are.
*/
const MODEL_OVERLAP = "1.2rem";

/*
  Keep the hero from becoming too wide on very large screens.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[10%]";

/* ============================================================
   ANIMATION
   ============================================================ */

const SELECT_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 28,
};

const MOVE_TRANSITION = {
  layout: {
    duration: 0.55,
    ease: [0.4, 0, 0.2, 1],
  },
  opacity: {
    duration: 0.55,
    ease: [0.4, 0, 0.2, 1],
  },
};

/* ============================================================
   MODELS
   ============================================================ */

const MODELS = [
  {
    id: "model2",
    name: "Coral",
    price: 70000,
    image: model2,
  },
  {
    id: "model6",
    name: "Amber",
    price: 70000,
    image: model6,
  },
  {
    id: "reina",
    name: "Reina",
    price: 70000,
    image: heroCenter,
  },
  {
    id: "model5",
    name: "Sienna",
    price: 70000,
    image: model5,
  },
  {
    id: "model3",
    name: "Marina",
    price: 70000,
    image: model3,
  },
];

const CENTER_INDEX = 2;

/* ============================================================
   IMAGE SIZES
   ============================================================

   The previous supporting models were too small.

   At 1920px:
   - selected ≈ 650px tall
   - supporting ≈ 570px tall

   This gives the supporting models much more presence while
   keeping the selected model clearly dominant.
*/

const IMAGE_HEIGHT_SELECTED =
  "h-[clamp(25rem,34vw,42rem)]";

const IMAGE_HEIGHT_UNSELECTED =
  "h-[clamp(22rem,30vw,37rem)]";

/* ============================================================
   PODIUM
   ============================================================ */

const PODIUM_VIEWBOX = "0 0 243.81 116.05";

const PODIUM_RINGS = [
  {
    cx: 121.9,
    cy: 59.94,
    rx: 121.9,
    ry: 56.11,
  },
  {
    cx: 121.9,
    cy: 59.99,
    rx: 110.45,
    ry: 50.83,
  },
  {
    cx: 124.34,
    cy: 50.83,
    rx: 110.45,
    ry: 50.83,
  },
];

const PODIUM_STROKE_WIDTH = 2.5;
const PODIUM_DASH_LENGTH = 4;
const PODIUM_DASH_GAP = 3;
const PODIUM_DASH =
  `${PODIUM_DASH_LENGTH} ${PODIUM_DASH_GAP}`;

const BASE_RING_OPACITY = 0.45;

const COMET_STROKE_WIDTH = 4.5;
const COMET_GLOW_BLUR = 2.2;

const COMET_BAND_WIDTH = 55;

const COMET_STOPS = [
  {
    offset: "0%",
    opacity: 0,
  },
  {
    offset: `${50 - COMET_BAND_WIDTH / 2}%`,
    opacity: 0,
  },
  {
    offset: "50%",
    opacity: 1,
  },
  {
    offset: `${50 + COMET_BAND_WIDTH / 2}%`,
    opacity: 0,
  },
  {
    offset: "100%",
    opacity: 0,
  },
];

const PODIUM_SPIN_START =
  typeof performance !== "undefined"
    ? performance.now()
    : 0;

function getPodiumAnimationDelay() {
  const now =
    typeof performance !== "undefined"
      ? performance.now()
      : 0;

  const elapsedSeconds =
    (now - PODIUM_SPIN_START) / 1000;

  const phase =
    elapsedSeconds % SPIN_DURATION_SECONDS;

  return `-${phase.toFixed(3)}s`;
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/* ============================================================
   HERO
   ============================================================ */

export default function Hero() {
  /*
    KEEPING YOUR EXISTING ORDER/SWITCHING MECHANISM.

    We are NOT changing how selection works here.
    For this pass, we're only changing the visual sizing.
  */

  const [order, setOrder] = useState(
    MODELS.map((model) => model.id)
  );

  const modelsById = Object.fromEntries(
    MODELS.map((model) => [model.id, model])
  );

  function handleSelect(id) {
    setOrder((prev) => {
      const centerId = prev[CENTER_INDEX];

      if (id === centerId) {
        return prev;
      }

      const clickedIndex = prev.indexOf(id);

      const next = [...prev];

      next[CENTER_INDEX] = id;
      next[clickedIndex] = centerId;

      return next;
    });
  }

  return (
    <section
      className="
        pt-8
        md:pt-12
        lg:pt-14
        pb-24
        md:pb-8
        text-center
      "
      style={{
        perspective: "1800px",
      }}
    >
      <div
        className={`
          relative
          mx-auto
          ${PAGE_CONTAINER_PADDING}
        `}
      >

        {/* ==================================================
            FIVE MODEL ROW
            ================================================== */}

        <div
          className="
            grid
            w-full
            grid-cols-5
            items-end
          "
        >
          {order.map((id, index) => {
            const model = modelsById[id];

            const isSelected =
              index === CENTER_INDEX;

            const isOuter =
              index === 0 ||
              index === order.length - 1;

            const side =
              index < CENTER_INDEX
                ? -1
                : 1;

            return (
              <motion.button
                key={model.id}
                layout
                transition={SELECT_SPRING}
                type="button"
                onClick={() =>
                  handleSelect(model.id)
                }
                aria-label={`Show ${model.name}`}
                aria-pressed={isSelected}
                style={{
                  marginLeft: MODEL_OVERLAP,
                  marginRight: MODEL_OVERLAP,
                }}
                className="
                  relative
                  w-full
                  min-w-0
                  border-0
                  bg-transparent
                  p-0
                  flex
                  items-end
                  justify-center
                  overflow-visible
                "
              >

                {/* ==================================================
                    MODEL NAME
                    ================================================== */}

                {isSelected && (
                  <motion.h1
                    layoutId="hero-name"
                    transition={MOVE_TRANSITION}
                    className="
                      absolute
                      left-1/2
                      -translate-x-1/2
                      bottom-[87.9%]
                      z-0

                      font-['Raleway']
                      font-bold

                      tracking-[-0.07em]

                      text-[clamp(3rem,5vw,6rem)]
                      leading-[1.05]

                      text-[var(--maroon-dark)]

                      select-none
                      whitespace-nowrap
                      pointer-events-none
                    "
                  >
                    {model.name.toUpperCase()}
                  </motion.h1>
                )}

                {/* ==================================================
                    PODIUM
                    ================================================== */}

                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={MOVE_TRANSITION}
                    aria-hidden="true"
                    className="
                      absolute
                      left-1/2
                      -translate-x-1/2

                      bottom-[-7.2%]

                      z-0

                      w-[clamp(8rem,12.7vw,15.24rem)]

                      aspect-[243.81/116.05]

                      pointer-events-none
                    "
                  >

                    {/* Soft floor glow */}
                    <div
                      className="
                        absolute
                        inset-0
                        -z-10
                      "
                      style={{
                        background:
                          "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(76,5,25,0.35), rgba(76,5,25,0.08) 60%, transparent 80%)",
                        filter: "blur(6px)",
                      }}
                    />

                    {/* Base podium */}
                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                      "
                      style={{
                        opacity:
                          BASE_RING_OPACITY,
                      }}
                      fill="none"
                    >
                      {PODIUM_RINGS.map(
                        (ring, i) => (
                          <ellipse
                            key={i}
                            cx={ring.cx}
                            cy={ring.cy}
                            rx={ring.rx}
                            ry={ring.ry}
                            stroke="var(--maroon-dark)"
                            strokeWidth={
                              PODIUM_STROKE_WIDTH
                            }
                            strokeDasharray={
                              PODIUM_DASH
                            }
                            strokeLinecap="round"
                          />
                        )
                      )}
                    </svg>

                    {/* Animated comet */}
                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        overflow-visible
                      "
                      fill="none"
                    >
                      <defs>

                        <linearGradient
                          id="podium-comet"
                          gradientUnits="userSpaceOnUse"
                          x1={
                            PODIUM_RINGS[0].cx -
                            PODIUM_RINGS[0].rx * 1.4
                          }
                          y1={
                            PODIUM_RINGS[0].cy
                          }
                          x2={
                            PODIUM_RINGS[0].cx +
                            PODIUM_RINGS[0].rx * 1.4
                          }
                          y2={
                            PODIUM_RINGS[0].cy
                          }
                        >
                          {COMET_STOPS.map(
                            (stop, i) => (
                              <stop
                                key={i}
                                offset={
                                  stop.offset
                                }
                                stopColor="var(--maroon-dark)"
                                stopOpacity={
                                  stop.opacity
                                }
                              />
                            )
                          )}

                          <animateTransform
                            attributeName="gradientTransform"
                            type="rotate"
                            from={`0 ${PODIUM_RINGS[0].cx} ${PODIUM_RINGS[0].cy}`}
                            to={`360 ${PODIUM_RINGS[0].cx} ${PODIUM_RINGS[0].cy}`}
                            dur={`${SPIN_DURATION_SECONDS}s`}
                            begin={getPodiumAnimationDelay()}
                            repeatCount="indefinite"
                          />
                        </linearGradient>

                        <filter
                          id="podium-glow"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feGaussianBlur
                            stdDeviation={
                              COMET_GLOW_BLUR
                            }
                            result="blur"
                          />

                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                      </defs>

                      {PODIUM_RINGS.map(
                        (ring, i) => (
                          <ellipse
                            key={i}
                            cx={ring.cx}
                            cy={ring.cy}
                            rx={ring.rx}
                            ry={ring.ry}
                            stroke="url(#podium-comet)"
                            strokeWidth={
                              COMET_STROKE_WIDTH
                            }
                            strokeDasharray={
                              PODIUM_DASH
                            }
                            strokeLinecap="round"
                            filter="url(#podium-glow)"
                          />
                        )
                      )}
                    </svg>
                  </motion.div>
                )}

                {/* ==================================================
                    MODEL IMAGE
                    ================================================== */}

                <motion.img
                  layout
                  src={model.image}
                  alt={
                    isSelected
                      ? model.name
                      : ""
                  }

                  animate={{
                    rotateY: isSelected
                      ? 0
                      : side *
                        SIDE_TILT_DEGREES,

                    opacity: isSelected
                      ? 1
                      : SIDE_MODEL_OPACITY,

                    /*
                      IMPORTANT:

                      scaleX makes the supporting models feel
                      slightly fuller without changing their
                      actual image aspect ratio.

                      scaleY remains 1 so they don't become
                      vertically stretched.
                    */
                    scaleX: isSelected
                      ? SELECTED_SCALE_X
                      : SUPPORT_SCALE_X,

                    scaleY: isSelected
                      ? SELECTED_SCALE_Y
                      : SUPPORT_SCALE_Y,
                  }}

                  transition={{
                    layout: SELECT_SPRING,
                    rotateY: SELECT_SPRING,
                    opacity: SELECT_SPRING,
                    scaleX: SELECT_SPRING,
                    scaleY: SELECT_SPRING,
                  }}

                  style={{
                    transformOrigin:
                      "50% 100%",

                    /*
                      VERY IMPORTANT:
                      Keep the PNG's natural aspect ratio.
                    */
                    width: "auto",
                    maxWidth: "none",

                    /*
                      Prevent the image from being compressed
                      by the grid column.
                    */
                    flexShrink: 0,
                  }}

                  className={`
                    relative
                    z-10
                    w-auto
                    shrink-0
                    object-contain

                    ${
                      isSelected
                        ? IMAGE_HEIGHT_SELECTED
                        : IMAGE_HEIGHT_UNSELECTED
                    }
                  `}
                />

                {/* ==================================================
                    PRICE
                    ================================================== */}

                {isSelected && (
                  <motion.div
                    layoutId="hero-price"
                    transition={MOVE_TRANSITION}
                    className="
                      absolute
                      left-1/2
                      -translate-x-1/2
                      top-full
                      z-10

                      mt-7

                      w-[clamp(11rem,18.75vw,22.5rem)]

                      flex
                      items-center
                      justify-between

                      text-xl
                    "
                  >
                    <span
                      className="
                        uppercase
                        tracking-wide
                      "
                    >
                      {model.name}
                    </span>

                    <span
                      className="
                        font-bold
                        tracking-[-0.04em]
                      "
                    >
                      {formatNaira(
                        model.price
                      )}
                    </span>
                  </motion.div>
                )}

              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}