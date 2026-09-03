import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";
import ShareButton from "./ShareButton";
import MoreOptionsMenu from "./MoreOptionsMenu";
import podiumRing from "../assets/podium-ring.png";

export default function Hero({ models = [] }) {
  const [selectedId, setSelectedId] = useState(models[0]?.id);

  const selectedSlot = models.findIndex(
    (model) => model.id === selectedId
  );

  const selected =
    models[selectedSlot >= 0 ? selectedSlot : 0];

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice } = useCurrency();

  if (!models.length) {
    return null;
  }

  return (
    <section className="overflow-hidden px-5 pb-10 pt-10 text-center md:pt-16">
      <div className="relative mx-auto max-w-6xl">

        {/* ====================================================
            MODEL ROW
            ==================================================== */}

        <div
          className="
            relative
            flex
            min-h-[390px]
            items-end
            justify-center
            gap-1
            sm:min-h-[430px]
            sm:gap-3
            md:min-h-[500px]
            md:gap-5
          "
          style={{
            perspective: "1000px",
          }}
        >
          {models.map((model, slot) => {
            const isSelected = model.id === selectedId;

            const isLeftOfSelected = slot < selectedSlot;
            const isRightOfSelected = slot > selectedSlot;

            /*
              Every model has a fixed slot.

              This prevents the selected model from pushing
              the other models around when it becomes larger.
            */
            const imageSize = isSelected
              ? "w-[120px] sm:w-[150px] md:w-[190px] lg:w-[215px]"
              : "w-[78px] sm:w-[95px] md:w-[120px] lg:w-[135px]";

            /*
              Non-selected models subtly turn away from
              whichever model is currently selected.
            */
            const rotation = isSelected
              ? 0
              : isLeftOfSelected
                ? -18
                : isRightOfSelected
                  ? 18
                  : 0;

            const rotationZ = isSelected
              ? 0
              : isLeftOfSelected
                ? -1
                : isRightOfSelected
                  ? 1
                  : 0;

            return (
              <div
                key={model.id}
                className="
                  relative
                  flex
                  h-[370px]
                  w-[82px]
                  shrink-0
                  items-end
                  justify-center
                  sm:h-[410px]
                  sm:w-[100px]
                  md:h-[475px]
                  md:w-[125px]
                  lg:w-[140px]
                "
              >

                {/* ==================================================
                    SELECTED MODEL NAME
                    ================================================== */}

                {isSelected && (
                  <motion.h1
                    layoutId="hero-name"
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 28,
                    }}
                    style={{
                      top: model.nameTop || "8%",
                    }}
                    className="
                      pointer-events-none
                      absolute
                      left-1/2
                      z-[1]
                      -translate-x-1/2
                      select-none
                      whitespace-nowrap
                      font-display
                      text-[3.2rem]
                      leading-none
                      text-[#d8d5cd]
                      sm:text-[4rem]
                      md:text-[5rem]
                      lg:text-[5.7rem]
                    "
                  >
                    {model.name?.toUpperCase()}
                  </motion.h1>
                )}

                {/* ==================================================
                    SPINNING PODIUM RING
                    ================================================== */}

                {isSelected && (
                  <motion.img
                    src={podiumRing}
                    alt=""
                    aria-hidden="true"
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
                    className="
                      pointer-events-none
                      absolute
                      bottom-1
                      left-1/2
                      z-[2]
                      w-[125px]
                      -translate-x-1/2
                      sm:w-[150px]
                      md:w-[190px]
                      lg:w-[215px]
                    "
                  />
                )}

                {/* ==================================================
                    MODEL IMAGE
                    ================================================== */}

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
                    model.placeholder
                      ? "this piece"
                      : model.name
                  }`}
                  aria-current={isSelected}
                  onClick={() => setSelectedId(model.id)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      setSelectedId(model.id);
                    }
                  }}
                  animate={{
                    scale: 1,
                    rotateY: rotation,
                    rotateZ: rotationZ,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                  }}
                  style={{
                    transformOrigin: "bottom center",
                  }}
                  className={`
                    absolute
                    bottom-0
                    left-1/2
                    z-[10]
                    h-auto
                    max-w-none
                    -translate-x-1/2
                    cursor-pointer
                    select-none
                    object-contain
                    transition-[opacity,filter]
                    duration-500
                    ease-out
                    ${imageSize}
                    ${
                      isSelected
                        ? "opacity-100 saturate-100"
                        : "opacity-60 saturate-[0.35]"
                    }
                  `}
                />

                {/* ==================================================
                    SELECTED MODEL ACTIONS
                    ================================================== */}

                {isSelected && (
                  <div
                    className="
                      absolute
                      right-[-20px]
                      top-[48%]
                      z-[20]
                      flex
                      flex-col
                      items-center
                      gap-2
                      sm:right-[-24px]
                      md:right-[-28px]
                    "
                  >
                    {/* Wishlist */}

                    <button
                      type="button"
                      aria-label="Toggle wishlist"
                      aria-pressed={isInWishlist(model.id)}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleWishlist(model.id);
                      }}
                      className="
                        transition-colors
                        hover:text-[var(--maroon)]
                      "
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

                    {/* Share */}

                    <ShareButton
                      product={model}
                      className="hover:text-[var(--maroon)]"
                    />

                    {/* More options */}

                    <MoreOptionsMenu product={model} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ====================================================
            PRODUCT INFORMATION
            ==================================================== */}

        {selected && (
          <motion.div
            key={selected.id}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.35,
              ease: "easeOut",
            }}
            className="
              relative
              z-30
              mx-auto
              mt-2
              flex
              w-44
              items-center
              justify-between
              text-sm
              sm:w-52
              md:w-60
            "
          >
            <span className="uppercase tracking-wide">
              {selected.name}
            </span>

            <span className="font-semibold">
              {formatPrice(selected.price)}
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
