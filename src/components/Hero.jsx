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
  faces front, gets full color, and is a little taller than the rest.
  ONLY the selected slot ever gets the enlarged/full-color treatment —
  every other slot is always rendered at the same small, dimmed size
  regardless of which one was previously selected.
  (Recentering the selected piece into the middle slot, carousel-style,
  is a separate behavior change — holding off on that until it's
  spec'd out, per request.)

  Every other slot dims using opacity (30%, per the Figma spec) and
  "looks away" using the angleImage (a real 3/4-turned photo — see
  products.js), mirrored with scaleX(-1) on whichever side needs to
  face the opposite way. Only Reina has that second photo right now;
  the other 4 pieces are placeholders with just one image, so they
  stay as plain dimmed front photos until real 3/4-angle shots exist
  for them too.

  SIZING IS CLAMP()-BASED, NOT BREAKPOINT-BASED.
  ------------------------------------------------
  Every key dimension (row gap, image heights, podium size, name
  font-size, container padding) is a `clamp(min, Nvw, figmaPx)` where
  the vw ratio is that dimension's exact fraction of Figma's 1920px
  frame. That means: at a 1920px viewport you land on the literal
  Figma pixel values (the clamp's ceiling), and anything narrower
  scales the whole hero down fluidly and proportionally instead of
  jumping between a few fixed breakpoints. Nothing gets bigger than
  the Figma numbers even on ultra-wide screens, because the ceiling
  is a hard px cap.

  THE NAME IS DELIBERATELY LAYERED BEHIND THE TOP OF THE IMAGE.
  -----------------------------------------------------------------
  Figma's own layout has the name box (top:35, height:113) overlap
  the top of the garment photo (top:75) by 73px, with the photo's
  z-index above the name's — that's what makes the model read as
  standing in front of the wordmark. The effect below reproduces
  that same overlap proportionally (as a % of the image's own
  height) rather than leaving a gap above it, and measures the
  name's own rendered height (via nameRef) so it's positioned
  correctly regardless of how large the responsive font gets.
*/

// Figma's Group 29 (243.81 × 116.05) is 3 dashed ellipses at
// slightly different sizes/offsets, not one clean ring — that's
// what gives it the hand-drawn "circled" look. Values below are
// each ellipse's box as a % of the group's own bounding box, so
// they scale with the container at any size.
const PODIUM_ELLIPSES = [
  { left: "0%", top: "3.3%", width: "100%", height: "96.7%" },
  { left: "4.7%", top: "7.9%", width: "90.6%", height: "87.6%" },
  { left: "5.7%", top: "0%", width: "90.6%", height: "87.6%" },
];

// How far the name's bottom edge intrudes into the top of the
// image, as a fraction of the image's own rendered height —
// taken directly from Figma: 73px overlap / 603px image height.
const NAME_OVERLAP_RATIO = 73 / 603;

export default function Hero({ models }) {
  const [selectedId, setSelectedId] = useState(models[0]?.id);
  const selectedSlot = models.findIndex((m) => m.id === selectedId);
  const selected = models[selectedSlot];
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  const rowRef = useRef(null);
  const containerRef = useRef(null);
  const nameRef = useRef(null);
  const slotRefs = useRef({});
  const [markerX, setMarkerX] = useState(0);
  const [nameTop, setNameTop] = useState(0);

  useEffect(() => {
    function measure() {
      const row = rowRef.current;
      const container = containerRef.current;
      const nameEl = nameRef.current;
      const slotEl = slotRefs.current[selectedId];
      if (!row || !container || !slotEl || !nameEl) return;
      const rowRect = row.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const slotRect = slotEl.getBoundingClientRect();
      const nameHeight = nameEl.getBoundingClientRect().height;

      const rowCenter = rowRect.left + rowRect.width / 2;
      const slotCenter = slotRect.left + slotRect.width / 2;
      setMarkerX(slotCenter - rowCenter);

      const slotTopInContainer = slotRect.top - containerRect.top;
      const nameBottom = slotTopInContainer + slotRect.height * NAME_OVERLAP_RATIO;
      setNameTop(nameBottom - nameHeight);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [selectedId]);

  return (
    <section className="pt-10 md:pt-16 pb-10 text-center">
      {/* Container width/padding: 1312px content inside 1920px frame
          with 304px side padding → padding is 304/1920 = 15.83vw,
          capped at 304px (19rem), same clamp technique as everything
          else here. */}
      <div
        ref={containerRef}
        className="relative max-w-[82rem] mx-auto px-[clamp(1rem,15.83vw,19rem)]"
      >
        {/* Gap: 128px / 173.14px model width in Figma ≈ 6.667vw of the
            1920px frame, capped at 128px (8rem). */}
        <div
          ref={rowRef}
          className="flex items-end justify-center gap-[clamp(1.5rem,6.667vw,8rem)]"
        >
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
                  // side by side ("items-end" on the row keeps every
                  // photo's feet on the same ground line).
                  //
                  // Heights are clamp()'d to Figma's exact px values:
                  // unselected = 534px (27.8125vw), selected = 603px
                  // (31.40625vw) — the same "hit the real number at
                  // 1920px, scale fluidly below it" approach as the gap.
                  className={`relative z-10 w-auto cursor-pointer focus-visible:outline-none transition-[opacity,height] duration-500 ${
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
              </div>
            );
          })}
        </div>

        {/* Name — z-0, BEHIND the photos (z-10), one persistent element
            that slides to sit over whichever slot is selected (markerX)
            and is positioned so its bottom edge intrudes into the top
            of the selected image by Figma's proportion (nameTop, see
            the effect above) — the "standing in front of the wordmark"
            look, not a gap above it.
            Font-size clamp: 96px / 1920px = 5vw, capped at 96px (6rem). */}
        <motion.h1
          ref={nameRef}
          animate={{ x: `calc(-50% + ${markerX}px)`, top: nameTop }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="absolute left-1/2 z-0 font-['Raleway'] font-bold tracking-[-0.07em] text-[clamp(2.5rem,5vw,6rem)] leading-[1.18] text-[var(--maroon-dark)] select-none whitespace-nowrap"
        >
          {selected.name.toUpperCase()}
        </motion.h1>

        {/* Podium — fully static, matching the wireframe as-is (no
            spin, no follow-the-selection movement) until the intended
            behavior is spec'd out. Built from 3 literal dashed
            ellipses (PODIUM_ELLIPSES above), matching Figma's actual
            layer group instead of an image asset.
            Width clamp: 243.81px / 1920px = 12.7vw, capped at 243.81px
            (15.24rem); border-width clamp: 5px / 1920px ≈ 0.26vw,
            capped at 5px — both hit Figma's real numbers at 1920px. */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 bottom-4 z-0 w-[clamp(9rem,12.7vw,15.24rem)] aspect-[243.81/116.05] opacity-30 pointer-events-none"
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

        {/* Price — reads straight from `selected`, so the text is
            always right; the `x` animation slides it under whichever
            slot is actually selected instead of staying centered.
            Width clamp: 360px / 1920px = 18.75vw, capped at 360px
            (22.5rem), matching Figma's "Frame 62" row width. */}
        <motion.div
          animate={{ x: markerX }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="relative z-10 w-[clamp(11rem,18.75vw,22.5rem)] mx-auto flex items-center justify-between mt-6 text-xl"
        >
          <span className="uppercase tracking-wide">{selected.name}</span>
          <span className="font-bold tracking-[-0.04em]">{formatPrice(selected.price)}</span>
        </motion.div>
      </div>
    </section>
  );
}