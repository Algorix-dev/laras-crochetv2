/*
  INTERACTIVE VERSION — click any dimmed model to make it the hero.
  Builds on the static rebuild: same slot layout, same podium/name/
  price markup, now driven by selection state + Framer Motion.

  HOW THE THREE EFFECTS WORK
  ------------------------------------------------------------
  1. PODIUM SPIN: two nested 3D transforms instead of one flat
     rotate. An outer wrapper applies a STATIC rotateX tilt to real
     circles — that's what actually creates the ellipse look, as a
     true 3D projection rather than a pre-squashed oval shape, so
     the silhouette never changes shape as it spins. An inner
     wrapper then animates rotateY infinitely — nested inside the
     tilted wrapper (with preserve-3d passed down), so the dashes
     travel around inside that fixed ellipse outline instead of the
     outline itself swinging around like a stretched oval would.

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
const SPIN_DURATION_SECONDS = 9;    // one full podium rotation
const PODIUM_TILT_DEGREES = 61.6;   // matches the original 243.81/116.05 oval ratio
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
                    Two nested 3D transforms create the spin: a static
                    rotateX tilt on real circles (giving the fixed
                    ellipse silhouette), and an inner rotateY spin that
                    animates the dashes around inside that silhouette. */}
                {isSelected && (
                  <motion.div
                    layoutId="hero-podium"
                    transition={{ layout: SELECT_SPRING }}
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 bottom-[-7.2%] z-0 aspect-square w-[clamp(9rem,12.7vw,15.24rem)] opacity-30 pointer-events-none"
                  >
                    <div
                      className="relative h-full w-full"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${PODIUM_TILT_DEGREES}deg)`,
                        transformOrigin: "50% 100%",
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        animate={{ rotateY: 360 }}
                        transition={{
                          repeat: Infinity,
                          ease: "linear",
                          duration: SPIN_DURATION_SECONDS,
                        }}
                      >
                        <span
                          className="absolute rounded-full border-[var(--maroon-dark)]"
                          style={{ left: "0%", top: "3.3%", width: "100%", height: "96.7%", borderStyle: "dashed", borderWidth: "clamp(1px, 0.26vw, 5px)" }}
                        />
                        <span
                          className="absolute rounded-full border-[var(--maroon-dark)]"
                          style={{ left: "4.7%", top: "7.9%", width: "90.6%", height: "87.6%", borderStyle: "dashed", borderWidth: "clamp(1px, 0.26vw, 5px)" }}
                        />
                        <span
                          className="absolute rounded-full border-[var(--maroon-dark)]"
                          style={{ left: "5.7%", top: "0%", width: "90.6%", height: "87.6%", borderStyle: "dashed", borderWidth: "clamp(1px, 0.26vw, 5px)" }}
                        />
                      </motion.div>
                    </div>
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