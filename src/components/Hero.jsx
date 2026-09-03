import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import ShareButton from "./ShareButton";
import MoreOptionsMenu from "./MoreOptionsMenu";

/*
  TIP: FIXED SLOTS, NOT A CAROUSEL.
  ----------------------------------
  The 5 garments stay in their own slots always — clicking one only
  changes which slot counts as "selected." The selected slot's photo
  faces front, gets full color, and is a little taller than the rest
  (see the height classes below — a small bump, not a big jump).
  ONLY the selected slot ever gets the enlarged/full-color treatment —
  every other slot is always rendered at the same small, dimmed size
  regardless of which one was previously selected.

  Every other slot dims using opacity (30%, per the Figma spec) and
  "looks away" using the angleImage (a real 3/4-turned photo — see
  products.js), mirrored with scaleX(-1) on whichever side needs to
  face the opposite way. Only Reina has that second photo right now;
  the other 4 pieces are placeholders with just one image, so they
  stay as plain dimmed front photos until real 3/4-angle shots exist
  for them too.

  All photos share the same HEIGHT (not width) so they line up like
  people standing at the same height regardless of each photo's own
  aspect ratio — width is left automatic per photo. (Figma's export
  fixes each slot at a flat 173.14px width instead — flagged this as
  a decision to confirm rather than silently switching it.)

  THE NAME IS A PERSISTENT ELEMENT THAT SLIDES TO THE SELECTED SLOT.
  There's a single <h1>, rendered once outside the slot loop, and a
  small effect below measures the selected slot's actual on-screen
  position (via refs) and animates the name over to it with `x` —
  this is the "name transfers to the selected item" behavior.

  THE PODIUM RING IS NOW STAGNANT (kept centered, doesn't slide) AND
  BUILT FROM LITERAL CSS, matching Figma's actual layer structure
  (Group 29 → Ellipse 24/25/26, three dashed ellipses of slightly
  different size stacked with a small offset, not one image asset).
  It no longer reads markerX, and no longer uses Framer Motion at all
  — it's a plain CSS `@keyframes` rotation (see the <style> block
  below), the same technique as a CSS conic-gradient loader: the
  whole 3-ellipse cluster spins together, continuously, at a fixed
  center. If you want it to follow the selected slot again later,
  swap the plain CSS transform back for a motion.div with the same
  `x: calc(-50% + markerX px)` key the name uses below.
*/

// Figma's Group 29 (243.81 × 116.05) contains 3 dashed ellipses at
// slightly different sizes/offsets — this is what creates the
// hand-drawn, slightly-wobbly "circled" look instead of one clean
// ring. Values below are each ellipse's box as a % of the group's
// own bounding box, so they scale with the container at any size.
const PODIUM_ELLIPSES = [
  { left: "0%", top: "3.3%", width: "100%", height: "96.7%" },
  { left: "4.7%", top: "7.9%", width: "90.6%", height: "87.6%" },
  { left: "5.7%", top: "0%", width: "90.6%", height: "87.6%" },
];
export default function Hero({ models }) {
  const [selectedId, setSelectedId] = useState(models[0]?.id);
  const selectedSlot = models.findIndex((m) => m.id === selectedId);
  const selected = models[selectedSlot];
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  // TIP: rowRef = the flex row of photos. slotRefs = one ref per model,
  // collected via the callback ref below on each slot's div. Every time
  // selectedId changes (or the window resizes, since the row is
  // responsive), this measures where the selected slot actually sits on
  // screen relative to the row's own center, and stores that as
  // markerX — the horizontal distance the NAME needs to shift by.
  // (The podium no longer uses this value — see TIP above.)
  const rowRef = useRef(null);
  const containerRef = useRef(null);
  const slotRefs = useRef({});
  const [markerX, setMarkerX] = useState(0);
  const [nameTop, setNameTop] = useState(0);

  useEffect(() => {
    function measure() {
      const row = rowRef.current;
      const container = containerRef.current;
      const slotEl = slotRefs.current[selectedId];
      if (!row || !container || !slotEl) return;
      const rowRect = row.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      const rowCenter = rowRect.left + rowRect.width / 2;
      const slotCenter = slotRect.left + slotRect.width / 2;
      setMarkerX(slotCenter - rowCenter);
      // Name sits a small gap above whichever image is selected —
      // measured off the actual slot, not a per-model magic number,
      // so it's always at "head level" no matter which piece or
      // breakpoint. Gap scales with the image's own height.
      setNameTop(slotRect.top - containerRect.top - slotRect.height * 0.14);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [selectedId]);

  return (
    <section className="pt-10 md:pt-16 pb-10 text-center px-5">
      <div ref={containerRef} className="relative max-w-5xl mx-auto">
        {/* Gap widened to roughly match Figma's 128px : 173.14px
            (gap : model-width) ratio, scaled down for our smaller
            photo sizes at each breakpoint. */}
        <div ref={rowRef} className="flex items-end justify-center gap-10 sm:gap-12 md:gap-14">
          {models.map((model, slot) => {
            const isSelected = model.id === selectedId;
            const distance = Math.abs(slot - selectedSlot);
            const responsiveClass = distance >= 2 ? "hidden md:block" : "";
            // TIP: reina-three-quarter.png (angleImage) is shot turned to
            // ITS OWN left — that's a fact about the photo, not a CSS
            // choice, so check it before changing this logic (view it in
            // src/assets/ if you're unsure). Slots to the LEFT of the
            // selected one need to face further left (away) → show that
            // photo as-is. Slots to the RIGHT need to face right (away)
            // → mirror it with scaleX(-1). The selected slot always shows
            // the plain front photo, never mirrored.
            // Models without an angleImage (the 4 placeholder pieces —
            // only Reina has real multi-angle photography right now)
            // fall back to their single front photo with no mirror at
            // all, since mirroring a straight-on photo doesn't read as
            // "looking away" — ask Lara for a 3/4-angle shot per piece
            // to get the same effect on those once real photos exist.
            const shouldMirror = !isSelected && !!model.angleImage && slot > selectedSlot;
            const displayImage = isSelected ? model.image : (model.angleImage ?? model.image);

            return (
              <div
                key={model.id}
                ref={(el) => (slotRefs.current[model.id] = el)}
                className={`relative ${responsiveClass}`}
              >
                <motion.img
                  layout
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(model.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(model.id);
                    }
                  }}
                  aria-label={`View ${model.placeholder ? "this piece" : model.name}`}
                  aria-current={isSelected}
                  src={displayImage}
                  alt={model.placeholder ? "Lara's Crochet piece" : model.name}
                  transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                  style={shouldMirror ? { transform: "scaleX(-1)" } : {}}
                  // TIP: HEIGHT is fixed here, not width — width is left
                  // automatic so each photo keeps its own aspect ratio but
                  // all photos still stand at the same height, like people
                  // side by side. The selected one is only ~15% taller
                  // (h-64 vs h-56 at md, etc.) — a small step up, not a
                  // big jump — since "items-end" on the row keeps every
                  // photo's feet on the same ground line either way.
                  // ONLY isSelected gets the enlarged/full-opacity classes —
                  // every other slot always gets the small/30%-opacity ones,
                  // no matter which slot was selected before.
                  className={`relative z-10 w-auto cursor-pointer focus-visible:outline-none transition-[opacity,filter,height] duration-500 ${
                    isSelected
                      ? "h-56 sm:h-64 md:h-72 opacity-100"
                      : "h-48 sm:h-56 md:h-64 opacity-30"
                  }`}
                />

                {isSelected && (
                  <div className="absolute -right-6 sm:-right-7 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2">
                    <button
                      aria-label="Toggle wishlist"
                      aria-pressed={isInWishlist(model.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(model.id);
                      }}
                      className="hover:text-[var(--maroon)]"
                    >
                      <Heart size={17} strokeWidth={1.5} fill={isInWishlist(model.id) ? "currentColor" : "none"} />
                    </button>
                    <ShareButton product={model} className="hover:text-[var(--maroon)]" />
                    <MoreOptionsMenu product={model} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Name — sits BEHIND the photos (z-0), one persistent element
            that slides to sit over whichever slot is selected (via
            markerX) and sits at a fixed gap above that slot's own top
            edge (via nameTop, measured live — see the effect above),
            so it reads at "head level" for every model, not just the
            one a hardcoded number happened to be tuned for. */}
        <motion.h1
          animate={{ x: `calc(-50% + ${markerX}px)`, top: nameTop }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          // TIP: font/color/tracking pulled straight from the Figma
          // dev-mode CSS for this element — Raleway 700, -0.07em
          // tracking, Rose/900 (#4C0519 = var(--maroon-dark)) at
          // 96px on the 1920px desktop frame. The rem sizes below
          // scale that down for mobile/tablet the same way the
          // rest of this component already scales responsively —
          // change the text-[…] values if you want it bigger/smaller
          // at a given breakpoint.
          className="absolute left-1/2 z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap"
        >
          {selected.name.toUpperCase()}
        </motion.h1>

        {/* Podium — STAGNANT: stays centered under the row instead of
            sliding to whichever slot is selected, and is now literal
            CSS (3 dashed ellipses, see PODIUM_ELLIPSES above) instead
            of an image asset. `.podium-spin` (defined in the <style>
            block below) rotates the whole cluster continuously — same
            "to { rotate(1turn) }" technique as a CSS loader, just at a
            slower 14s pace to match the original spin speed. */}
        <div
          aria-hidden="true"
          className="podium-spin absolute left-1/2 bottom-4 z-0 w-28 sm:w-32 md:w-40 aspect-[243.81/116.05] pointer-events-none"
        >
          {PODIUM_ELLIPSES.map((e, i) => (
            <span
              key={i}
              className="absolute rounded-[50%] border border-dashed border-[var(--maroon)]/35"
              style={{ left: e.left, top: e.top, width: e.width, height: e.height }}
            />
          ))}
        </div>

        {/* Price — reads straight from `selected`, so the text is
            always right; the `x` animation is what makes it actually
            slide under whichever slot is selected instead of staying
            pinned to the row's center regardless of the click. */}
        <motion.div
          animate={{ x: markerX }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="relative z-10 w-40 sm:w-48 md:w-56 mx-auto flex items-center justify-between mt-6 text-xl"
        >
          <span className="uppercase tracking-wide">{selected.name}</span>
          <span className="font-bold tracking-[-0.04em]">{formatPrice(selected.price)}</span>
        </motion.div>
      </div>

      {/* Same rotation technique as a CSS loader: a plain @keyframes
          that just spins to a full turn, run on infinite linear loop.
          Kept as a scoped <style> tag so the podium doesn't need
          Framer Motion or a Tailwind config change for one animation. */}
      <style>{`
        .podium-spin {
          transform: translateX(-50%) rotate(0deg);
          animation: podium-spin 14s linear infinite;
        }
        @keyframes podium-spin {
          to { transform: translateX(-50%) rotate(1turn); }
        }
      `}</style>
    </section>
  );
}