/*
  Changes made in this pass:

  1. OVERLAP FIX (gap looks huge): added NEGATIVE_OVERLAP — each
     image gets a horizontal negative margin so it visually eats
     into the flex gap, replicating Figma's overhanging-image trick
     without needing new image crops. Tune this constant to taste.
     (The fuller fix is cropping the source PNGs tighter to the
     garment so they naturally overhang like the Figma exports did —
     worth doing later, but this gets you visually correct now.)

  2. POSITION SWAP: state is now an ordered array of ids (`order`),
     not a separate `selectedId`. Clicking a model swaps its position
     with whatever is currently in the center slot — nothing else
     moves. `motion.button` now carries `layout`, so Framer animates
     the position change automatically when `order` changes (same
     keys, new DOM order = FLIP position animation, no manual math).

  3. MORE "SELECTED" PODIUM: base ring opacity raised, comet stroke
     is now thicker + has an SVG blur filter for actual glow bloom,
     and a soft dark radial "spotlight floor" sits behind the ring
     only when selected — pulling in the black/vignette vibe from
     the reference image. All new knobs are constants up top.
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

// NEW — how much each image overlaps into the gap on either side.
// Negative margin in rem, scales like everything else. Start around
// 2-3rem and nudge until the row reads as tight as the Figma comp.
const NEGATIVE_OVERLAP = "2.5rem";

const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

const SELECT_SPRING = { type: "spring", stiffness: 240, damping: 28 };

const MOVE_TRANSITION = {
  layout: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
  opacity: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
};

const PODIUM_SPIN_START =
  typeof performance !== "undefined" ? performance.now() : 0;

const MODELS = [
  { id: "model2", name: "Coral", price: 70000, image: model2 },
  { id: "model6", name: "Amber", price: 70000, image: model6 },
  { id: "reina", name: "Reina", price: 70000, image: heroCenter },
  { id: "model5", name: "Sienna", price: 70000, image: model5 },
  { id: "model3", name: "Marina", price: 70000, image: model3 },
];

const CENTER_INDEX = 2; // "Reina" starts in the middle

const IMAGE_HEIGHT_SELECTED = "h-[clamp(11rem,31.40625vw,37.6875rem)]";
const IMAGE_HEIGHT_UNSELECTED = "h-[clamp(9rem,27.8125vw,33.375rem)]";

const PODIUM_VIEWBOX = "0 0 243.81 116.05";
const PODIUM_RINGS = [
  { cx: 121.9, cy: 59.94, rx: 121.9, ry: 56.11 },
  { cx: 121.9, cy: 59.99, rx: 110.45, ry: 50.83 },
  { cx: 124.34, cy: 50.83, rx: 110.45, ry: 50.83 },
];

const PODIUM_STROKE_WIDTH = 2.5;
const PODIUM_DASH_LENGTH = 4;
const PODIUM_DASH_GAP = 3;
const PODIUM_DASH = `${PODIUM_DASH_LENGTH} ${PODIUM_DASH_GAP}`;

// NEW — base ring is more visible now (was 0.3 opacity class below)
const BASE_RING_OPACITY = 0.45;

// NEW — comet is thicker than the base ring and gets a blur filter,
// so the "selected" spin actually glows instead of just brightening
// a thin dash.
const COMET_STROKE_WIDTH = 4.5;
const COMET_GLOW_BLUR = 2.2; // stdDeviation, px in viewBox units

const COMET_BAND_WIDTH = 55; // was 32 — wider, more obviously "on"
const COMET_STOPS = [
  { offset: "0%", opacity: 0 },
  { offset: `${50 - COMET_BAND_WIDTH / 2}%`, opacity: 0 },
  { offset: "50%", opacity: 1 },
  { offset: `${50 + COMET_BAND_WIDTH / 2}%`, opacity: 0 },
  { offset: "100%", opacity: 0 },
];

function getPodiumAnimationDelay() {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  const elapsedSeconds = (now - PODIUM_SPIN_START) / 1000;
  const phase = elapsedSeconds % SPIN_DURATION_SECONDS;
  return `-${phase.toFixed(3)}s`;
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export default function Hero() {
  // Ordered list of ids, left → right. Swapping happens here, not
  // via a separate selectedId — whoever sits at CENTER_INDEX is the
  // selected/hero model.
  const [order, setOrder] = useState(MODELS.map((m) => m.id));
  const modelsById = Object.fromEntries(MODELS.map((m) => [m.id, m]));

  function handleSelect(id) {
    setOrder((prev) => {
      const centerId = prev[CENTER_INDEX];
      if (id === centerId) return prev;
      const clickedIndex = prev.indexOf(id);
      const next = [...prev];
      next[CENTER_INDEX] = id;
      next[clickedIndex] = centerId;
      return next;
    });
  }

  return (
    <section
      className="pt-10 md:pt-16 pb-24 md:pb-40 text-center"
      style={{ perspective: "1800px" }}
    >
      <div className={`relative mx-auto ${PAGE_CONTAINER_PADDING}`}>
        <div className="flex items-end justify-between w-full">
          {order.map((id, index) => {
            const model = modelsById[id];
            const isSelected = index === CENTER_INDEX;
            const isOuter = index === 0 || index === order.length - 1;
            const side = index < CENTER_INDEX ? -1 : 1;

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
                  marginLeft: NEGATIVE_OVERLAP,
                  marginRight: NEGATIVE_OVERLAP,
                }}
                className={`
                  relative shrink-0 border-0 bg-transparent p-0
                  ${isSelected ? "cursor-default" : "cursor-pointer"}
                `}
              >
                {isSelected && (
                  <motion.h1
                    layoutId="hero-name"
                    transition={MOVE_TRANSITION}
                    className="absolute left-1/2 -translate-x-1/2 bottom-[87.9%] z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[clamp(2.5rem,5vw,6rem)] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap pointer-events-none"
                  >
                    {model.name.toUpperCase()}
                  </motion.h1>
                )}

                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={MOVE_TRANSITION}
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-7.2%] z-0 w-[clamp(6rem,12.7vw,15.24rem)] aspect-[243.81/116.05] pointer-events-none"
                  >
                    {/* NEW — soft dark "spotlight floor" behind the
                        ring, only while selected. This is the black-
                        vignette vibe from the reference image. */}
                    <div
                      className="absolute inset-0 -z-10"
                      style={{
                        background:
                          "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(76,5,25,0.35), rgba(76,5,25,0.08) 60%, transparent 80%)",
                        filter: "blur(6px)",
                      }}
                    />

                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="absolute inset-0 h-full w-full"
                      style={{ opacity: BASE_RING_OPACITY }}
                      fill="none"
                    >
                      {PODIUM_RINGS.map((ring, i) => (
                        <ellipse
                          key={i}
                          cx={ring.cx}
                          cy={ring.cy}
                          rx={ring.rx}
                          ry={ring.ry}
                          stroke="var(--maroon-dark)"
                          strokeWidth={PODIUM_STROKE_WIDTH}
                          strokeDasharray={PODIUM_DASH}
                          strokeLinecap="round"
                        />
                      ))}
                    </svg>

                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="absolute inset-0 h-full w-full overflow-visible"
                      fill="none"
                    >
                      <defs>
                        <linearGradient
                          id="podium-comet"
                          gradientUnits="userSpaceOnUse"
                          x1={PODIUM_RINGS[0].cx - PODIUM_RINGS[0].rx * 1.4}
                          y1={PODIUM_RINGS[0].cy}
                          x2={PODIUM_RINGS[0].cx + PODIUM_RINGS[0].rx * 1.4}
                          y2={PODIUM_RINGS[0].cy}
                        >
                          {COMET_STOPS.map((stop, i) => (
                            <stop
                              key={i}
                              offset={stop.offset}
                              stopColor="var(--maroon-dark)"
                              stopOpacity={stop.opacity}
                            />
                          ))}
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

                        {/* NEW — glow filter for the comet stroke */}
                        <filter
                          id="podium-glow"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feGaussianBlur
                            stdDeviation={COMET_GLOW_BLUR}
                            result="blur"
                          />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {PODIUM_RINGS.map((ring, i) => (
                        <ellipse
                          key={i}
                          cx={ring.cx}
                          cy={ring.cy}
                          rx={ring.rx}
                          ry={ring.ry}
                          stroke="url(#podium-comet)"
                          strokeWidth={COMET_STROKE_WIDTH}
                          strokeDasharray={PODIUM_DASH}
                          strokeLinecap="round"
                          filter="url(#podium-glow)"
                        />
                      ))}
                    </svg>
                  </motion.div>
                )}

                <motion.img
                  layout
                  src={model.image}
                  alt={isSelected ? model.name : ""}
                  animate={{
                    rotateY: isSelected ? 0 : side * SIDE_TILT_DEGREES,
                    opacity: isSelected ? 1 : SIDE_MODEL_OPACITY,
                  }}
                  transition={{
                    layout: SELECT_SPRING,
                    rotateY: SELECT_SPRING,
                    opacity: SELECT_SPRING,
                  }}
                  style={{ transformOrigin: "50% 100%", maxWidth: "none" }}
                  className={`
                    relative z-10 w-auto shrink-0
                    ${isSelected ? IMAGE_HEIGHT_SELECTED : IMAGE_HEIGHT_UNSELECTED}
                  `}
                />

                {isSelected && (
                  <motion.div
                    layoutId="hero-price"
                    transition={MOVE_TRANSITION}
                    style={{ marginTop: PRICE_TOP_OFFSET }}
                    className="absolute left-1/2 -translate-x-1/2 top-full z-10 w-[clamp(11rem,18.75vw,22.5rem)] flex items-center justify-between text-xl"
                  >
                    <span className="uppercase tracking-wide">{model.name}</span>
                    <span className="font-bold tracking-[-0.04em]">
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