import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import model2 from "../assets/model-images/model-coral.webp";
import model3 from "../assets/model-images/model-marina.webp";
import model5 from "../assets/model-images/model-sienna.webp";
import model6 from "../assets/model-images/model-amber.webp";
import heroCenter from "../assets/reina-front.webp";

/* ============================================================
   HERO TUNING
   ============================================================ */

const SPIN_DURATION_SECONDS = 6;
const SIDE_TILT_DEGREES = 18;

/*
  Supporting models need to feel substantial like the Figma,
  but they must NOT be stretched vertically.
*/
const SUPPORT_SCALE_X = 1.12;
const SUPPORT_SCALE_Y = 1.0;

/*
  The selected model is intentionally larger.
*/
const SELECTED_SCALE_X = 1.0;
const SELECTED_SCALE_Y = 1.0;

/*
  TIP — WHY THERE IS NO "UNSELECTED HEIGHT" ANY MORE:
  Every model image is now rendered at the SELECTED height and the
  supporting ones are simply scaled down to this fraction of it. The old
  code swapped a CSS height class when a model was selected, which can't
  be animated (it snapped, and framer's `layout` had to fake the
  transition). A scale CAN be animated, so a model now grows/shrinks
  smoothly as it travels between slots.
  0.88 = the old 22rem/25rem (and 37rem/42rem) ratio between the two
  heights. Lower it to make the side models smaller.
*/
const SUPPORT_HEIGHT_RATIO = 0.88;

/*
  Side models: 3D glassy depth-of-field blur & opacity, matching the
  client's luxury reference image (SSENSE/Gucci sneakers showcase).
  Center active model stays crisp and sharp (blur: 0px, opacity: 1),
  while supporting models have soft blur and lower opacity so the
  eye naturally locks onto the center product.
*/
const SIDE_MODEL_OPACITY = 0.50;
const SIDE_MODEL_BLUR_PX = 4.5;

/*
  TIP — HOW CLOSE THE MODELS SIT (replaces the old MODEL_OVERLAP margin):
  1 = the five models are spaced exactly one fifth of the row apart.
  Below 1 pulls them closer together (0.9 = 10% tighter), above 1
  spreads them out. Only the spacing changes, not the sizes.
*/
const SLOT_SPACING = 1;

/*
  Keep the hero from becoming too wide on very large screens.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[10%]";

/* ============================================================
   ANIMATION
   ============================================================ */

// How a model glides from one slot to another.
const SELECT_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 28,
};

// A model that has to leave one edge and re-enter at the other (the
// loop-around when there are exactly 5 models) uses a timed path instead.
const WRAP_DURATION_SECONDS = 0.7;
// Fraction of that path spent leaving; the rest is spent re-entering.
const WRAP_EXIT_FRACTION = 0.45;

// Name + price: fade OUT fast as the clicked model starts moving, then
// fade IN after a short delay so it appears while the model is still
// settling into the middle — never before it has started to arrive.
const TEXT_OUT_SECONDS = 0.16;
const TEXT_IN_SECONDS = 0.35;
const TEXT_IN_DELAY_SECONDS = 0.14;

// Podium ripple: how long after the click the rings start, and how far
// they spread. Two rings, the second slightly behind the first.
const RIPPLE_DELAY_SECONDS = 0.28;
const RIPPLE_DURATION_SECONDS = 1.1;
const RIPPLE_END_SCALE = 1.9;
const RIPPLE_PEAK_OPACITY = 0.55;

/* ============================================================
   MODELS
   ============================================================

   TIP — HOW MANY MODELS:
   Add or remove entries here and the carousel adapts. Five (or three
   on a narrow screen) are ever shown at once; any beyond that wait
   invisibly at the edges and slide in as you click toward them. With
   exactly five, the one that leaves an edge re-enters from the other
   side. Use an ODD count where you can (5, 7, 9) so the middle is
   always a single model.
*/

const MODELS = [
  {
    id: "model2",
    name: "Coral",
    price: 70000,
    image: model2,
  },
  {
    id: "model6",
    name: "Amber",
    price: 70000,
    image: model6,
  },
  {
    id: "reina",
    name: "Reina",
    price: 70000,
    image: heroCenter,
  },
  {
    id: "model5",
    name: "Sienna",
    price: 70000,
    image: model5,
  },
  {
    id: "model3",
    name: "Marina",
    price: 70000,
    image: model3,
  },
];

// Which model is in the middle on first load.
const INITIAL_ACTIVE_INDEX = 2;

/* ============================================================
   RESPONSIVE MODEL COUNT
   ============================================================

   >= 1440px CSS width : all FIVE models (the Figma layout)
   <  1440px CSS width : only THREE models — the selected one plus
                         one on each side, with the exact same
                         tilt + slightly-transparent side effect.

   NOTE: this is CSS pixels, not screen resolution. A laptop set
   to 1920x1080 with Windows display scaling at 125% is really
   ~1536px wide to the browser (150% = ~1280px), which is why it
   can look different from a 1920px responsive-viewer preview.

   The initial value is read synchronously (not in an effect) so
   the page never flashes 5 models and then drops to 3 on load.
*/
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
   ============================================================

   The row is exactly as tall as the SELECTED model, and every model
   image uses this same height (supporting ones are scaled down, see
   SUPPORT_HEIGHT_RATIO).

   At 1920px: selected ≈ 650px tall, supporting ≈ 570px.
*/

const IMAGE_HEIGHT_SELECTED =
  "h-[clamp(25rem,34vw,42rem)]";

/* ============================================================
   CAROUSEL MATH
   ============================================================

   Every model has an OFFSET from the middle:
     0 = the selected one, -1 / +1 = its neighbours, -2 / +2 = the edges…
   Offsets wrap around like a loop of models, so with 5 models they are
   always -2..2 and with 7 they are -3..3.

   wrapOffset() maps any whole number back into that loop's range.
*/
function wrapOffset(value, count) {
  const lowest = -Math.floor(count / 2);
  return ((((value - lowest) % count) + count) % count) + lowest;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
  What a model looks like at a given offset. `half` is how many slots
  sit on each side of the middle that are actually SHOWN (2 wide, 1
  narrow). One slot further out than that is the invisible "waiting"
  slot — same tilt/blur, opacity 0 — so a model fades in as it slides
  into view instead of popping.
*/
function getSlotLook(offset, half) {
  const isCenter = offset === 0;
  const isShown = Math.abs(offset) <= half;

  return {
    opacity: isCenter ? 1 : isShown ? SIDE_MODEL_OPACITY : 0,
    rotateY: isCenter ? 0 : Math.sign(offset) * SIDE_TILT_DEGREES,
    scaleX: isCenter
      ? SELECTED_SCALE_X
      : SUPPORT_SCALE_X * SUPPORT_HEIGHT_RATIO,
    scaleY: isCenter
      ? SELECTED_SCALE_Y
      : SUPPORT_SCALE_Y * SUPPORT_HEIGHT_RATIO,
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
    opacity: 1,
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
}) {
  const isSelected = offset === 0;
  const isShown = Math.abs(offset) <= half;
  const edge = half + 1; // the invisible waiting slot

  const { animate, transition } = useMemo(() => {
    const look = getSlotLook(offset, half);

    // Horizontal position of a slot, capped at the waiting slot so
    // nothing is ever parked far off screen.
    const xFor = (slot) =>
      clamp(slot, -edge, edge) * slotWidth * SLOT_SPACING;

    if (reduceMotion) {
      return {
        animate: { ...look, x: xFor(offset) },
        transition: { duration: 0 },
      };
    }

    // Where this model WOULD be if the row were an endless belt.
    const beltOffset = prevOffset + shift;
    const looped = moveId > 0 && beltOffset !== offset;

    if (!looped) {
      return {
        animate: { ...look, x: xFor(offset) },
        transition: SELECT_SPRING,
      };
    }

    /*
      TIP — THE LOOP-AROUND (only happens with a small model count):
      this model is being carried off one end of the row and has to
      reappear at the other. Rather than letting it fly across the whole
      screen, it takes a 4-stop path:
        1. from where it is now …
        2. … on to the edge it was leaving, fading out
        3. instantly to the mirrored spot beyond the OTHER edge (hidden)
        4. … then slides in to its new slot, fading in
      The "instant" step is 0.1% of the path (see the times array), so
      it is never seen.
    */
    const times = [0, WRAP_EXIT_FRACTION, WRAP_EXIT_FRACTION + 0.001, 1];

    return {
      animate: {
        ...look,
        x: [
          null,
          xFor(beltOffset),
          xFor(offset - shift),
          xFor(offset),
        ],
        opacity: [null, 0, 0, look.opacity],
      },
      transition: {
        default: SELECT_SPRING,
        x: {
          duration: WRAP_DURATION_SECONDS,
          times,
          ease: ["easeIn", "linear", "easeOut"],
        },
        opacity: {
          duration: WRAP_DURATION_SECONDS,
          times,
          ease: "linear",
        },
      },
    };
  }, [offset, prevOffset, shift, moveId, half, edge, slotWidth, reduceMotion]);

  const initial = useMemo(
    () => ({
      ...getSlotLook(offset, half),
      x: clamp(offset, -edge, edge) * slotWidth * SLOT_SPACING,
    }),
    // first render only — later changes go through `animate`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(model.id)}
      aria-label={`Show ${model.name}`}
      aria-pressed={isSelected}
      aria-hidden={!isShown}
      tabIndex={isShown ? 0 : -1}
      initial={initial}
      animate={animate}
      transition={transition}
      style={{
        width: slotWidth,
        marginLeft: -slotWidth / 2,
        // the middle model sits in front of its overlapping neighbours
        zIndex: isSelected ? 12 : 10,
        pointerEvents: isShown ? "auto" : "none",
        transformOrigin: "50% 100%",
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
      <img
        src={model.image}
        decoding="async"
        draggable={false}
        alt={isSelected ? model.name : ""}
        className={`
          block
          select-none
          w-auto
          max-w-none
          shrink-0
          object-contain
          ${IMAGE_HEIGHT_SELECTED}
        `}
      />
    </motion.button>
  );
}

/* ============================================================
   HERO
   ============================================================ */

export default function Hero() {
  const isWide = useIsWide();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const rowRef = useRef(null);

  const count = MODELS.length;

  // Five slots wide, three narrow — but never more than the models we
  // have, and always odd so there is one true middle.
  const wantedVisible = isWide ? 5 : 3;
  const cappedVisible = Math.min(wantedVisible, count);
  const visibleCount =
    cappedVisible % 2 === 0 ? cappedVisible - 1 : cappedVisible;
  const half = (visibleCount - 1) / 2;

  /*
    PERFORMANCE: the podium's comet is an SVG (SMIL) animation with
    a blur filter that repaints every frame. That's fine while the
    hero is on screen, but it kept burning frames while the user
    scrolled through the rest of the page — a real contributor to
    the "laggy when I scroll" feel. Pause it whenever the hero is
    off screen, resume when it's back.
  */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(([entry]) => {
      el.querySelectorAll("svg").forEach((svg) => {
        if (entry.isIntersecting) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      });
    });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* -------------------- measure the row -------------------- */

  // Slots are spaced by the row's width, so we need it in pixels.
  // useLayoutEffect measures BEFORE the first paint, and the models
  // aren't rendered until we have a number, so nothing ever flashes
  // stacked in the middle.
  const [rowWidth, setRowWidth] = useState(0);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const measure = () => setRowWidth(el.clientWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slotWidth = rowWidth / visibleCount;

  /* -------------------- carousel state -------------------- */

  /*
    active     : index (into MODELS) of the model in the middle
    prevActive : the one that was in the middle before the last click
    move       : how many slots the clicked model travelled (its old offset)
    moveId     : goes up by one per click — used to restart the text/ripple
    Together prevActive + move let every model work out where it was
    and how far the belt moved, which is what makes multi-slot clicks
    (e.g. the far-right model) glide as ONE continuous motion.
  */
  const [nav, setNav] = useState({
    active: INITIAL_ACTIVE_INDEX,
    prevActive: INITIAL_ACTIVE_INDEX,
    move: 0,
    moveId: 0,
  });

  function handleSelect(id) {
    setNav((state) => {
      const clickedIndex = MODELS.findIndex((model) => model.id === id);
      const clickedOffset = wrapOffset(clickedIndex - state.active, count);

      // already in the middle, or not one of the shown slots
      if (clickedOffset === 0 || Math.abs(clickedOffset) > half) {
        return state;
      }

      return {
        // keep `active` a plain 0…count-1 index into MODELS
        active: (((state.active + clickedOffset) % count) + count) % count,
        prevActive: state.active,
        move: clickedOffset,
        moveId: state.moveId + 1,
      };
    });
  }

  // Once a move has finished, forget it — otherwise a later window
  // resize would replay the loop-around path for models that wrapped.
  useEffect(() => {
    if (nav.moveId === 0) return undefined;

    const timer = setTimeout(() => {
      setNav((state) =>
        state.moveId === nav.moveId
          ? { ...state, prevActive: state.active, move: 0 }
          : state
      );
    }, WRAP_DURATION_SECONDS * 1000 + 150);

    return () => clearTimeout(timer);
  }, [nav.moveId]);

  const activeModel = MODELS[nav.active];

  // The podium's spin phase is fixed once so re-renders don't restart it.
  const [podiumDelay] = useState(getPodiumAnimationDelay);

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-hero="true"
      data-no-rise="true"
      className="
        pt-8
        md:pt-12
        lg:pt-14
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
            MODEL ROW — five models at >= 1440px, three below.
            TIP: this row is a fixed-height stage. The models,
            name, podium and price are all positioned inside it,
            so the name/podium/price stay put while the models
            slide past them.
            ================================================== */}

        <div
          ref={rowRef}
          className={`relative w-full ${IMAGE_HEIGHT_SELECTED}`}
        >

          {/* ==============================================
              MODEL NAME — fades out, then the new one fades in
              ============================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              bottom-[87.9%]
              z-0
            "
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={activeModel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: TEXT_IN_SECONDS,
                        delay: TEXT_IN_DELAY_SECONDS,
                        ease: [0.22, 1, 0.36, 1],
                      },
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  transition: {
                    duration: reduceMotion ? 0 : TEXT_OUT_SECONDS,
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

          {/* ==============================================
              PODIUM — stays put; a ripple leaves it whenever
              a new model lands
              ============================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2

              bottom-[-7.2%]

              z-0

              w-[clamp(8rem,12.7vw,15.24rem)]

              aspect-[243.81/116.05]
            "
          >

            {/* Soft floor glow */}
            <div
              className="
                absolute
                inset-0
                -z-10
              "
              style={{
                background:
                  "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(76,5,25,0.35), rgba(76,5,25,0.08) 60%, transparent 80%)",
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
                    PODIUM_RINGS[0].rx * 1.4
                  }
                  y1={
                    PODIUM_RINGS[0].cy
                  }
                  x2={
                    PODIUM_RINGS[0].cx +
                    PODIUM_RINGS[0].rx * 1.4
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

            {/*
              RIPPLE — TIP: `key={nav.moveId}` makes React throw the
              old rings away and mount fresh ones on every click, which
              is what restarts the animation. Each ring starts invisible
              at the outer podium's size, fades up quickly, then grows
              and fades out. vectorEffect="non-scaling-stroke" keeps the
              line a constant thin width while the ring scales. To make
              it subtler lower RIPPLE_PEAK_OPACITY or RIPPLE_END_SCALE;
              for a wider spread raise RIPPLE_END_SCALE.
            */}
            {!reduceMotion && nav.moveId > 0 && [0, 1].map((ring) => (
              <motion.svg
                key={`${nav.moveId}-${ring}`}
                viewBox={PODIUM_VIEWBOX}
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  overflow-visible
                "
                fill="none"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{
                  scale: [0.92, RIPPLE_END_SCALE],
                  opacity: [0, RIPPLE_PEAK_OPACITY - ring * 0.2, 0],
                }}
                transition={{
                  // opacity: 0 → peak (quickly) → 0; scale: just grows
                  opacity: {
                    duration: RIPPLE_DURATION_SECONDS,
                    delay: RIPPLE_DELAY_SECONDS + ring * 0.14,
                    times: [0, 0.18, 1],
                    ease: "easeOut",
                  },
                  scale: {
                    duration: RIPPLE_DURATION_SECONDS,
                    delay: RIPPLE_DELAY_SECONDS + ring * 0.14,
                    ease: "easeOut",
                  },
                }}
                style={{ transformOrigin: "50% 50%" }}
              >
                <ellipse
                  cx={PODIUM_RINGS[0].cx}
                  cy={PODIUM_RINGS[0].cy}
                  rx={PODIUM_RINGS[0].rx}
                  ry={PODIUM_RINGS[0].ry}
                  stroke="var(--maroon-dark)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </motion.svg>
            ))}
          </div>

          {/* ==============================================
              THE MODELS — each one is placed by its offset
              from the middle and glides between slots
              ============================================== */}

          {slotWidth > 0 &&
            MODELS.map((model, index) => (
              <HeroModel
                key={model.id}
                model={model}
                offset={wrapOffset(index - nav.active, count)}
                prevOffset={wrapOffset(index - nav.prevActive, count)}
                shift={-nav.move}
                moveId={nav.moveId}
                half={half}
                slotWidth={slotWidth}
                reduceMotion={reduceMotion}
                onSelect={handleSelect}
              />
            ))}

          {/* ==============================================
              PRICE ROW — same fade-out / fade-in as the name
              ============================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              top-full
              z-10

              mt-7

              w-[clamp(11rem,18.75vw,22.5rem)]
            "
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeModel.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: TEXT_IN_SECONDS,
                        delay: TEXT_IN_DELAY_SECONDS + 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      },
                }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: {
                    duration: reduceMotion ? 0 : TEXT_OUT_SECONDS,
                  },
                }}
                className="
                  flex
                  items-center
                  justify-between

                  text-xl
                "
              >
                <span
                  className="
                    uppercase
                    tracking-wide
                  "
                >
                  {activeModel.name}
                </span>

                <span
                  className="
                    font-bold
                    tracking-[-0.04em]
                  "
                >
                  {formatNaira(
                    activeModel.price
                  )}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}