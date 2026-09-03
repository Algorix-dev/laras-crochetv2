import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import ShareButton from "./ShareButton";
import MoreOptionsMenu from "./MoreOptionsMenu";
import { useState } from "react";

/*
  TIP: FIXED SLOTS, NOT A CAROUSEL.
  ----------------------------------
  The 5 garments stay in their own slots always — clicking one only
  changes which slot counts as "selected." Only the selected slot
  gets the enlarged/full-color treatment; every other slot always
  renders at the same small, dimmed size regardless of which one
  was previously selected.

  NO MORE JS-MEASURED POSITIONING.
  ------------------------------------------------
  Earlier versions computed a `markerX` offset by measuring the row
  and the selected slot's on-screen position, then translated the
  name/price/podium to line up with it. That's fragile — it can
  drift on resize timing, image-load timing, etc. — and it was the
  cause of the heading/price landing in the wrong place.

  Instead: the name, price row, and podium are now rendered AS
  CHILDREN of the selected slot's own div, centered with plain CSS
  (`left-1/2 -translate-x-1/2`) relative to that div alone. Since
  that div's width IS the selected image's own rendered width, this
  guarantees they're centered on the actual image, every time, with
  no measurement to go stale. This is also what makes "go to the
  center of the image" and "go behind the head" reliable — they're
  literally parented to that image now, not a separately-tracked
  overlay.

  WIDTH IS NO LONGER LEFT TO FLEX-SHRINK.
  ------------------------------------------------
  Previously only height was set via className, and width was left
  auto (browser-computed from the image's natural aspect ratio) —
  but as a flex child with default flex-shrink, the browser was
  compressing that auto width whenever the row's natural total
  width exceeded the container's max-width, which is worst exactly
  at the top of the responsive range (1920px) — that's the "thin,
  even thinner at 1920" bug. `shrink-0` stops that compression, and
  the container's max-width cap has been loosened so it doesn't
  force a squish to hit an exact px target.

  THE NAME IS DELIBERATELY LAYERED BEHIND THE TOP OF THE IMAGE.
  -----------------------------------------------------------------
  Figma's own layout has the name box (top:35, height:113) overlap
  the top of the garment photo (top:75) by 73px, with the photo's
  z-index above the name's. Reproduced here as a plain CSS
  `bottom-[87.9%]` anchor (73/603 ≈ 12.1% of the image's own height,
  measured from the image's bottom) — bottom-anchoring means it's
  correct regardless of the name's own rendered height, no JS needed.
*/

// Figma's Group 29 (243.81 × 116.05) is 3 dashed ellipses at
// slightly different sizes/offsets, not one clean ring — that's
// what gives it the hand-drawn "circled" look. Values below are
// each ellipse's box as a % of the group's own bounding box.
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

  return (
    <section className="pt-10 md:pt-16 pb-16 text-center">
      {/* Padding: 304/1920 = 15.83vw of Figma's frame, capped at
          304px (19rem). No hard max-width cap on the row itself
          anymore — see TIP above on why forcing exactly 1312px
          was causing the squish. */}
      <div className="relative mx-auto px-[clamp(1rem,15.83vw,19rem)]">
        {/* Gap: 128px / 173.14px model width in Figma ≈ 6.667vw,
            capped at 128px (8rem). */}
        <div className="flex items-end justify-center gap-[clamp(1.5rem,6.667vw,8rem)]">
          {models.map((model, slot) => {
            const isSelected = model.id === selectedId;
            const distance = Math.abs(slot - selectedSlot);
            const responsiveClass = distance >= 2 ? "hidden md:block" : "";
            // TIP: reina-three-quarter.png (angleImage) is shot turned to
            // ITS OWN left — check it before changing this logic. Slots
            // to the LEFT of the selected one need to face further left
            // (away) → show that photo as-is. Slots to the RIGHT need to
            // face right (away) → mirror it with scaleX(-1). The selected
            // slot always shows the plain front photo, never mirrored.
            const shouldMirror = !isSelected && !!model.angleImage && slot > selectedSlot;
            const displayImage = isSelected ? model.image : (model.angleImage ?? model.image);

            return (
              <div
                key={model.id}
                className={`relative ${responsiveClass}`}
              >
                {/* Name — z-0, BEHIND the image (z-10), parented to
                    THIS slot so it's automatically centered on this
                    exact image, no offset math required. */}
                {isSelected && (
                  <h1 className="absolute left-1/2 -translate-x-1/2 bottom-[87.9%] z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[clamp(2.5rem,5vw,6rem)] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap pointer-events-none">
                    {model.name.toUpperCase()}
                  </h1>
                )}

                {/* Podium — also parented to the selected slot now, so
                    it moves to and centers on whichever image is
                    selected, like the name and price do. Still fully
                    static (no spin/animation) until the intended
                    behavior is spec'd out.
                    Width clamp: 243.81/1920 = 12.7vw, capped at
                    243.81px (15.24rem); border-width clamp similarly
                    caps at Figma's 5px. */}
                {isSelected && (
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 bottom-4 z-0 w-[clamp(9rem,12.7vw,15.24rem)] aspect-[243.81/116.05] opacity-30 pointer-events-none"
                    style={{
                      // Nudge here if the ring doesn't sit under the
                      // feet — it's centered on the image's own width,
                      // but the model inside the photo may not be
                      // perfectly centered in that canvas (asymmetric
                      // padding/cropping). Prefer model.podiumOffsetX
                      // (set per-piece in your product data, in px) so
                      // each garment can be tuned individually; falls
                      // back to 0 (pure center) if unset.
                      transform: `translateX(calc(-50% + ${model.podiumOffsetX ?? 0}px))`,
                    }}
                  >
                    {PODIUM_ELLIPSES.map((e, i) => (
                      <span
                        key={i}
                        className="absolute rounded-[50%] border-[var(--maroon-dark)]"
                        style={{
                          left: e.left,
                          top: e.top,
                          width: e.width,
                          height: e.height,
                          borderStyle: "dashed",
                          borderWidth: "clamp(1px, 0.26vw, 5px)",
                        }}
                      />
                    ))}
                  </div>
                )}

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
                  // shrink-0 is the actual fix for "thin" — see TIP above.
                  // Height clamp: unselected 534px (27.8125vw), selected
                  // 603px (31.40625vw), both capped at Figma's real px.
                  className={`relative z-10 w-auto shrink-0 cursor-pointer focus-visible:outline-none transition-[opacity,height] duration-500 ${
                    isSelected
                      ? "h-[clamp(11rem,31.40625vw,37.6875rem)] opacity-100"
                      : "h-[clamp(9rem,27.8125vw,33.375rem)] opacity-30"
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

                {/* Price row — also parented to the selected slot, so
                    it's centered on this image and sits right below it
                    (top-full), instead of tracking a separately
                    computed offset.
                    Width clamp: 360/1920 = 18.75vw, capped at 360px
                    (22.5rem), matching Figma's "Frame 62" row width. */}
                {isSelected && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-6 z-10 w-[clamp(11rem,18.75vw,22.5rem)] flex items-center justify-between text-xl">
                    <span className="uppercase tracking-wide">{model.name}</span>
                    <span className="font-bold tracking-[-0.04em]">{formatPrice(model.price)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}