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

  2. PODIUM SPIN, NO RESTART GLITCH: the ring is drawn as dense
     dashed ellipses (matching the tick-mark border from Figma), NOT
     a single dashed line — that texture has to stay intact. A
     second, identical set of dashed ellipses sits on top, stroked
     with a rotating gradient instead of a flat color, so its ticks
     swing from bright to fully transparent as the gradient sweeps
     past — that's what makes the ring dim smoothly into the
     background instead of switching straight from drawn to gap. The
     rotation is SMIL (<animateTransform>), with `begin` computed
     from real elapsed time since PODIUM_SPIN_START (captured once,
     at module load). A negative begin tells the browser "act as if
     this had already been running for N seconds" — so however many
     times the podium unmounts and remounts as you switch models, its
     visual phase always matches a single continuous clock, instead
     of resetting to 0 on every remount.

  3. MOVING TO THE CLICKED MODEL: name/podium/price are only
     rendered in the selected slot but share a `layoutId` across
     renders, so Framer animates their position between slots
     automatically — this part was already working correctly.

  4. FACING FRONT / TURNING AWAY: flat photos, no real "back" shot,
     so this stays a rotateY tilt + opacity fade (your call,
     confirmed earlier: simple tilt illusion, no back view).

  TIP — WHY THE SIDE MODELS LOOKED STRETCHED BEFORE:
  The <img> itself was never doing the stretching (it's `w-auto`
  next to a fixed height, so it always respects whatever aspect
  ratio the source file has) — the OLD source PNGs
  (model2-swuvvw.png etc.) were themselves distorted/elongated
  renders. Swapped in the 4 correctly-proportioned photos (native
  ~848x1253, a normal body-photo ratio) — see MODELS below. Drop the
  new files at src/assets/model-images/model-coral.png,
  model-amber.png, model-sienna.png, model-marina.png (same folder
  as before). I matched upload order to slot order left-to-right
  (Coral, Amber, [center] Reina, Sienna, Marina) — flag it if any
  name/photo pairing is wrong and I'll swap the mapping, not the
  images.

  TIP — SIDE MODEL OPACITY:
  Was hardcoded to 0.3 (matches the Figma spec's `opacity: 0.3` for
  the dimmed side models exactly), but that read as too faint once
  rendered. Pulled into SIDE_MODEL_OPACITY below so it's a one-line
  tweak — bumped to 0.55. Nudge this constant up/down to taste.

  PLACEHOLDER PRODUCT DATA
  ------------------------------------------------------------
  Only "Reina" had a real name + price before. The rest (Coral,
  Amber, etc. at ₦70,000) are placeholders — swap in the real
  product name + price per model before this ships.
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
const SPIN_DURATION_SECONDS = 6;    // time for the podium ring to complete one spin
const SIDE_TILT_DEGREES = 28;       // how far unselected models rotateY away
const PRICE_TOP_OFFSET = "2.25rem"; // was 1.5rem (mt-6) — a bit lower now
const SIDE_MODEL_OPACITY = 0.55;    // was 0.3 (exact Figma value) — bumped up, see TIP above

// TIP — SHARED PAGE MARGIN: 304px at a 1920px frame = 15.83%. Every
// homepage section should use this exact class so all their content
// edges land on the same vertical line down the page. Keep this in
// sync with Navbar.jsx / ProductGrid.jsx / LaraShowcase.jsx / Footer.jsx.
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

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
  { id: "model2", name: "Coral", price: 70000, image: model2 },
  { id: "model6", name: "Amber", price: 70000, image: model6 },
  { id: "reina", name: "Reina", price: 70000, image: heroCenter },
  { id: "model3", name: "Marina", price: 70000, image: model3 },
  { id: "model5", name: "Sienna", price: 70000, image: model5 },
];

const DEFAULT_SELECTED_INDEX = 2; // "Reina" — matches the original static layout

const IMAGE_HEIGHT_SELECTED = "h-[clamp(11rem,31.40625vw,37.6875rem)]";
const IMAGE_HEIGHT_UNSELECTED = "h-[clamp(9rem,27.8125vw,33.375rem)]";

/* Podium geometry — matches the original Figma ellipse percentages
   of a 243.81 x 116.05 box. cx/cy/rx/ry are in that box's own units
   (NOT pixels) — TIP: nudge these to reshape a ring. */
const PODIUM_VIEWBOX = "0 0 243.81 116.05";
const PODIUM_BOX_WIDTH = 243.81;
const PODIUM_BOX_HEIGHT = 116.05;
const PODIUM_RINGS = [
  { cx: 121.9, cy: 59.94, rx: 121.9, ry: 56.11 },
  { cx: 121.9, cy: 59.99, rx: 110.45, ry: 50.83 },
  { cx: 124.34, cy: 50.83, rx: 110.45, ry: 50.83 },
];

// TIP: this is the tick-mark texture itself — match these against
// the Figma spec if the density/thickness looks off. Everything is
// in the same 243.81-wide viewBox units as PODIUM_RINGS above, so
// they scale together automatically at any screen size.
const PODIUM_STROKE_WIDTH = 2.5;  // how thick each tick is
const PODIUM_DASH_LENGTH = 4;     // how long each tick is
const PODIUM_DASH_GAP = 3;        // how much empty space between ticks
const PODIUM_DASH = `${PODIUM_DASH_LENGTH} ${PODIUM_DASH_GAP}`;

// TIP: the "comet" is a gradient line, rotated through the ring's
// center, painted on a second copy of the same dashed ellipses. Its
// bright stop sits at 50% (dead center) and fades to transparent
// toward both ends, so as it spins it lights up two ticks 180°
// apart and lets them fade back out — a soft, gradual dim rather
// than a hard on/off. COMET_BAND_WIDTH is in gradient-percent: a
// bigger number = a wider, lazier fade; smaller = a tighter, snappier
// flash.
const COMET_BAND_WIDTH = 32;
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
  const [selectedId, setSelectedId] = useState(MODELS[DEFAULT_SELECTED_INDEX].id);

  return (
    <section
      className="pt-10 md:pt-16 pb-24 md:pb-40 text-center"
      style={{ perspective: "1800px" }}
    >
      {/* No CSS @keyframes needed here — the spin is driven by SMIL
          (<animateTransform> inside the podium SVG below), which can
          take a negative `begin` directly for the same "no restart
          glitch" trick the CSS version used with animationDelay. */}

      <div className={`relative mx-auto ${PAGE_CONTAINER_PADDING}`}>
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
                    Two stacked SVGs sharing the exact same dashed
                    ellipses: the bottom one is the always-visible
                    dim tick-mark ring (this is the part that has to
                    keep matching Figma), the top one is an identical
                    copy stroked with a rotating gradient instead of
                    a flat color, so its ticks glow bright then fade
                    back to nothing as the gradient sweeps past —
                    smooth dimming, not a hard on/off switch.
                    Remounting here on slot change never resets the
                    visible phase (see file header note). */}
                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={MOVE_TRANSITION}
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-7.2%] z-0 w-[clamp(6rem,12.7vw,15.24rem)] aspect-[243.81/116.05] pointer-events-none"
                  >
                    {/* Base ring — always-on, dim, matches Figma. */}
                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="absolute inset-0 h-full w-full opacity-30"
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

                    {/* Comet overlay — same dashes, gradient stroke. */}
                    <svg
                      viewBox={PODIUM_VIEWBOX}
                      className="absolute inset-0 h-full w-full"
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
                      </defs>
                      {PODIUM_RINGS.map((ring, i) => (
                        <ellipse
                          key={i}
                          cx={ring.cx}
                          cy={ring.cy}
                          rx={ring.rx}
                          ry={ring.ry}
                          stroke="url(#podium-comet)"
                          strokeWidth={PODIUM_STROKE_WIDTH}
                          strokeDasharray={PODIUM_DASH}
                          strokeLinecap="round"
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
                    opacity are plain numbers, animated as before.
                    Aspect ratio always comes from the source file
                    (w-auto) — never forced/stretched — so once a
                    correctly-proportioned image is dropped in, it
                    just renders correctly. */}
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
