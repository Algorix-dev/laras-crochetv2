/*
  INTERACTIVE VERSION — click any dimmed model to make it the hero.

  HOW THE KEY EFFECTS WORK
  ------------------------------------------------------------
  1. IMAGE ENLARGE: the img has Framer's `layout` prop, NOT a
     value-tweened height. `layout` makes Framer measure the
     element's real rendered box before and after a re-render and
     animate between those actual pixel measurements (a FLIP
     technique) — it doesn't care what CSS produced those sizes, so
     it's immune to the two failure modes tried earlier: Framer's
     JS interpolator struggling with clamp() strings, and Tailwind
     class-generation issues.

  2. PODIUM SPIN, NO RESTART GLITCH: the dash animation is a CSS
     @keyframes rule (injected once via the <style> tag below), with
     each ellipse's `animationDelay` computed from real elapsed time
     since PODIUM_SPIN_START (captured once, at module load). A
     negative delay tells the browser "act as if this had already
     been running for N seconds" — so however many times the podium
     unmounts and remounts as you switch models, its visual phase
     always matches a single continuous clock, instead of resetting
     to 0 on every remount.

  3. MOVING TO THE CLICKED MODEL: name/podium/price are only
     rendered in the selected slot but share a `layoutId` across
     renders, so Framer animates their position between slots
     automatically — this part was already working correctly.

  4. FACING FRONT / TURNING AWAY: flat photos, no real "back" shot,
     so this stays a rotateY tilt + opacity fade (your call,
     confirmed earlier: simple tilt illusion, no back view).

  PLACEHOLDER PRODUCT DATA
  ------------------------------------------------------------
  Only "Reina" had a real name + price before. The rest (Model 2,
  Model 6, etc. at ₦70,000) are placeholders — swap in the real
  product name + price per model before this ships.
*/

import { useState } from "react";
import { motion } from "framer-motion";

import model2 from "../assets/model-images/model2-swuvvw.png";
import model3 from "../assets/model-images/model3-kj37u6.png";
import model5 from "../assets/model-images/model5-yyuymy.png";
import model6 from "../assets/model-images/model6-3lo3ls.png";
import heroCenter from "../assets/reina-front.png";

/* ============================================================
   EASY TUNING
   ============================================================ */
const SPIN_DURATION_SECONDS = 6;    // time for the dash pattern to loop once
const SIDE_TILT_DEGREES = 28;       // how far unselected models rotateY away
const PRICE_TOP_OFFSET = "2.25rem"; // was 1.5rem (mt-6) — a bit lower now

const SELECT_SPRING = { type: "spring", stiffness: 240, damping: 28 };

// Podium/name/price — layout (position/size) and opacity share the
// same timing so the fade and the move finish together.
const MOVE_TRANSITION = {
  layout: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
  opacity: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
};

// Real-world reference point for the podium's animation phase — see
// PODIUM SPIN note above. Captured once when the module first loads.
const PODIUM_SPIN_START =
  typeof performance !== "undefined" ? performance.now() : 0;

/* Order matches the original slot order left → right. Swap in real
   product name/price per model — see note above. */
const MODELS = [
  { id: "model2", name: "Model 2", price: 70000, image: model2 },
  { id: "model6", name: "Model 6", price: 70000, image: model6 },
  { id: "reina", name: "Reina", price: 70000, image: heroCenter },
  { id: "model5", name: "Model 5", price: 70000, image: model5 },
  { id: "model3", name: "Model 3", price: 70000, image: model3 },
];

const DEFAULT_SELECTED_INDEX = 2; // "Reina" — matches the original static layout

const IMAGE_HEIGHT_SELECTED = "h-[clamp(11rem,31.40625vw,37.6875rem)]";
const IMAGE_HEIGHT_UNSELECTED = "h-[clamp(9rem,27.8125vw,33.375rem)]";

/* Podium geometry — true SVG ellipses matching the original Figma
   percentages of the 243.81 x 116.05 box. */
const PODIUM_VIEWBOX = "0 0 243.81 116.05";
const PODIUM_RINGS = [
  { cx: 121.9, cy: 59.94, rx: 121.9, ry: 56.11 },
  { cx: 121.9, cy: 59.99, rx: 110.45, ry: 50.83 },
  { cx: 124.34, cy: 50.83, rx: 110.45, ry: 50.83 },
];
const PODIUM_DASH = "10 8"; // dash length, gap length
const PODIUM_LOOP_DISTANCE = 180; // must stay a clean multiple of 10+8

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
  const [selectedId, setSelectedId] = useState(MODELS[DEFAULT_SELECTED_INDEX].id);

  return (
    <section
      className="pt-10 md:pt-16 pb-16 text-center"
      style={{ perspective: "1800px" }}
    >
      {/* One-time keyframes definition for the podium's continuous
          spin. Kept as a plain CSS animation (not SMIL) so it can be
          phase-synced via animationDelay — see getPodiumAnimationDelay. */}
      <style>{`
        @keyframes podium-spin {
          to { stroke-dashoffset: -${PODIUM_LOOP_DISTANCE}; }
        }
      `}</style>

      <div className="relative mx-auto px-[clamp(1rem,15.83vw,19rem)]">
        <div className="flex items-end justify-center gap-[clamp(1.5rem,6.667vw,8rem)]">
          {MODELS.map((model, index) => {
            const isSelected = model.id === selectedId;
            const isOuter = index === 0 || index === MODELS.length - 1;
            const side = index < DEFAULT_SELECTED_INDEX ? -1 : 1;

            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedId(model.id)}
                aria-label={`Show ${model.name}`}
                aria-pressed={isSelected}
                className={`
                  relative shrink-0 border-0 bg-transparent p-0
                  ${isOuter ? "hidden md:block" : ""}
                  ${isSelected ? "cursor-default" : "cursor-pointer"}
                `}
              >
                {/* Name — z-0, behind the image (z-10), which is what
                    makes it sit "behind the head." Positioned as a
                    percentage of this button's real height, which now
                    reliably matches the image's actual rendered size
                    because the image uses `layout` (see below), not a
                    tweened value. */}
                {isSelected && (
                  <motion.h1
                    layoutId="hero-name"
                    transition={MOVE_TRANSITION}
                    className="absolute left-1/2 -translate-x-1/2 bottom-[87.9%] z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[clamp(2.5rem,5vw,6rem)] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap pointer-events-none"
                  >
                    {model.name.toUpperCase()}
                  </motion.h1>
                )}

                {/* Podium — moves to the selected slot via layoutId.
                    Each ellipse's dash pattern runs on a real-time-
                    synced CSS animation, so remounting here on slot
                    change never resets the visible phase. */}
                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={MOVE_TRANSITION}
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-7.2%] z-0 w-[clamp(9rem,12.7vw,15.24rem)] aspect-[243.81/116.05] opacity-30 pointer-events-none"
                  >
                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="h-full w-full"
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
                          strokeWidth="2"
                          strokeDasharray={PODIUM_DASH}
                          style={{
                            animation: `podium-spin ${SPIN_DURATION_SECONDS}s linear infinite`,
                            animationDelay: getPodiumAnimationDelay(),
                          }}
                        />
                      ))}
                    </svg>
                  </motion.div>
                )}

                {/* The model photo. `layout` makes Framer measure and
                    smoothly animate the actual size change between
                    the two height classes — no value tweening, so
                    this can't silently fail the way a CSS-transition
                    or string-interpolated height could. rotateY/
                    opacity are plain numbers, animated as before. */}
                <motion.img
                  layout
                  src={model.image}
                  alt={isSelected ? model.name : ""}
                  animate={{
                    rotateY: isSelected ? 0 : side * SIDE_TILT_DEGREES,
                    opacity: isSelected ? 1 : 0.3,
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

                {/* Price row — same shared-layout treatment as the
                    name, nudged lower via PRICE_TOP_OFFSET. */}
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
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}