import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import ShareButton from "./ShareButton";
import MoreOptionsMenu from "./MoreOptionsMenu";
import podiumRing from "../assets/podium-ring.png";

/*
  TIP: FIXED SLOTS, NOT A CAROUSEL.
  ----------------------------------
  The 5 garments stay in their own slots always — clicking one only
  changes which slot counts as "selected." The selected slot's photo
  faces front, gets full color, and is a little taller than the rest
  (see the height classes below — a small bump, not a big jump).

  Every other slot dims/desaturates and "looks away" using the
  angleImage (a real 3/4-turned photo — see products.js), mirrored
  with scaleX(-1) on whichever side needs to face the opposite way.
  Only Reina has that second photo right now; the other 4 pieces are
  placeholders with just one image, so they stay as plain dimmed
  front photos until real 3/4-angle shots exist for them too.

  All photos share the same HEIGHT (not width) so they line up like
  people standing at the same height regardless of each photo's own
  aspect ratio — width is left automatic per photo.

  THE NAME + PODIUM ARE ONE PERSISTENT PAIR OF ELEMENTS, NOT ONE PER
  SLOT. Earlier this lived inside each slot's own div and got
  unmounted/remounted on every click — which meant the podium's spin
  restarted from 0 every time (never truly continuous) and the slide
  between slots depended on Framer Motion's shared-layoutId magic
  working across that remount, which isn't reliable. Now there's a
  single <h1> and a single podium <img>, rendered once outside the
  slot loop, and a small effect below measures the selected slot's
  actual on-screen position (via refs) and animates the pair over to
  it with `x`. Because the podium element itself never unmounts, its
  `rotate: 360, repeat: Infinity` keeps spinning nonstop in the
  background the entire time — like a wheel that's always turning,
  not something that stops and restarts.
*/
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
  // markerX — the horizontal distance the name/podium need to shift by.
  const rowRef = useRef(null);
  const slotRefs = useRef({});
  const [markerX, setMarkerX] = useState(0);

  useEffect(() => {
    function measure() {
      const row = rowRef.current;
      const slotEl = slotRefs.current[selectedId];
      if (!row || !slotEl) return;
      const rowRect = row.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      const rowCenter = rowRect.left + rowRect.width / 2;
      const slotCenter = slotRect.left + slotRect.width / 2;
      setMarkerX(slotCenter - rowCenter);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [selectedId]);

  return (
    <section className="pt-10 md:pt-16 pb-10 text-center px-5">
      <div className="relative max-w-5xl mx-auto">
        <div ref={rowRef} className="flex items-end justify-center gap-3 md:gap-6">
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
                  className={`relative z-10 w-auto cursor-pointer focus-visible:outline-none transition-[opacity,filter,height] duration-500 ${
                    isSelected
                      ? "h-48 sm:h-56 md:h-64 opacity-100 saturate-100"
                      : "h-40 sm:h-48 md:h-56 opacity-60 saturate-[0.35]"
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
            markerX, see the effect above) and swaps to that model's
            name/head-height as it arrives. */}
        <motion.h1
          animate={{ x: `calc(-50% + ${markerX}px)`, top: selected.nameTop }}
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

        {/* Podium — ONE ring image, never unmounted, so `rotate` keeps
            accumulating forever instead of resetting to 0 on every
            click. Only its `x` (which slot it's centered over) moves. */}
        <motion.img
          src={podiumRing}
          alt=""
          aria-hidden="true"
          animate={{ x: `calc(-50% + ${markerX}px)`, rotate: 360 }}
          // TIP: `duration: 14` (seconds per full turn) is unchanged from
          // before — lower it for a faster spin, raise it for slower.
          transition={{
            x: { type: "spring", stiffness: 260, damping: 28 },
            rotate: { duration: 14, repeat: Infinity, ease: "linear" },
          }}
          className="absolute left-1/2 bottom-2 z-0 w-40 sm:w-48 md:w-56 pointer-events-none"
        />

        <div className="relative z-10 flex justify-center gap-1.5 mt-4">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              aria-label={`View ${m.placeholder ? "piece" : m.name}`}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                m.id === selectedId ? "bg-[var(--ink)]" : "bg-[var(--line)]"
              }`}
            />
          ))}
        </div>

        {/* Price — reads straight from `selected`, so it always shows
            whichever model is currently picked; `layout` just animates
            it sliding/resizing smoothly when that changes. */}
        <motion.div
          layout
          className="relative z-10 w-40 sm:w-48 md:w-56 mx-auto flex items-center justify-between mt-3 text-xl"
        >
          <span className="uppercase tracking-wide">{selected.name}</span>
          <span className="font-bold tracking-[-0.04em]">{formatPrice(selected.price)}</span>
        </motion.div>
      </div>
    </section>
  );
}