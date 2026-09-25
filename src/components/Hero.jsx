import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronUp, ShoppingBag } from "lucide-react";

const isSampleModel = (model) => String(model.id).startsWith("fallback-");

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

/* ============================================================
   HERO TUNING
   ============================================================ */

const SPIN_DURATION_SECONDS = 6;
const SIDE_TILT_DEGREES = 18;

const SUPPORT_SCALE_X = 1.12;
const SUPPORT_SCALE_Y = 1.0;

const SELECTED_SCALE_X = 1.0;
const SELECTED_SCALE_Y = 1.0;

const SUPPORT_HEIGHT_RATIO = 0.88;
const SUPPORT_HEIGHT_RATIO_PHONE = 0.5;

const supportRatio = () =>
  typeof window !== "undefined" && window.innerWidth < 640
    ? SUPPORT_HEIGHT_RATIO_PHONE
    : SUPPORT_HEIGHT_RATIO;

const SIDE_MODEL_OPACITY = 0.50;
const SIDE_MODEL_BLUR_PX = 4.5;

const SLOT_SPACING = 1.2;

const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[10%]";

/* ============================================================
   ANIMATION
   ============================================================ */

const SELECT_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 28,
};

const WRAP_DURATION_SECONDS = 0.95;
const WRAP_EXIT_FRACTION = 0.4;

const FACE_FADE_SECONDS = 0.5;

const SWIPE_MIN_PX = 40;
const SWIPE_SIDEWAYS_RATIO = 1.4;

const TEXT_OUT_SECONDS = 0.3;
const TEXT_IN_SECONDS = 0.75;
const TEXT_IN_DELAY_SECONDS = 0.2;

const RIPPLE_DURATION_SECONDS = 1.1;
const RIPPLE_END_SCALE = 1.9;
const RIPPLE_PEAK_OPACITY = 0.55;
const RIPPLE_REPEAT_GAP_SECONDS = 1.2;
const COMET_PEAK_OPACITY = 0.55;

/* ============================================================
   RESPONSIVE MODEL COUNT
   ============================================================ */

const WIDE_QUERY = "(min-width: 1440px)";

function useIsWide() {
  const [isWide, setIsWide] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia(WIDE_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const onChange = (event) => setIsWide(event.matches);

    setIsWide(mq.matches);
    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isWide;
}

/* ============================================================
   IMAGE SIZE
   ============================================================ */

const IMAGE_HEIGHT_SELECTED =
  "h-[clamp(25rem,34vw,42rem)] max-sm:h-[27rem]";

/* ============================================================
   CAROUSEL MATH
   ============================================================ */

function wrapOffset(value, count) {
  const lowest = -Math.floor(count / 2);
  return ((((value - lowest) % count) + count) % count) + lowest;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSlotLook(offset, half) {
  const isCenter = offset === 0;
  const isShown = Math.abs(offset) <= half;
  const isPhone =
    typeof window !== "undefined" && window.innerWidth < 640;

  return {
    opacity: isCenter ? 1 : isShown ? SIDE_MODEL_OPACITY : 0,

    rotateY: isCenter
      ? 0
      : Math.sign(offset) * SIDE_TILT_DEGREES,

    scaleX: isCenter
      ? (isPhone ? 1.08 : SELECTED_SCALE_X)
      : SUPPORT_SCALE_X * supportRatio(),

    scaleY: isCenter
      ? (isPhone ? 1.08 : SELECTED_SCALE_Y)
      : SUPPORT_SCALE_Y * supportRatio(),

    y: !isCenter && isPhone ? -80 : 0,

    filter: isCenter
      ? "blur(0px) brightness(1)"
      : `blur(${SIDE_MODEL_BLUR_PX}px) brightness(0.95)`,
  };
}

/* ============================================================
   PODIUM
   ============================================================ */

const PODIUM_VIEWBOX = "0 0 243.81 116.05";

const PODIUM_RINGS = [
  {
    cx: 121.9,
    cy: 59.94,
    rx: 121.9,
    ry: 56.11,
  },
  {
    cx: 121.9,
    cy: 59.99,
    rx: 110.45,
    ry: 50.83,
  },
  {
    cx: 124.34,
    cy: 50.83,
    rx: 110.45,
    ry: 50.83,
  },
];

const PODIUM_STROKE_WIDTH = 2.5;
const PODIUM_DASH_LENGTH = 4;
const PODIUM_DASH_GAP = 3;

const PODIUM_DASH =
  `${PODIUM_DASH_LENGTH} ${PODIUM_DASH_GAP}`;

const BASE_RING_OPACITY = 0.45;

const COMET_STROKE_WIDTH = 4.5;
const COMET_GLOW_BLUR = 2.2;

const COMET_BAND_WIDTH = 55;

const COMET_STOPS = [
  {
    offset: "0%",
    opacity: 0,
  },
  {
    offset: `${50 - COMET_BAND_WIDTH / 2}%`,
    opacity: 0,
  },
  {
    offset: "50%",
    opacity: COMET_PEAK_OPACITY,
  },
  {
    offset: `${50 + COMET_BAND_WIDTH / 2}%`,
    opacity: 0,
  },
  {
    offset: "100%",
    opacity: 0,
  },
];

const PODIUM_SPIN_START =
  typeof performance !== "undefined"
    ? performance.now()
    : 0;

function getPodiumAnimationDelay() {
  const now =
    typeof performance !== "undefined"
      ? performance.now()
      : 0;

  const elapsedSeconds =
    (now - PODIUM_SPIN_START) / 1000;

  const phase =
    elapsedSeconds % SPIN_DURATION_SECONDS;

  return `-${phase.toFixed(3)}s`;
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/* ============================================================
   MODEL VIEWS
   ============================================================ */

function getViews(model, offset) {
  const { front, left, right } = model.views;
  const native = left ?? right ?? front;

  if (offset === 0) {
    return {
      front: front ?? native,
      side: native,
      mirror: false,
    };
  }

  const want = offset < 0 ? left : right;
  const other = offset < 0 ? right : left;

  if (want) {
    return {
      front: front ?? want,
      side: want,
      mirror: false,
    };
  }

  if (other) {
    return {
      front: front ?? other,
      side: other,
      mirror: true,
    };
  }

  return {
    front,
    side: front,
    mirror: false,
  };
}

/* ============================================================
   FEET ALIGNMENT
   ============================================================ */

const feetCache = new Map();

function measureFeetCenter(image) {
  const width = 160;

  const height = Math.max(
    1,
    Math.round(
      (image.naturalHeight * width) /
        image.naturalWidth
    )
  );

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  const bandTop = Math.floor(height * 0.94);

  const { data } = context.getImageData(
    0,
    bandTop,
    width,
    height - bandTop
  );

  let leftmost = width;
  let rightmost = -1;

  for (
    let row = 0;
    row < height - bandTop;
    row += 1
  ) {
    for (
      let col = 0;
      col < width;
      col += 1
    ) {
      if (
        data[
          (row * width + col) * 4 + 3
        ] > 40
      ) {
        if (col < leftmost) {
          leftmost = col;
        }

        if (col > rightmost) {
          rightmost = col;
        }
      }
    }
  }

  return rightmost < 0
    ? null
    : (leftmost + rightmost) /
        2 /
        width;
}

function useFeetCenter(src) {
  const [feet, setFeet] = useState(() =>
    src
      ? feetCache.get(src) ?? null
      : null
  );

  useEffect(() => {
    if (!src) return undefined;

    if (feetCache.has(src)) {
      setFeet(feetCache.get(src));
      return undefined;
    }

    let cancelled = false;

    const image = new Image();

    image.crossOrigin = "anonymous";

    image.onload = () => {
      let measured = null;

      try {
        measured = measureFeetCenter(image);
      } catch {
        measured = null;
      }

      feetCache.set(src, measured);

      if (!cancelled) {
        setFeet(measured);
      }
    };

    image.onerror = () => {
      feetCache.set(src, null);
    };

    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return feet;
}

/* ============================================================
   VERTICAL FEET ALIGNMENT
   ============================================================

   This is the vertical equivalent of the horizontal feet correction.

   Instead of guessing a bottom percentage, we:
   1. Find the actual bottom/feet position inside the image.
   2. Find the actual visual centre of the podium.
   3. Calculate the difference.
   4. Move the selected front image by exactly that amount.
*/

const verticalFeetCache = new Map();

function measureFeetBottom(image) {
  const width = 160;

  const height = Math.max(
    1,
    Math.round(
      (image.naturalHeight * width) /
        image.naturalWidth
    )
  );

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );

  const { data } = context.getImageData(
    0,
    0,
    width,
    height
  );

  let lowestPixel = -1;

  for (
    let row = height - 1;
    row >= 0;
    row -= 1
  ) {
    let foundPixel = false;

    for (
      let col = 0;
      col < width;
      col += 1
    ) {
      const alpha =
        data[
          (row * width + col) * 4 + 3
        ];

      if (alpha > 40) {
        foundPixel = true;
        break;
      }
    }

    if (foundPixel) {
      lowestPixel = row;
      break;
    }
  }

  return lowestPixel < 0
    ? null
    : lowestPixel / height;
}

function useFeetBottom(src) {
  const [feetBottom, setFeetBottom] =
    useState(() =>
      src
        ? verticalFeetCache.get(src) ?? null
        : null
    );

  useEffect(() => {
    if (!src) return undefined;

    if (verticalFeetCache.has(src)) {
      setFeetBottom(
        verticalFeetCache.get(src)
      );

      return undefined;
    }

    let cancelled = false;

    const image = new Image();

    image.crossOrigin = "anonymous";

    image.onload = () => {
      let measured = null;

      try {
        measured = measureFeetBottom(image);
      } catch {
        measured = null;
      }

      verticalFeetCache.set(src, measured);

      if (!cancelled) {
        setFeetBottom(measured);
      }
    };

    image.onerror = () => {
      verticalFeetCache.set(src, null);
    };

    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return feetBottom;
}

/* ============================================================
   ONE MODEL IN THE ROW
   ============================================================ */

function HeroModel({
  model,
  offset,
  prevOffset,
  shift,
  moveId,
  half,
  slotWidth,
  reduceMotion,
  onSelect,
  podiumCenterY,
}) {
  const navigate = useNavigate();

  const frontImageRef = useRef(null);

  const [frontImageWidth, setFrontImageWidth] =
    useState(0);
  const [alignmentReady, setAlignmentReady] =
    useState(false);
  const [frontImageRect, setFrontImageRect] =
    useState(null);

  const isSelected = offset === 0;
  const isShown = Math.abs(offset) <= half;

  const edge = half + 1;

  const hasFront = Boolean(model.views.front);

  /* -------------------- horizontal feet -------------------- */

  const frontFeet = useFeetCenter(
    hasFront ? model.views.front : null
  );

  /* -------------------- vertical feet -------------------- */

  const frontFeetBottom = useFeetBottom(
    hasFront ? model.views.front : null
  );

  /* -------------------- measure front image -------------------- */

  useLayoutEffect(() => {
    const image = frontImageRef.current;

    if (!image) return;

    const measure = () => {
      const rect = image.getBoundingClientRect();

      setFrontImageWidth(rect.width);

      setFrontImageRect({
        top: rect.top,
        height: rect.height,
      });

      if (
        podiumCenterY !== null &&
        frontFeetBottom !== null &&
        rect.height > 0
      ) {
        setAlignmentReady(true);
      }
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(image);

    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        measure
      );
    };
  }, [
    model.views.front,
    isSelected,
    podiumCenterY,
    frontFeetBottom,
  ]);

  /* -------------------- horizontal correction -------------------- */

  const feetCorrection =
    isSelected &&
    frontFeet !== null &&
    frontImageWidth > 0
      ? -(frontFeet - 0.5) *
        frontImageWidth
      : 0;

  /* -------------------- vertical correction -------------------- */

  /*
    The actual position of the model's feet in the
    browser viewport is:

      image top + (feet position × image height)

    We then compare that with the actual podium centre.

    This means the correction automatically adapts to:
      - desktop
      - mobile
      - different podium sizes
      - different image heights
      - different image crops
  */

  const verticalFeetCorrection =
    isSelected &&
    frontFeetBottom !== null &&
    frontImageRect &&
    podiumCenterY !== null
      ? podiumCenterY -
        (
          frontImageRect.top +
          frontFeetBottom *
            frontImageRect.height
        )
      : 0;

  /* ============================================================
     LOOP / PHOTO SWITCHING
     ============================================================ */

  const isLooped =
    moveId > 0 &&
    prevOffset + shift !== offset;

  const [
    swappedFor,
    setSwappedFor,
  ] = useState(0);

  useEffect(() => {
    if (isLooped || reduceMotion) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => setSwappedFor(moveId),
        WRAP_DURATION_SECONDS *
          WRAP_EXIT_FRACTION *
          1000 +
          30
      );

    return () =>
      window.clearTimeout(timer);
  }, [
    isLooped,
    moveId,
    reduceMotion,
  ]);

  const viewOffset =
    isLooped &&
    !reduceMotion &&
    swappedFor !== moveId
      ? prevOffset
      : offset;

  const view = getViews(
    model,
    hasFront
      ? viewOffset || prevOffset
      : viewOffset
  );

  const fade = {
    duration: reduceMotion
      ? 0
      : FACE_FADE_SECONDS,
    ease: "easeInOut",
  };

  const swapInstantly =
    isLooped || reduceMotion;

  /* ============================================================
     MODEL POSITION
     ============================================================ */

  const { animate, transition } =
    useMemo(() => {
      const look =
        getSlotLook(offset, half);

      const xFor = (slot) =>
        clamp(
          slot,
          -edge,
          edge
        ) *
        slotWidth *
        SLOT_SPACING;

      if (reduceMotion) {
        return {
          animate: {
            ...look,
            x: xFor(offset),
          },
          transition: {
            duration: 0,
          },
        };
      }

      const beltOffset =
        prevOffset + shift;

      const looped =
        moveId > 0 &&
        beltOffset !== offset;

      const arriving =
        moveId > 0 &&
        Math.abs(prevOffset) > half &&
        isShown;

      if (arriving && !looped) {
        const settleDelay = 0.25;

        return {
          animate: {
            ...look,
            x: xFor(offset),
          },

          transition: {
            default: {
              duration: 0,
              delay: settleDelay,
            },

            x: {
              duration: 0,
            },

            opacity: {
              duration: 0.6,
              delay: settleDelay,
              ease: "easeOut",
            },
          },
        };
      }

      if (!looped) {
        return {
          animate: {
            ...look,
            x: xFor(offset),
          },

          transition: SELECT_SPRING,
        };
      }

      const times = [
        0,
        WRAP_EXIT_FRACTION,
        WRAP_EXIT_FRACTION + 0.001,
        1,
      ];

      const switchDelay =
        WRAP_DURATION_SECONDS *
        WRAP_EXIT_FRACTION;

      const instantAtSwitch = {
        duration: 0,
        delay: switchDelay,
      };

      return {
        animate: {
          ...look,

          x: [
            null,
            xFor(beltOffset),
            xFor(offset),
            xFor(offset),
          ],

          opacity: [
            null,
            0,
            0,
            look.opacity,
          ],
        },

        transition: {
          default: SELECT_SPRING,

          x: {
            duration:
              WRAP_DURATION_SECONDS,
            times,
            ease: [
              "easeIn",
              "linear",
              "linear",
            ],
          },

          opacity: {
            duration:
              WRAP_DURATION_SECONDS,
            times,
            ease: "linear",
          },

          rotateY: instantAtSwitch,
          scaleX: instantAtSwitch,
          scaleY: instantAtSwitch,
          filter: instantAtSwitch,
        },
      };
    }, [
      offset,
      prevOffset,
      shift,
      moveId,
      half,
      edge,
      slotWidth,
      reduceMotion,
    ]);

  const initial = useMemo(
    () => ({
      ...getSlotLook(
        offset,
        half
      ),

      x:
        clamp(
          offset,
          -edge,
          edge
        ) *
        slotWidth *
        SLOT_SPACING,
    }),
    []
  );

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (isSelected) {
          const isSample =
            String(
              model.id
            ).startsWith(
              "fallback-"
            );

          if (model.productId) {
            navigate(
              `/product/${model.productId}`
            );
          } else if (isSample) {
            navigate("/shop");
          } else {
            navigate(
              `/product/${model.id}`
            );
          }

          return;
        }

        onSelect(model.id);
      }}
      aria-label={
        isSelected
          ? `View ${model.name}`
          : `Show ${model.name}`
      }
      aria-pressed={isSelected}
      aria-hidden={!isShown}
      tabIndex={isShown ? 0 : -1}
      initial={initial}
      animate={animate}
      transition={transition}
      style={{
        width: slotWidth,
        marginLeft: -slotWidth / 2,

        zIndex: isSelected ? 12 : 10,

        pointerEvents:
          isShown ? "auto" : "none",

        transformOrigin: "50% 100%",

        opacity:
          isSelected &&
          !alignmentReady
            ? 0
            : undefined,
      }}
      className="
        absolute
        bottom-0
        left-1/2
        flex
        items-end
        justify-center
        border-0
        bg-transparent
        p-0
        overflow-visible
      "
    >
      <div
        className={`relative w-full ${IMAGE_HEIGHT_SELECTED}`}
      >
        <AnimatePresence
          initial={false}
        >
          <motion.img
            key={`${view.side}|${view.mirror}`}
            src={view.side}
            decoding="async"
            draggable={false}
            alt=""
            initial={{
              opacity:
                swapInstantly
                  ? isSelected &&
                    hasFront
                    ? 0
                    : 1
                  : 0,
            }}
            animate={{
              opacity:
                isSelected &&
                hasFront
                  ? 0
                  : 1,

              transition: fade,
            }}
            exit={{
              opacity: 0,

              transition:
                swapInstantly
                  ? { duration: 0 }
                  : fade,
            }}
            style={{
              pointerEvents:
                "none",
            }}
            className={`absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain ${
              view.mirror
                ? "-scale-x-100"
                : ""
            }`}
          />
        </AnimatePresence>

        {hasFront && (
          <motion.img
            ref={frontImageRef}
            src={view.front}
            decoding="async"
            draggable={false}
            alt={
              isSelected
                ? model.name
                : ""
            }
            initial={false}
            animate={{
              opacity:
                isSelected
                  ? 1
                  : 0,
            }}
            transition={fade}
            style={{
              /*
                HORIZONTAL:
                Move the image so the actual feet centre,
                rather than the photo centre, sits on the
                centre of the podium.

                VERTICAL:
                Move the image so the actual bottom of the
                model's feet sits on the actual centre line
                of the podium.
              */
              translate: `
                calc(-50% + ${feetCorrection}px)
                ${verticalFeetCorrection}px
              `,

              pointerEvents:
                "none",
            }}
            className="
              absolute
              bottom-0
              left-1/2
              h-full
              w-auto
              max-w-none
              select-none
              object-contain
            "
          />
        )}
      </div>
    </motion.button>
  );
}

/* ============================================================
   HERO CAROUSEL
   ============================================================ */

function HeroCarousel({ models }) {
  const isWide = useIsWide();
  const reduceMotion =
    useReducedMotion();

  const sectionRef =
    useRef(null);

  const rowRef =
    useRef(null);

  const podiumRef =
    useRef(null);

  const count = models.length;

  const wantedVisible =
    isWide ? 5 : 3;

  const cappedVisible =
    Math.min(
      wantedVisible,
      count
    );

  const visibleCount =
    cappedVisible % 2 === 0 &&
    count > 2
      ? cappedVisible - 1
      : cappedVisible;

  const half =
    Math.floor(
      visibleCount / 2
    );

  /* ============================================================
     PODIUM ANIMATION PAUSE
     ============================================================ */

  useEffect(() => {
    const el =
      sectionRef.current;

    if (
      !el ||
      typeof IntersectionObserver ===
        "undefined"
    ) {
      return;
    }

    const io =
      new IntersectionObserver(
        ([entry]) => {
          el
            .querySelectorAll("svg")
            .forEach((svg) => {
              if (
                entry.isIntersecting
              ) {
                svg.unpauseAnimations?.();
              } else {
                svg.pauseAnimations?.();
              }
            });
        }
      );

    io.observe(el);

    return () =>
      io.disconnect();
  }, []);

  /* ============================================================
     ROW WIDTH
     ============================================================ */

  const [rowWidth, setRowWidth] =
    useState(0);

  useLayoutEffect(() => {
    const el =
      rowRef.current;

    if (!el) return;

    const measure = () =>
      setRowWidth(
        el.clientWidth
      );

    measure();

    const ro =
      new ResizeObserver(
        measure
      );

    ro.observe(el);

    return () =>
      ro.disconnect();
  }, []);

  const slotWidth =
    rowWidth /
    visibleCount;

  /* ============================================================
     PODIUM CENTER MEASUREMENT
     ============================================================

     This is the vertical equivalent of your horizontal
     feet measurement.

     We measure the actual podium on screen and use the
     podium SVG's real centre line, rather than assuming
     that the podium centre is exactly 50%.
  */

  const [podiumCenterY, setPodiumCenterY] =
    useState(null);

  useLayoutEffect(() => {
    const row =
      rowRef.current;

    const podium =
      podiumRef.current;

    if (!row || !podium) {
      return;
    }

    const measure = () => {
      const podiumRect =
        podium.getBoundingClientRect();

      /*
        The main podium ring's centre is:
          cy = 59.94
          viewBox height = 116.05
      */
      const podiumCenterRatio =
        PODIUM_RINGS[0].cy /
        116.05;

      /*
        This is the exact vertical position
        of the podium's centre in viewport
        coordinates.
      */
      const centerY =
        podiumRect.top +
        podiumRect.height *
          podiumCenterRatio;

      setPodiumCenterY(
        centerY
      );
    };

    measure();

    const ro =
      new ResizeObserver(
        measure
      );

    ro.observe(row);
    ro.observe(podium);

    window.addEventListener(
      "resize",
      measure
    );

    return () => {
      ro.disconnect();

      window.removeEventListener(
        "resize",
        measure
      );
    };
  }, []);

  /* ============================================================
     CAROUSEL STATE
     ============================================================ */

  const [nav, setNav] =
    useState(() => ({
      active:
        Math.floor(
          count / 2
        ),

      prevActive:
        Math.floor(
          count / 2
        ),

      move: 0,

      moveId: 0,
    }));

  function handleSelect(id) {
    setNav((state) => {
      const clickedIndex =
        models.findIndex(
          (model) =>
            model.id === id
        );

      const clickedOffset =
        wrapOffset(
          clickedIndex -
            state.active,
          count
        );

      if (
        clickedOffset === 0 ||
        Math.abs(
          clickedOffset
        ) > half
      ) {
        return state;
      }

      return {
        active:
          (
            (
              state.active +
              clickedOffset
            ) %
              count +
            count
          ) % count,

        prevActive:
          state.active,

        move:
          clickedOffset,

        moveId:
          state.moveId + 1,
      };
    });
  }

  /* ============================================================
     SWIPE
     ============================================================ */

  const swipeStart =
    useRef(null);

  const justSwiped =
    useRef(false);

  function goToNeighbour(
    direction
  ) {
    const at = (d) =>
      models.find(
        (_, index) =>
          wrapOffset(
            index -
              nav.active,
            count
          ) === d
      );

    const target =
      at(direction) ??
      (count === 2
        ? at(-direction)
        : undefined);

    if (target) {
      handleSelect(
        target.id
      );
    }
  }

  const swipeHandlers = {
    onPointerDown: (event) => {
      if (
        event.pointerType ===
          "mouse" ||
        !event.isPrimary
      ) {
        return;
      }

      swipeStart.current = {
        x: event.clientX,
        y: event.clientY,
      };
    },

    onPointerUp: (event) => {
      const start =
        swipeStart.current;

      swipeStart.current =
        null;

      if (!start) return;

      const dx =
        event.clientX -
        start.x;

      const dy =
        event.clientY -
        start.y;

      if (
        Math.abs(dx) <
        SWIPE_MIN_PX
      ) {
        return;
      }

      if (
        Math.abs(dx) <
        Math.abs(dy) *
          SWIPE_SIDEWAYS_RATIO
      ) {
        return;
      }

      justSwiped.current =
        true;

      window.setTimeout(
        () => {
          justSwiped.current =
            false;
        },
        350
      );

      goToNeighbour(
        dx < 0 ? 1 : -1
      );
    },

    onPointerCancel: () => {
      swipeStart.current =
        null;
    },

    onClickCapture: (
      event
    ) => {
      if (
        justSwiped.current
      ) {
        event.preventDefault();
        event.stopPropagation();

        justSwiped.current =
          false;
      }
    },

    onKeyDown: (event) => {
      if (
        event.key ===
        "ArrowRight"
      ) {
        goToNeighbour(1);
      } else if (
        event.key ===
        "ArrowLeft"
      ) {
        goToNeighbour(-1);
      }
    },
  };

  /* ============================================================
     FINISH MOVE
     ============================================================ */

  useEffect(() => {
    if (nav.moveId === 0) {
      return undefined;
    }

    const timer =
      setTimeout(() => {
        setNav((state) =>
          state.moveId ===
          nav.moveId
            ? {
                ...state,

                prevActive:
                  state.active,

                move: 0,
              }
            : state
        );
      }, WRAP_DURATION_SECONDS * 1000 + 150);

    return () =>
      clearTimeout(timer);
  }, [nav.moveId]);

  const activeModel =
    models[nav.active];

  const [podiumDelay] =
    useState(
      getPodiumAnimationDelay
    );

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-hero="true"
      data-no-rise="true"
      className="
        overflow-x-clip
        pt-16
        md:pt-20
        lg:pt-24
        pb-24
        md:pb-32
        text-center
      "
      style={{
        perspective: "1800px",
      }}
    >
      <div
        className={`
          relative
          mx-auto
          ${PAGE_CONTAINER_PADDING}
        `}
      >
        {/* ==================================================
            MODEL ROW
            ================================================== */}

        <div
          ref={rowRef}
          className={`relative w-full ${IMAGE_HEIGHT_SELECTED}`}
          style={{
            touchAction: "pan-y",
          }}
          {...swipeHandlers}
        >
          {/* ==================================================
              MODEL NAME
              ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              bottom-[87.9%]
              max-sm:bottom-[95%]
              z-0
            "
          >
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.h1
                key={activeModel.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,

                  transition:
                    reduceMotion
                      ? {
                          duration: 0,
                        }
                      : {
                          duration:
                            TEXT_IN_SECONDS,

                          delay:
                            TEXT_IN_DELAY_SECONDS,

                          ease: [
                            0.22,
                            1,
                            0.36,
                            1,
                          ],
                        },
                }}
                exit={{
                  opacity: 0,
                  y: -6,

                  transition: {
                    duration:
                      reduceMotion
                        ? 0
                        : TEXT_OUT_SECONDS,
                  },
                }}
                className="
                  font-['Raleway']
                  font-bold
                  tracking-[-0.07em]
                  text-[clamp(3rem,5vw,6rem)]
                  leading-[1.05]
                  text-[var(--maroon-dark)]
                  select-none
                  whitespace-nowrap
                "
              >
                {activeModel.name.toUpperCase()}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* ==================================================
              PODIUM
              ================================================== */}

          <div
            ref={podiumRef}
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              sm:mb-4
              bottom-[-7.2%]
              z-0
              w-[clamp(8rem,12.7vw,15.24rem)]
              max-sm:w-[47vw]
              aspect-[243.81/116.05]
            "
          >
            <div
              className="
                absolute
                inset-0
                -z-10
              "
              style={{
                background:
                  "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(76,5,25,0.05), rgba(76,5,25,0.03) 60%, transparent 80%)",
                filter: "blur(6px)",
              }}
            />

            {/* Base podium */}

            <svg
              viewBox={PODIUM_VIEWBOX}
              className="
                absolute
                inset-0
                h-full
                w-full
              "
              style={{
                opacity:
                  BASE_RING_OPACITY,
              }}
              fill="none"
            >
              {PODIUM_RINGS.map(
                (ring, i) => (
                  <ellipse
                    key={i}
                    cx={ring.cx}
                    cy={ring.cy}
                    rx={ring.rx}
                    ry={ring.ry}
                    stroke="var(--maroon-dark)"
                    strokeWidth={
                      PODIUM_STROKE_WIDTH
                    }
                    strokeDasharray={
                      PODIUM_DASH
                    }
                    strokeLinecap="round"
                  />
                )
              )}
            </svg>

            {/* Animated comet */}

            <svg
              viewBox={PODIUM_VIEWBOX}
              className="
                absolute
                inset-0
                h-full
                w-full
                overflow-visible
              "
              fill="none"
            >
              <defs>
                <linearGradient
                  id="podium-comet"
                  gradientUnits="userSpaceOnUse"
                  x1={
                    PODIUM_RINGS[0].cx -
                    PODIUM_RINGS[0].rx *
                      1.4
                  }
                  y1={
                    PODIUM_RINGS[0].cy
                  }
                  x2={
                    PODIUM_RINGS[0].cx +
                    PODIUM_RINGS[0].rx *
                      1.4
                  }
                  y2={
                    PODIUM_RINGS[0].cy
                  }
                >
                  {COMET_STOPS.map(
                    (stop, i) => (
                      <stop
                        key={i}
                        offset={
                          stop.offset
                        }
                        stopColor="var(--maroon-dark)"
                        stopOpacity={
                          stop.opacity
                        }
                      />
                    )
                  )}

                  <animateTransform
                    attributeName="gradientTransform"
                    type="rotate"
                    from={`0 ${PODIUM_RINGS[0].cx} ${PODIUM_RINGS[0].cy}`}
                    to={`360 ${PODIUM_RINGS[0].cx} ${PODIUM_RINGS[0].cy}`}
                    dur={`${SPIN_DURATION_SECONDS}s`}
                    begin={podiumDelay}
                    repeatCount="indefinite"
                  />
                </linearGradient>

                <filter
                  id="podium-glow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur
                    stdDeviation={
                      COMET_GLOW_BLUR
                    }
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {PODIUM_RINGS.map(
                (ring, i) => (
                  <ellipse
                    key={i}
                    cx={ring.cx}
                    cy={ring.cy}
                    rx={ring.rx}
                    ry={ring.ry}
                    stroke="url(#podium-comet)"
                    strokeWidth={
                      COMET_STROKE_WIDTH
                    }
                    strokeDasharray={
                      PODIUM_DASH
                    }
                    strokeLinecap="round"
                    filter="url(#podium-glow)"
                  />
                )
              )}
            </svg>

            {/* Ripple */}

            {!reduceMotion &&
              [0, 1].map(
                (ring) => (
                  <motion.svg
                    key={`idle-ripple-${ring}`}
                    viewBox={
                      PODIUM_VIEWBOX
                    }
                    className="
                      absolute
                      inset-0
                      h-full
                      w-full
                      overflow-visible
                    "
                    fill="none"
                    initial={{
                      scale: 0.92,
                      opacity: 0,
                    }}
                    animate={{
                      scale: [
                        0.92,
                        RIPPLE_END_SCALE,
                      ],

                      opacity: [
                        0,
                        RIPPLE_PEAK_OPACITY -
                          ring * 0.2,
                        0,
                      ],
                    }}
                    transition={{
                      opacity: {
                        duration:
                          RIPPLE_DURATION_SECONDS,

                        delay:
                          ring * 0.14,

                        repeat:
                          Infinity,

                        repeatDelay:
                          RIPPLE_REPEAT_GAP_SECONDS,

                        times: [
                          0,
                          0.18,
                          1,
                        ],

                        ease: "easeOut",
                      },

                      scale: {
                        duration:
                          RIPPLE_DURATION_SECONDS,

                        delay:
                          ring * 0.14,

                        repeat:
                          Infinity,

                        repeatDelay:
                          RIPPLE_REPEAT_GAP_SECONDS,

                        ease: "easeOut",
                      },
                    }}
                    style={{
                      transformOrigin:
                        "50% 50%",
                    }}
                  >
                    <ellipse
                      cx={
                        PODIUM_RINGS[0].cx
                      }
                      cy={
                        PODIUM_RINGS[0].cy
                      }
                      rx={
                        PODIUM_RINGS[0].rx
                      }
                      ry={
                        PODIUM_RINGS[0].ry
                      }
                      stroke="var(--maroon-dark)"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  </motion.svg>
                )
              )}
          </div>

          {/* ==================================================
              MODELS
              ================================================== */}

          {slotWidth > 0 &&
            models.map(
              (model, index) => (
                <HeroModel
                  key={model.id}
                  model={model}
                  offset={wrapOffset(
                    index -
                      nav.active,
                    count
                  )}
                  prevOffset={wrapOffset(
                    index -
                      nav.prevActive,
                    count
                  )}
                  shift={-nav.move}
                  moveId={nav.moveId}
                  half={half}
                  slotWidth={slotWidth}
                  reduceMotion={
                    reduceMotion
                  }
                  onSelect={
                    handleSelect
                  }
                  podiumCenterY={
                    podiumCenterY
                  }
                />
              )
            )}

          {/* ==================================================
              PRICE ROW
              ================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              top-full
              z-10
              mt-16
              md:mt-18
              max-sm:mt-12
              w-[clamp(11rem,18.75vw,22.5rem)]
              max-sm:w-full
              max-sm:px-1
            "
          >
            <AnimatePresence
              mode="wait"
              initial={false}
            >
              <motion.div
                key={activeModel.id}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,

                  transition:
                    reduceMotion
                      ? {
                          duration: 0,
                        }
                      : {
                          duration:
                            TEXT_IN_SECONDS,

                          delay:
                            TEXT_IN_DELAY_SECONDS +
                            0.06,

                          ease: [
                            0.22,
                            1,
                            0.36,
                            1,
                          ],
                        },
                }}
                exit={{
                  opacity: 0,
                  y: -4,

                  transition: {
                    duration:
                      reduceMotion
                        ? 0
                        : TEXT_OUT_SECONDS,
                  },
                }}
                className="
                  grid
                  grid-cols-3
                  items-center
                  text-xl
                  max-sm:grid-cols-[1fr_auto_1fr]
                  sm:flex
                  sm:justify-between
                "
              >
                <span
                  className="
                    uppercase
                    tracking-wide
                    max-sm:hidden
                  "
                >
                  {activeModel.name}
                </span>

                <span
                  className="
                    font-bold
                    tracking-[-0.04em]
                    max-sm:justify-self-start
                  "
                >
                  {formatNaira(
                    activeModel.price
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className="
                    sm:hidden
                    -space-y-2.5
                    flex
                    flex-col
                    max-sm:justify-self-center
                    items-center
                    text-[var(--muted)]
                  "
                >
                  <ChevronUp
                    size={18}
                    strokeWidth={1.5}
                    className="opacity-100"
                  />

                  <ChevronUp
                    size={18}
                    strokeWidth={1.5}
                    className="opacity-60"
                  />

                  <ChevronUp
                    size={18}
                    strokeWidth={1.5}
                    className="opacity-30"
                  />
                </span>

                <Link
                  to={
                    activeModel.productId
                      ? `/product/${activeModel.productId}`
                      : isSampleModel(
                            activeModel
                          )
                        ? "/shop"
                        : `/product/${activeModel.id}`
                  }
                  aria-label={`Choose a size and add ${activeModel.name} to your bag`}
                  className="
                    sm:hidden
                    pointer-events-auto
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    max-sm:justify-self-end
                    rounded-full
                    bg-[var(--mauve-light)]
                    text-[var(--ink)]
                  "
                >
                  <ShoppingBag
                    size={20}
                    strokeWidth={1.5}
                  />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HERO
   ============================================================ */

export default function Hero({
  models,
}) {
  if (!models?.length) {
    return (
      <section
        id="hero"
        data-hero="true"
        data-no-rise="true"
        className="
          pt-12
          md:pt-12
          lg:pt-14
          pb-24
          md:pb-32
        "
      >
        <div
          className={`relative mx-auto ${PAGE_CONTAINER_PADDING}`}
        >
          <div
            className={`w-full ${IMAGE_HEIGHT_SELECTED}`}
          />
        </div>
      </section>
    );
  }

  return (
    <HeroCarousel
      key={models
        .map(
          (model) =>
            model.id
        )
        .join("|")}
      models={models}
    />
  );
}