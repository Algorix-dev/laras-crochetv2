import { useState } from "react";
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
  Earlier version reordered the array so the clicked item slid into
  the middle. That's wrong per Lara's correction: the 5 garments stay
  in their own slots always — clicking one only changes which slot
  counts as "selected." The selected slot's photo faces front, gets
  full color, and gets its own name-behind-head + podium + price.
  Every other slot dims/desaturates and "looks away" — mirrored to
  face further left if it sits left of the selected slot, unmirrored
  (facing right) if it sits right of it.

  The name/podium/price block uses a shared framer-motion `layoutId`
  so when you click a different slot, that block visibly slides from
  its old position to the new one instead of just popping — the
  "mini transition" Lara asked for — even though the photos
  themselves never move.
*/
export default function Hero({ models }) {
  const [selectedId, setSelectedId] = useState(models[0]?.id);
  const selectedSlot = models.findIndex((m) => m.id === selectedId);
  const selected = models[selectedSlot];
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  return (
    <section className="pt-10 md:pt-16 pb-10 text-center px-5">
      <div className="relative max-w-5xl mx-auto">
        <div className="flex items-end justify-center gap-3 md:gap-6">
          {models.map((model, slot) => {
            const isSelected = model.id === selectedId;
            const distance = Math.abs(slot - selectedSlot);
            const responsiveClass = distance >= 2 ? "hidden md:block" : "";
            // TIP: mirror slots to the LEFT of the selected one so
            // they read as "facing away left"; slots to the right
            // stay unmirrored, reading as "facing away right." The
            // selected slot itself is always unmirrored (front-on).
            const shouldMirror = !isSelected && slot < selectedSlot;

            return (
              <div key={model.id} className={`relative ${responsiveClass}`}>
                {isSelected && (
                  <>
                    {/* Name — sits BEHIND the photo (lower z-index),
                        positioned at this model's own head height via
                        nameTop, so it reads as "coming from behind
                        the head" rather than floating above it. */}
                    <motion.h1
                      layoutId="hero-name"
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                      style={{ top: model.nameTop }}
                      className="absolute left-1/2 -translate-x-1/2 z-0 font-display text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] leading-none text-[#d8d5cd] select-none whitespace-nowrap"
                    >
                      {model.name.toUpperCase()}
                    </motion.h1>

                    {/* Podium — the real crochet-ring asset, slowly
                        spinning under the selected garment only. */}
                    <motion.img
                      layoutId="hero-podium"
                      src={podiumRing}
                      alt=""
                      aria-hidden="true"
                      animate={{ rotate: 360 }}
                      transition={{
                        layout: { type: "spring", stiffness: 260, damping: 28 },
                        rotate: { duration: 14, repeat: Infinity, ease: "linear" },
                      }}
                      className="absolute left-1/2 bottom-2 -translate-x-1/2 z-0 w-40 sm:w-48 md:w-56 pointer-events-none"
                    />
                  </>
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
                  src={model.image}
                  alt={model.placeholder ? "Lara's Crochet piece" : model.name}
                  transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                  style={shouldMirror ? { transform: "scaleX(-1)" } : {}}
                  className={`relative z-10 h-auto cursor-pointer focus-visible:outline-none transition-[opacity,filter] duration-500 ${
                    isSelected
                      ? "w-40 sm:w-48 md:w-56 opacity-100 saturate-100"
                      : "w-32 md:w-40 opacity-60 saturate-[0.35]"
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

        {/* Price — its own shared-layout block so it slides to match
            whichever slot is selected, showing THAT model's own price,
            not a leftover from the previous selection. */}
        <motion.div
          layout
          className="relative z-10 w-40 sm:w-48 md:w-56 mx-auto flex items-center justify-between mt-3 text-sm"
        >
          <span className="uppercase tracking-wide">{selected.name}</span>
          <span className="font-semibold">{formatPrice(selected.price)}</span>
        </motion.div>
      </div>
    </section>
  );
}
