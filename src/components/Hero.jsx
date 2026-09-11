/*
  Hero section

  - Five models are always visible on desktop.
  - Reina starts in the center.
  - Clicking a supporting model swaps it into the center position.
  - Model PNGs preserve their natural aspect ratios.
  - Each model has its own visual height to match the Figma composition.
  - Desktop content is constrained to the same ~304px side margins
    as the 1920px Figma frame.
*/

import { useState } from "react";
import { motion } from "framer-motion";

import model2 from "../assets/model-images/model-coral.png";
import model3 from "../assets/model-images/model-marina.png";
import model5 from "../assets/model-images/model-sienna.png";
import model6 from "../assets/model-images/model-amber.png";
import heroCenter from "../assets/reina-front.png";

/* ============================================================
   EASY TUNING
   ============================================================ */

const SPIN_DURATION_SECONDS = 6;
const SIDE_TILT_DEGREES = 28;

const PRICE_TOP_OFFSET = "2.25rem";
const SIDE_MODEL_OPACITY = 0.55;

/*
  Your Figma content starts around 304px from the left
  and ends around 304px from the right on a 1920px frame.
*/
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

/*
  Small visual overlap between neighboring models.

  IMPORTANT:
  We are no longer using this to compensate for distorted
  image widths. The PNGs themselves retain their proportions.
*/
const NEGATIVE_OVERLAP = "1rem";

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
   MODEL DATA
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

/*
  Reina starts at index 2:

  0 = Coral
  1 = Amber
  2 = Reina
  3 = Sienna
  4 = Marina
*/
const CENTER_INDEX = 2;

/* ============================================================
   MODEL SIZES
   ============================================================

   These control HEIGHT only.

   Width remains AUTO so each PNG keeps its original aspect ratio.

   This is important because the exported Figma images don't all
   have identical canvas proportions.
*/

const MODEL_HEIGHTS = {
  model2: "clamp(13rem, 21vw, 25rem)", // Coral
  model6: "clamp(14rem, 22vw, 26.5rem)", // Amber
  reina: "clamp(20rem, 31.40625vw, 37.6875rem)", // Reina
  model5: "clamp(14rem, 22vw, 26.5rem)", // Sienna
  model3: "clamp(13rem, 21vw, 25rem)", // Marina
};

/*
  How far each model sits across the desktop Figma composition.

  The center is exactly 50%.
*/
const MODEL_POSITIONS = {
  model2: "2%",
  model6: "25%",
  reina: "50%",
  model5: "75%",
  model3: "98%",
};

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

/* ============================================================
   PODIUM ANIMATION
   ============================================================ */

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

/* ============================================================
   HELPERS
   ============================================================ */

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/* ============================================================
   HERO
   ============================================================ */

export default function Hero() {
  /*
    The array determines the visual left → right order.

    Initially:

    Coral | Amber | Reina | Sienna | Marina
  */
  const [order, setOrder] = useState(
    MODELS.map((model) => model.id)
  );

  const modelsById = Object.fromEntries(
    MODELS.map((model) => [model.id, model])
  );

  /*
    When a supporting model is clicked:

    clicked model ↔ current center model

    Nothing else moves.
  */
  function handleSelect(id) {
    setOrder((previousOrder) => {
      const centerId =
        previousOrder[CENTER_INDEX];

      if (id === centerId) {
        return previousOrder;
      }

      const clickedIndex =
        previousOrder.indexOf(id);

      const nextOrder = [...previousOrder];

      nextOrder[CENTER_INDEX] = id;
      nextOrder[clickedIndex] = centerId;

      return nextOrder;
    });
  }

  return (
    <section
      className="
        pt-10
        md:pt-16
        pb-24
        md:pb-40
        text-center
      "
      style={{
        perspective: "1800px",
      }}
    >
      {/* ======================================================
          FIGMA CONTENT WIDTH
          ====================================================== */}

      <div
        className={`
          relative
          mx-auto
          ${PAGE_CONTAINER_PADDING}
        `}
      >
        {/* ====================================================
            MODEL STAGE

            This is intentionally NOT a grid.

            Each model gets an absolute X position so we can
            reproduce the Figma composition precisely.
            ==================================================== */}

        <div
          className="
            relative
            w-full
            h-[clamp(25rem,38vw,46rem)]
          "
        >
          {order.map((id, index) => {
            const model = modelsById[id];

            const isSelected =
              index === CENTER_INDEX;

            const side =
              index < CENTER_INDEX ? -1 : 1;

            return (
              <motion.button
                key={model.id}
                layout
                transition={SELECT_SPRING}
                type="button"
                onClick={() => handleSelect(model.id)}
                aria-label={`Show ${model.name}`}
                aria-pressed={isSelected}
                style={{
                  position: "absolute",
                  left: MODEL_POSITIONS[model.id],
                  bottom: 0,
                  transform: "translateX(-50%)",
                  marginLeft: NEGATIVE_OVERLAP,
                  marginRight: NEGATIVE_OVERLAP,
                }}
                className={`
                  border-0
                  bg-transparent
                  p-0
                  m-0
                  flex
                  items-end
                  justify-center
                  cursor-pointer
                  focus:outline-none
                `}
              >
                {/* =================================================
                    MODEL NAME

                    Only selected model gets the large REINA title.
                    ================================================= */}

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

                      text-[clamp(2.5rem,5vw,6rem)]
                      leading-[1.18]

                      text-[var(--maroon-dark)]

                      select-none
                      whitespace-nowrap
                      pointer-events-none
                    "
                  >
                    {model.name.toUpperCase()}
                  </motion.h1>
                )}

                {/* =================================================
                    PODIUM
                    ================================================= */}

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

                      w-[clamp(6rem,12.7vw,15.24rem)]
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

                    {/* Base rings */}
                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                      "
                      style={{
                        opacity: BASE_RING_OPACITY,
                      }}
                      fill="none"
                    >
                      {PODIUM_RINGS.map(
                        (ring, ringIndex) => (
                          <ellipse
                            key={ringIndex}
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
                            (stop, stopIndex) => (
                              <stop
                                key={stopIndex}
                                offset={stop.offset}
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
                            from={`
                              0
                              ${PODIUM_RINGS[0].cx}
                              ${PODIUM_RINGS[0].cy}
                            `}
                            to={`
                              360
                              ${PODIUM_RINGS[0].cx}
                              ${PODIUM_RINGS[0].cy}
                            `}
                            dur={`${SPIN_DURATION_SECONDS}s`}
                            begin={getPodiumAnimationDelay()}
                            repeatCount="indefinite"
                          />
                        </linearGradient>

                        {/* Glow */}
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
                        (ring, ringIndex) => (
                          <ellipse
                            key={ringIndex}
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

                {/* =================================================
                    MODEL IMAGE

                    IMPORTANT:
                    - height is controlled per model
                    - width is AUTO
                    - object-contain
                    - NO fixed width
                    - NO object-cover

                    This preserves the actual proportions of your
                    exported Figma PNGs.
                    ================================================= */}

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
                      : side * SIDE_TILT_DEGREES,

                    opacity: isSelected
                      ? 1
                      : SIDE_MODEL_OPACITY,
                  }}
                  transition={{
                    layout: SELECT_SPRING,
                    rotateY: SELECT_SPRING,
                    opacity: SELECT_SPRING,
                  }}
                  style={{
                    height:
                      MODEL_HEIGHTS[model.id],

                    width: "auto",

                    /*
                      Let the image retain its original
                      proportions.
                    */
                    maxWidth: "none",

                    objectFit: "contain",

                    transformOrigin:
                      "50% 100%",
                  }}
                  className="
                    relative
                    z-10
                    block
                    shrink-0
                  "
                />

                {/* =================================================
                    SELECTED MODEL NAME + PRICE
                    ================================================= */}

                {isSelected && (
                  <motion.div
                    layoutId="hero-price"
                    transition={MOVE_TRANSITION}
                    style={{
                      marginTop:
                        PRICE_TOP_OFFSET,
                    }}
                    className="
                      absolute
                      left-1/2
                      -translate-x-1/2
                      top-full
                      z-10

                      w-[clamp(11rem,18.75vw,22.5rem)]

                      flex
                      items-center
                      justify-between

                      text-xl
                    "
                  >
                    <span className="uppercase tracking-wide">
                      {model.name}
                    </span>

                    <span
                      className="
                        font-bold
                        tracking-[-0.04em]
                      "
                    >
                      {formatNaira(model.price)}
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