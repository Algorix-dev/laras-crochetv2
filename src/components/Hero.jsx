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

const SIDE_MODEL_OPACITY = 0.55;
const PRICE_TOP_OFFSET = "2.25rem";

/*
  Desktop Figma content area.

  1920px viewport
  ~304px left margin
  ~304px right margin

  1920 - 304 - 304 = 1312px content width
*/
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

/*
  Amount of visual overlap between the image slots.
*/
const NEGATIVE_OVERLAP = "0.5rem";

/* ============================================================
   MODEL SIZES
   ============================================================

   IMPORTANT:

   Every model uses HEIGHT + width:auto.

   This means the PNG keeps its natural aspect ratio.

   The supporting models are intentionally much larger than
   the previous version.

   The selected model is larger.
*/

const SIDE_MODEL_HEIGHT =
  "clamp(19rem, 28vw, 33.5rem)";

const SELECTED_MODEL_HEIGHT =
  "clamp(24rem, 35vw, 42rem)";

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

const CENTER_INDEX = 2;

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
    THIS IS THE IMPORTANT PART.

    order controls ONLY which model occupies each position.

    Example:

    Initial:
    [Coral, Amber, Reina, Sienna, Marina]

    Click Marina:

    [Coral, Amber, Marina, Sienna, Reina]

    Nothing else gets moved around.

    The center slot remains index 2.
  */
  const [order, setOrder] = useState(
    MODELS.map((model) => model.id)
  );

  const modelsById = Object.fromEntries(
    MODELS.map((model) => [
      model.id,
      model,
    ])
  );

  function handleSelect(id) {
    setOrder((previousOrder) => {
      const centerId =
        previousOrder[CENTER_INDEX];

      /*
        Already selected.
      */
      if (id === centerId) {
        return previousOrder;
      }

      const clickedIndex =
        previousOrder.indexOf(id);

      /*
        Make a copy.
      */
      const nextOrder = [
        ...previousOrder,
      ];

      /*
        Swap ONLY the clicked model and
        the current center model.
      */
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
      <div
        className={`
          relative
          mx-auto
          ${PAGE_CONTAINER_PADDING}
        `}
      >
        {/* ==================================================
            HERO STAGE
            ================================================== */}

        <div
          className="
            relative
            w-full

            h-[560px]
            md:h-[600px]
            lg:h-[650px]
            xl:h-[690px]
          "
        >
          {order.map((id, index) => {
            const model = modelsById[id];

            const isSelected =
              index === CENTER_INDEX;

            const side =
              index < CENTER_INDEX
                ? -1
                : 1;

            /*
              FIVE FIXED SLOTS.

              These are percentages of the 1312px-ish
              desktop content area.

              They correspond to:

              0%     = far left
              25%    = left supporting
              50%    = center
              75%    = right supporting
              100%   = far right
            */
            const slotPosition =
              `${index * 25}%`;

            return (
              <motion.button
                key={model.id}
                layout
                transition={{
                  layout: {
                    type: "spring",
                    stiffness: 240,
                    damping: 28,
                  },
                }}
                type="button"
                onClick={() =>
                  handleSelect(model.id)
                }
                aria-label={`Show ${model.name}`}
                aria-pressed={isSelected}
                className={`
                  absolute
                  bottom-0

                  flex
                  items-end
                  justify-center

                  border-0
                  bg-transparent
                  p-0

                  ${isSelected
                    ? "cursor-default"
                    : "cursor-pointer"
                  }
                `}
                style={{
                  left: slotPosition,

                  /*
                    The button itself is centered
                    on its slot.
                  */
                  transform:
                    "translateX(-50%)",

                  /*
                    Prevent the button from becoming
                    a huge full-width element.
                  */
                  width: "auto",

                  minWidth: "0",

                  marginLeft:
                    NEGATIVE_OVERLAP,
                  marginRight:
                    NEGATIVE_OVERLAP,
                }}
              >
                {/* =================================================
                    SELECTED MODEL TITLE
                    ================================================= */}

                {isSelected && (
                  <motion.h1
                    layoutId="hero-name"
                    transition={{
                      layout: {
                        duration: 0.55,
                        ease: [
                          0.4,
                          0,
                          0.2,
                          1,
                        ],
                      },
                    }}
                    className="
                      absolute

                      left-1/2
                      -translate-x-1/2

                      z-0

                      font-['Raleway']
                      font-bold

                      tracking-[-0.07em]

                      text-[clamp(3rem,5vw,6rem)]

                      leading-[1.18]

                      text-[var(--maroon-dark)]

                      select-none
                      whitespace-nowrap

                      pointer-events-none
                    "
                    style={{
                      bottom:
                        "calc(100% - 1rem)",
                    }}
                  >
                    {model.name.toUpperCase()}
                  </motion.h1>
                )}

                {/* =================================================
                    PODIUM

                    IMPORTANT:
                    Podium belongs to the CENTER SLOT.
                    It does NOT travel independently to a
                    clicked model.
                    ================================================= */}

                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={{
                      layout: {
                        duration: 0.55,
                        ease: [
                          0.4,
                          0,
                          0.2,
                          1,
                        ],
                      },
                    }}
                    aria-hidden="true"
                    className="
                      absolute

                      left-1/2
                      -translate-x-1/2

                      z-0

                      w-[clamp(10rem,14vw,15.24rem)]

                      aspect-[243.81/116.05]

                      pointer-events-none
                    "
                    style={{
                      bottom:
                        "-7.5%",
                    }}
                  >
                    {/* Spotlight */}
                    <div
                      className="
                        absolute
                        inset-0
                        -z-10
                      "
                      style={{
                        background:
                          "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(76,5,25,0.28), rgba(76,5,25,0.06) 60%, transparent 80%)",

                        filter:
                          "blur(6px)",
                      }}
                    />

                    {/* Base podium */}
                    <svg
                      viewBox={
                        PODIUM_VIEWBOX
                      }
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
                        (
                          ring,
                          ringIndex
                        ) => (
                          <ellipse
                            key={
                              ringIndex
                            }
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

                    {/* Animated ring */}
                    <svg
                      viewBox={
                        PODIUM_VIEWBOX
                      }
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
                            PODIUM_RINGS[0]
                              .cx -
                            PODIUM_RINGS[0]
                              .rx *
                              1.4
                          }
                          y1={
                            PODIUM_RINGS[0]
                              .cy
                          }
                          x2={
                            PODIUM_RINGS[0]
                              .cx +
                            PODIUM_RINGS[0]
                              .rx *
                              1.4
                          }
                          y2={
                            PODIUM_RINGS[0]
                              .cy
                          }
                        >
                          {COMET_STOPS.map(
                            (
                              stop,
                              stopIndex
                            ) => (
                              <stop
                                key={
                                  stopIndex
                                }
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
                            <feMergeNode
                              in="blur"
                            />

                            <feMergeNode
                              in="SourceGraphic"
                            />
                          </feMerge>
                        </filter>
                      </defs>

                      {PODIUM_RINGS.map(
                        (
                          ring,
                          ringIndex
                        ) => (
                          <ellipse
                            key={
                              ringIndex
                            }
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

                    THIS IS THE IMPORTANT FIX.

                    Supporting models:
                    same height

                    Selected model:
                    larger height

                    Width:
                    ALWAYS AUTO

                    Therefore:
                    NO STRETCHING.
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
                      : side *
                        SIDE_TILT_DEGREES,

                    opacity: isSelected
                      ? 1
                      : SIDE_MODEL_OPACITY,

                    scale: isSelected
                      ? 1
                      : 1,
                  }}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 240,
                      damping: 28,
                    },

                    rotateY: {
                      type: "spring",
                      stiffness: 240,
                      damping: 28,
                    },

                    opacity: {
                      type: "spring",
                      stiffness: 240,
                      damping: 28,
                    },
                  }}
                  style={{
                    /*
                      SELECTED = larger
                      SUPPORTING = same size
                    */
                    height: isSelected
                      ? SELECTED_MODEL_HEIGHT
                      : SIDE_MODEL_HEIGHT,

                    /*
                      CRITICAL:
                      Never force width.
                    */
                    width: "auto",

                    /*
                      Never crop the PNG.
                    */
                    objectFit:
                      "contain",

                    /*
                      Never let the image stretch.
                    */
                    objectPosition:
                      "center bottom",

                    /*
                      The model should pivot
                      naturally from the feet.
                    */
                    transformOrigin:
                      "50% 100%",

                    maxWidth:
                      "none",

                    display: "block",
                  }}
                  className="
                    relative
                    z-10
                    shrink-0
                  "
                />

                {/* =================================================
                    CENTER PRODUCT INFO

                    This stays underneath whichever model is
                    currently occupying the center slot.
                    ================================================= */}

                {isSelected && (
                  <motion.div
                    layoutId="hero-price"
                    transition={{
                      layout: {
                        duration: 0.55,
                        ease: [
                          0.4,
                          0,
                          0.2,
                          1,
                        ],
                      },
                    }}
                    className="
                      absolute

                      left-1/2
                      -translate-x-1/2

                      top-full

                      z-20

                      w-[clamp(11rem,18.75vw,22.5rem)]

                      flex
                      items-center
                      justify-between

                      text-xl
                    "
                    style={{
                      marginTop:
                        PRICE_TOP_OFFSET,
                    }}
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