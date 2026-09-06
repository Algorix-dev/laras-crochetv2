/*
  INTERACTIVE VERSION — click any dimmed model to make it the hero.
  Builds on the static rebuild: same slot layout, same podium/name/
  price markup, now driven by selection state + Framer Motion.

  HOW THE THREE EFFECTS WORK
  ------------------------------------------------------------
  1. PODIUM SPIN: the ellipse OUTLINE never moves, rotates, or
     changes shape — it's a real, static SVG <ellipse>, same fixed
     geometry as the original Figma oval, all the time. The "spin"
     is purely the dash pattern sliding along that fixed path via
     `stroke-dashoffset` (the classic SVG "marching ants" technique,
     same idea as a circular progress loader). Because the shape
     itself is never touched, there's no way for it to drift,
     distort, or wander off position — only the dashes travel.

  2. MOVING TO THE CLICKED MODEL: the name, podium, and price are
     each only rendered inside the currently-*selected* slot, but
     they share a `layoutId` across renders. Framer Motion detects
     that the same layoutId un-mounted from one slot and mounted in
     another within the same update, and automatically animates the
     position/size change between the two — that's what makes them
     visually "travel" to the new model instead of popping there.

  3. FACING FRONT / TURNING AWAY: this is the one real compromise.
     These are flat photos with no actual "back" shot, so a true
     180° turn isn't possible (your call, confirmed: simple tilt
     illusion, no back view). Each photo gets a `rotateY` tilt (via
     CSS 3D transform, pivoted at the bottom edge — the feet — via
     transformOrigin) plus a reduced opacity when it's not selected.
     It reads as "turning," but nobody's actual back is ever shown.

  PLACEHOLDER PRODUCT DATA
  ------------------------------------------------------------
  Only "Reina" had a real name + price before — the other 4 were
  purely decorative dimmed photos with no product identity attached.
  Making them selectable means they need a name + price too. The
  values below (Model 2 / Model 6 / etc., ₦70,000 each) are
  placeholders so the interaction works end-to-end right now — swap
  in the real product name + price for each before this ships.
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
const SELECT_SPRING = { type: "spring", stiffness: 240, damping: 28 };

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

/* Podium geometry — reconstructed as true SVG ellipses directly
   from the original Figma percentages (left/top/width/height as %
   of the 243.81 x 116.05 box), so the shape is pixel-identical to
   the original static oval. viewBox uses those same dimensions as
   its coordinate space, so these numbers drop in directly. */
const PODIUM_VIEWBOX = "0 0 243.81 116.05";
const PODIUM_RINGS = [
  { cx: 121.9, cy: 59.94, rx: 121.9, ry: 56.11 },
  { cx: 121.9, cy: 59.99, rx: 110.45, ry: 50.83 },
  { cx: 124.34, cy: 50.83, rx: 110.45, ry: 50.83 },
];

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
      <div className="relative mx-auto px-[clamp(1rem,15.83vw,19rem)]">
        <div className="flex items-end justify-center gap-[clamp(1.5rem,6.667vw,8rem)]">
          {MODELS.map((model, index) => {
            const isSelected = model.id === selectedId;
            const isOuter = index === 0 || index === MODELS.length - 1;
            // Left-side slots tilt one way when deselected, right-side
            // slots tilt the other — based on which side of center they sit.
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
                {/* Name — only exists in the selected slot; layoutId
                    carries the shared-element animation between slots. */}
                {isSelected && (
                  <motion.h1
                    layoutId="hero-name"
                    transition={SELECT_SPRING}
                    className="absolute left-1/2 -translate-x-1/2 bottom-[87.9%] z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[clamp(2.5rem,5vw,6rem)] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap pointer-events-none"
                  >
                    {model.name.toUpperCase()}
                  </motion.h1>
                )}

                {/* Podium — moves to the selected slot via layoutId.
                    The ellipses themselves are a completely static,
                    fixed SVG path; only the dash pattern along each
                    path animates via stroke-dashoffset, so the shape
                    never moves, rotates, or distorts — only the
                    "marks" on it travel around it, like a wheel. */}
                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={{ layout: SELECT_SPRING }}
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
                          strokeDasharray="10 8"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="0"
                            to="-180"
                            dur={`${SPIN_DURATION_SECONDS}s`}
                            repeatCount="indefinite"
                          />
                        </ellipse>
                      ))}
                    </svg>
                  </motion.div>
                )}

                {/* The model photo. transformOrigin pins the pivot at
                    the bottom-center (the feet), so rotateY reads as
                    turning on the spot rather than swinging sideways. */}
                <motion.img
                  src={model.image}
                  alt={isSelected ? model.name : ""}
                  animate={{
                    rotateY: isSelected ? 0 : side * SIDE_TILT_DEGREES,
                    opacity: isSelected ? 1 : 0.3,
                    height: isSelected
                      ? "clamp(11rem,31.40625vw,37.6875rem)"
                      : "clamp(9rem,27.8125vw,33.375rem)",
                  }}
                  transition={SELECT_SPRING}
                  style={{ transformOrigin: "50% 100%", maxWidth: "none" }}
                  className="relative z-10 w-auto shrink-0"
                />

                {/* Price row — same shared-layout treatment as the name. */}
                {isSelected && (
                  <motion.div
                    layoutId="hero-price"
                    transition={SELECT_SPRING}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-6 z-10 w-[clamp(11rem,18.75vw,22.5rem)] flex items-center justify-between text-xl"
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