```jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import ShareButton from "./ShareButton";
import MoreOptionsMenu from "./MoreOptionsMenu";
import podiumRing from "../assets/podium-ring.png";

/*
  HERO MODEL SELECTOR
  -------------------
  The models live in FIXED slots.

  Selecting a model:
  - does NOT move/reorder the other models
  - enlarges ONLY the selected model
  - keeps every unselected model the exact same size
  - places the spinning ring directly underneath the selected model
  - places the selected model's name behind its head
  - removes the old navigation dots completely
  - keeps the selected model fully visible
  - makes surrounding models appear to face away from the selected one

  Important:
  The images themselves stay in their slots. Only their visual scale,
  opacity, saturation and orientation change.
*/

export default function Hero({ models }) {
  const [selectedId, setSelectedId] = useState(models[0]?.id);

  const selectedSlot = models.findIndex((m) => m.id === selectedId);
  const selected = models[selectedSlot];

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  return (
    <section className="pt-10 md:pt-16 pb-10 text-center px-5 overflow-hidden">
      <div className="relative max-w-6xl mx-auto">

        {/* MODEL ROW */}
        <div
          className="
            relative
            flex
            items-end
            justify-center
            gap-1
            sm:gap-3
            md:gap-5
            min-h-[390px]
            sm:min-h-[430px]
            md:min-h-[500px]
          "
        >
          {models.map((model, slot) => {
            const isSelected = model.id === selectedId;

            /*
              Everything is calculated relative to the selected model.

              left side  -> faces toward the left / away from selected model
              right side -> faces toward the right / away from selected model
            */
            const isLeftOfSelected = slot < selectedSlot;
            const isRightOfSelected = slot > selectedSlot;

            /*
              Keep all five slots the same width and height.
              This is the important part that prevents the selected
              model from pushing the other models around.
            */
            const slotWidth =
              "w-[68px] sm:w-[90px] md:w-[120px] lg:w-[135px]";

            /*
              Selected image grows inside its fixed slot.
              Unselected images all use exactly the same dimensions.
            */
            const imageSize = isSelected
              ? "w-[120px] sm:w-[145px] md:w-[190px] lg:w-[215px]"
              : "w-[68px] sm:w-[90px] md:w-[120px] lg:w-[135px]";

            /*
              This gives the surrounding models a stronger "looking away"
              feeling without changing their actual slot positions.

              Left models turn visually left.
              Right models turn visually right.
            */
            const directionTransform = isSelected
              ? "translateX(-50%) scale(1)"
              : isLeftOfSelected
                ? "translateX(-50%) rotateY(-18deg) rotateZ(-1deg) scale(0.96)"
                : "translateX(-50%) rotateY(18deg) rotateZ(1deg) scale(0.96)";

            return (
              <div
                key={model.id}
                className={`
                  relative
                  shrink-0
                  ${slotWidth}
                  h-[370px]
                  sm:h-[410px]
                  md:h-[475px]
                  flex
                  items-end
                  justify-center
                `}
              >
                {/* NAME BEHIND THE SELECTED MODEL */}
                {isSelected && (
                  <motion.div
                    layoutId="hero-name"
                    transition={{
                      type: "spring",
                      stiffness: 220,
                      damping: 26,
                    }}
                    className="
                      absolute
                      left-1/2
                      z-[1]
                      pointer-events-none
                      font-display
                      font-bold
                      text-[2.8rem]
                      sm:text-[3.8rem]
                      md:text-[5rem]
                      lg:text-[5.8rem]
                      leading-none
                      tracking-tight
                      text-[#d8d5cd]
                      select-none
                      whitespace-nowrap
                    "
                    style={{
                      top: model.nameTop || "7%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    {model.name.toUpperCase()}
                  </motion.div>
                )}

                {/* SPINNING RING
                    It belongs ONLY to the selected slot.
                    No layoutId means it cannot travel independently
                    from the model. It simply spins in this position.
                */}
                {isSelected && (
                  <motion.img
                    src={podiumRing}
                    alt=""
                    aria-hidden="true"
                    className="
                      absolute
                      left-1/2
                      bottom-[7px]
                      z-[2]
                      w-[125px]
                      sm:w-[150px]
                      md:w-[190px]
                      lg:w-[215px]
                      pointer-events-none
                    "
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      rotate: {
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                    style={{
                      transformOrigin: "center center",
                    }}
                  />
                )}

                {/* MODEL */}
                <motion.img
                  role="button"
                  tabIndex={0}
                  src={model.image}
                  alt={
                    model.placeholder
                      ? "Lara's Crochet piece"
                      : model.name
                  }
                  aria-label={`View ${
                    model.placeholder ? "this piece" : model.name
                  }`}
                  aria-current={isSelected}
                  onClick={() => setSelectedId(model.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(model.id);
                    }
                  }}
                  className={`
                    absolute
                    left-1/2
                    bottom-0
                    z-[10]
                    h-auto
                    max-w-none
                    cursor-pointer
                    select-none
                    object-contain
                    origin-bottom
                    transition-all
                    duration-500
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    ${imageSize}
                    ${
                      isSelected
                        ? "opacity-100 saturate-100"
                        : "opacity-55 saturate-[0.35]"
                    }
                  `}
                  style={{
                    transform: directionTransform,
                  }}
                />

                {/* ACTIONS ONLY FOR SELECTED MODEL */}
                {isSelected && (
                  <div
                    className="
                      absolute
                      -right-5
                      sm:-right-6
                      md:-right-7
                      top-[48%]
                      z-[20]
                      flex
                      flex-col
                      items-center
                      gap-2
                    "
                  >
                    <button
                      aria-label="Toggle wishlist"
                      aria-pressed={isInWishlist(model.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(model.id);
                      }}
                      className="hover:text-[var(--maroon)] transition-colors"
                    >
                      <Heart
                        size={17}
                        strokeWidth={1.5}
                        fill={
                          isInWishlist(model.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                    <ShareButton
                      product={model}
                      className="hover:text-[var(--maroon)]"
                    />

                    <MoreOptionsMenu product={model} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* NO DOTS */}
        {/* The old carousel dots have intentionally been removed. */}

        {/* PRODUCT INFORMATION */}
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
          className="
            relative
            z-30
            w-44
            sm:w-52
            md:w-60
            mx-auto
            flex
            items-center
            justify-between
            mt-1
            text-sm
          "
        >
          <span className="uppercase tracking-wide">
            {selected.name}
          </span>

          <span className="font-semibold">
            {formatPrice(selected.price)}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
```
