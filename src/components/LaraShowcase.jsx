import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { motion, useInView } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE

   Two distinct behaviors:

   1) PINNED SCRUB
      - wordmark + 3 scattered photos + paragraph
      - progress is derived directly from scroll position
      - every visual value is a pure function of progress
      - photos enter ONE AT A TIME
      - once the photo sequence is complete, Lara fades out
      - paragraph fades in and reveals word-by-word

   2) NORMAL-FLOW REVIEWS
      - reviews are completely independent from Lara's animation
      - reviews animate when their own section enters the viewport
      - reviews do not use Lara's progress value

   ONE-TIME-ONLY BEHAVIOR:
   - after the Lara reveal completes during this page visit,
     the showcase permanently switches to normal-flow markup
   - a full page refresh resets the animation
   ============================================================ */

/* ============================================================
   GENERAL SETTINGS
   ============================================================ */

/*
  The pinned Lara animation now occupies the FULL viewport.

  Previously this was 66px because the animation was intentionally
  positioned below the navbar.

  The animation itself now starts at the very top of the viewport,
  so the navbar is covered while the animation is active.
*/
const PIN_TOP_PX = 0;

/*
  This needs to be higher than the navbar's z-index so that the
  pinned Lara animation visually becomes the only thing on screen.
*/
const PIN_Z_INDEX = 100;

/*
  Scroll track for the PIN ONLY.

  Reviews are NOT inside this track.
*/
const TRACK_VH = 1200;

/* ============================================================
   PROGRESS MAP
   ============================================================ */

/*
  0.00 → 0.03   wordmark fades in
  0.03 → 0.21   photo 1
  0.21 → 0.39   photo 2
  0.39 → 0.57   photo 3
  0.57 → 0.66   hold
  0.66 → 0.72   Lara + photos exit
  0.72 → 0.74   paragraph container enters
  0.74 → 0.94   paragraph words reveal
  0.94 → 1.00   paragraph holds
*/

const WORDMARK_FADE_IN_END = 0.03;

const PHOTO_RANGES = [
  {
    start: 0.03,
    end: 0.21,
  },
  {
    start: 0.21,
    end: 0.39,
  },
  {
    start: 0.39,
    end: 0.57,
  },
];

const LARA_HOLD_END = 0.66;
const LARA_EXIT_END = 0.72;

const PARAGRAPH_CONTAINER_FADE_START = 0.7;
const PARAGRAPH_CONTAINER_FADE_END = 0.73;

const PARAGRAPH_WORDS_START = 0.74;
const PARAGRAPH_WORDS_END = 0.94;

const RELEASE_AT = 0.995;

/* ============================================================
   PHOTO ENTRANCE TUNING
   ============================================================ */

const PHOTO_ENTER_START_SCALE = 3.6;
const PHOTO_ENTER_SIDE_DISTANCE = 850;
const PHOTO_ENTER_SPIN_OFFSET = 12;

/* ============================================================
   HELPERS
   ============================================================ */

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/*
  Resolves the opacity of the Lara scene from scroll progress.
*/
function sceneOpacity(progress) {
  if (progress <= WORDMARK_FADE_IN_END) {
    return clamp01(progress / WORDMARK_FADE_IN_END);
  }

  if (
    progress >= LARA_HOLD_END &&
    progress <= LARA_EXIT_END
  ) {
    return (
      1 -
      clamp01(
        (progress - LARA_HOLD_END) /
          (LARA_EXIT_END - LARA_HOLD_END)
      )
    );
  }

  if (progress > LARA_EXIT_END) {
    return 0;
  }

  return 1;
}

function paragraphContainerOpacity(progress) {
  if (progress < PARAGRAPH_CONTAINER_FADE_START) {
    return 0;
  }

  if (progress < PARAGRAPH_CONTAINER_FADE_END) {
    return clamp01(
      (progress - PARAGRAPH_CONTAINER_FADE_START) /
        (PARAGRAPH_CONTAINER_FADE_END -
          PARAGRAPH_CONTAINER_FADE_START)
    );
  }

  return 1;
}

/*
  Resolves the complete visual state for one scattered photo.
*/
function getPhotoState(photo, range, progress) {
  const localT = clamp01(
    (progress - range.start) /
      (range.end - range.start)
  );

  const eased = easeInOutCubic(localT);

  const hasAppeared = progress >= range.start;

  const fadeIn = clamp01(
    (progress - range.start) / 0.02
  );

  const opacity = hasAppeared ? fadeIn : 0;

  let startX = 0;
  let startY = 0;

  if (photo.enterDirection === "left") {
    startX = -PHOTO_ENTER_SIDE_DISTANCE;
  }

  if (photo.enterDirection === "right") {
    startX = PHOTO_ENTER_SIDE_DISTANCE;
  }

  if (photo.enterDirection === "bottom") {
    startY = PHOTO_ENTER_SIDE_DISTANCE;
  }

  const x = lerp(startX, photo.finalX, eased);
  const y = lerp(startY, photo.finalY, eased);

  const scale = lerp(
    PHOTO_ENTER_START_SCALE,
    1,
    eased
  );

  const spinOffset =
    photo.enterDirection === "left"
      ? -PHOTO_ENTER_SPIN_OFFSET
      : PHOTO_ENTER_SPIN_OFFSET;

  const finalRotate = -photo.figmaAngle;
  const startRotate =
    finalRotate + spinOffset;

  const rotate = lerp(
    startRotate,
    finalRotate,
    eased
  );

  return {
    opacity,
    x,
    y,
    scale,
    rotate,
  };
}

/* ============================================================
   PARAGRAPHS
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",
  "We don't keep a stockroom.",
  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",
  "This isn't fast fashion. It's handmade, made with love.",
];

function buildWordParagraphs(paragraphs) {
  let globalIndex = 0;

  const result = paragraphs.map((paragraph) =>
    paragraph.split(" ").map((word) => ({
      word,
      index: globalIndex++,
    }))
  );

  return {
    result,
    totalWords: globalIndex,
  };
}

/* ============================================================
   REVIEWS
   ============================================================ */

const TESTIMONIALS = [
  {
    quote:
      "I've never had a piece fit this well straight out of the box. Literally made to my measurements. No alterations needed.",
    name: "Teniola Aladese",
  },
  {
    quote:
      "You can tell this isn't machine-made. The detail in the stitching is unreal.",
    name: "Tolu Coker",
  },
  {
    quote:
      "The bikini set held up through an entire beach trip. No stretching, no losing shape. Genuinely impressed.",
    name: "Halima Finny",
  },
  {
    quote:
      "The Reina dress is a whole moment. I get stopped every single time I wear it.",
    name: "Chidinma K.",
  },
  {
    quote:
      "Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.",
    name: "Precious Ehizoge",
  },
  {
    quote:
      "Customer service walked me through sizing so patiently. Made ordering online feel less scary.",
    name: "Ejiro Okezie",
  },
  {
    quote:
      "Every detail felt intentional. You can really see the care that went into making the piece.",
    name: "Amaka O.",
  },
  {
    quote:
      "The fit was beautiful and the finishing was even better in person.",
    name: "Nora E.",
  },
  {
    quote:
      "I loved being able to choose the colour and get something made specifically for me.",
    name: "Zainab A.",
  },
];

/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    id: "back",
    src: scatterStreet,
    alt: "Street-style portrait",
    width: 175.59958036211256,
    height: 103.72863095475553,
    figmaAngle: -19.63,
    enterDirection: "bottom",
    zIndex: 1,
    finalX: 0,
    finalY: -25,
  },
  {
    id: "middle",
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",
    width: 175.59957885742188,
    height: 103.72863006591797,
    figmaAngle: 0,
    enterDirection: "left",
    zIndex: 2,
    finalX: -7,
    finalY: 0,
  },
  {
    id: "front",
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",
    width: 175.59957556823136,
    height: 103.72862812295645,
    figmaAngle: 8.21,
    enterDirection: "right",
    zIndex: 3,
    finalX: 0,
    finalY: 4,
  },
];

/* ============================================================
   WORDMARK / LAYOUT
   ============================================================ */

const WORDMARK_CONTAINER_WIDTH =
  "clamp(760px, 56vw, 1080px)";

const PHOTO_WIDTH_PX = 175.6;

const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";

/* ============================================================
   ONE-TIME PAGE VISIT STATE
   ============================================================ */

let showcaseCompletedThisPageVisit = false;

/* ============================================================
   REVIEWS COMPONENT
   ============================================================ */

/*
  Reviews are deliberately separated into their own component.

  This means the reviews have their own viewport observer and
  animation lifecycle. Nothing inside this component reads Lara's
  `progress`, `pinState`, or completion state.
*/

/* ============================================================
   REVIEWS COMPONENT
   ============================================================ */

/*
  Reviews are completely independent from the Lara animation.

  IMPORTANT:
  - No Lara progress is used here.
  - No liveCompleted state is used here.
  - Framer Motion handles viewport detection directly.
  - The section fades/slides in when it enters the viewport.
  - Each review card animates with a stagger.
*/

function ReviewsSection({ reduceMotion }) {
  return (
    <motion.section
      className={`w-full bg-[var(--cream)] pb-2 pt-16 md:pt-24 ${PAGE_CONTAINER_PADDING}`}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 45,
            }
      }
      whileInView={
        reduceMotion
          ? undefined
          : {
              opacity: 1,
              y: 0,
            }
      }
      viewport={{
        once: true,
        amount: 0.05,
      }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 pb-18 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <motion.div
            key={`${testimonial.name}-${index}`}
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 35,
                    scale: 0.97,
                  }
            }
            whileInView={
              reduceMotion
                ? undefined
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }
            }
            viewport={{
              once: true,
              amount: 0.05,
            }}
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 0.75,
                    delay:
                      0.1 +
                      (index % 3) * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
            className={`min-h-[190px] border border-[var(--line)] bg-[var(--cream)] p-5 text-center ${
              index % 3 === 1
                ? "lg:-translate-y-5"
                : ""
            }`}
          >
            {/* Review quote */}
            <p className="mb-5 text-[15px] leading-[1.65] text-[var(--ink)]">
              "{testimonial.quote}"
            </p>

            {/* Customer name */}
            <p className="flex items-center justify-center gap-1 text-sm font-bold text-[var(--ink)]">
              {testimonial.name}

              {/* Verified badge */}
              <span
                aria-hidden="true"
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-[9px] text-white"
              >
                ✓
              </span>
            </p>

            {/* Verification label */}
            <p className="mt-1 text-xs text-[var(--muted)]">
              Verified Customer
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);
  const pendingScrollFixRef = useRef(null);

  /*
    If the animation was already completed earlier during this
    page visit, immediately use the static version.
  */
  const [renderCompactFromStart] = useState(
    () => showcaseCompletedThisPageVisit
  );

  const [progress, setProgress] = useState(
    renderCompactFromStart ? 1 : 0
  );

  const [pinState, setPinState] = useState(
    renderCompactFromStart
      ? "after"
      : "before"
  );

  const [liveCompleted, setLiveCompleted] =
    useState(false);

  const [reduceMotion, setReduceMotion] =
    useState(false);

  const {
    result: wordParagraphs,
    totalWords,
  } = useMemo(
    () => buildWordParagraphs(PARAGRAPHS),
    []
  );

  /* -------------------- reduced motion -------------------- */

  useEffect(() => {
    const mq = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    setReduceMotion(mq.matches);

    const onChange = (event) =>
      setReduceMotion(event.matches);

    mq.addEventListener?.(
      "change",
      onChange
    );

    return () =>
      mq.removeEventListener?.(
        "change",
        onChange
      );
  }, []);

  /* -------------------- scroll-position fix -------------------- */

  useLayoutEffect(() => {
    if (
      !liveCompleted ||
      renderCompactFromStart
    ) {
      return;
    }

    const pending =
      pendingScrollFixRef.current;

    if (!pending) {
      return;
    }

    const newScrollHeight =
      document.documentElement
        .scrollHeight;

    const delta =
      pending.scrollHeight -
      newScrollHeight;

    if (delta !== 0) {
      window.scrollTo(
        0,
        pending.scrollY - delta
      );
    }

    pendingScrollFixRef.current = null;
  }, [
    liveCompleted,
    renderCompactFromStart,
  ]);

  /* -------------------- measure + scroll track -------------------- */

  useEffect(() => {
    /*
      Once the Lara reveal completes, this section becomes
      permanent static content for the current page visit.
    */
    if (
      renderCompactFromStart ||
      reduceMotion ||
      liveCompleted
    ) {
      return;
    }

    const measure = () => {
      if (contentRef.current) {
        contentHeightRef.current =
          contentRef.current.offsetHeight;
      }
    };

    measure();

    const ro = new ResizeObserver(
      measure
    );

    if (contentRef.current) {
      ro.observe(
        contentRef.current
      );
    }

    window.addEventListener(
      "resize",
      measure
    );

    window.addEventListener(
      "load",
      measure
    );

    const tick = () => {
      const wrapper =
        wrapperRef.current;

      if (wrapper) {
        const rect =
          wrapper.getBoundingClientRect();

        const contentHeight =
          contentHeightRef.current;

        const pinnableRange =
          rect.height -
          contentHeight;

        let nextState;
        let next;

        /*
          Before the animation reaches the top of the viewport,
          keep it in normal document flow.

          Once its top reaches 0px, the animation takes over the
          complete viewport, including the area normally occupied
          by the navbar.
        */
        if (rect.top > PIN_TOP_PX) {
          nextState = "before";

          const approachWindow =
            window.innerHeight * 0.8;

          const distanceToEngage =
            rect.top - PIN_TOP_PX;

          const approachT = clamp01(
            1 -
              distanceToEngage /
                approachWindow
          );

          next =
            approachT *
            WORDMARK_FADE_IN_END;
        } else if (
          rect.bottom <=
          PIN_TOP_PX +
            contentHeight
        ) {
          nextState = "after";

          next = 1;

          afterTopRef.current =
            Math.max(
              0,
              rect.height -
                contentHeight
            );
        } else {
          nextState = "pinned";

          next =
            pinnableRange > 0
              ? clamp01(
                  (PIN_TOP_PX -
                    rect.top) /
                    pinnableRange
                )
              : 1;
        }

        setPinState(
          (previous) =>
            previous === nextState
              ? previous
              : nextState
        );

        setProgress(next);

        /*
          Complete the live animation only after the full
          paragraph reveal has reached its end.
        */
        if (
          next >= RELEASE_AT &&
          !showcaseCompletedThisPageVisit
        ) {
          pendingScrollFixRef.current = {
            scrollY: window.scrollY,
            scrollHeight:
              document.documentElement
                .scrollHeight,
          };

          showcaseCompletedThisPageVisit =
            true;

          setLiveCompleted(true);
        }
      }

      rafRef.current =
        requestAnimationFrame(
          tick
        );
    };

    rafRef.current =
      requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(
        rafRef.current
      );

      ro.disconnect();

      window.removeEventListener(
        "resize",
        measure
      );

      window.removeEventListener(
        "load",
        measure
      );
    };
  }, [
    renderCompactFromStart,
    reduceMotion,
    liveCompleted,
  ]);

  const p =
    reduceMotion ||
    renderCompactFromStart ||
    liveCompleted
      ? 1
      : progress;

  const scene =
    sceneOpacity(p);

  const paragraphContainer =
    paragraphContainerOpacity(p);

  const paragraphWordsT =
    clamp01(
      (p -
        PARAGRAPH_WORDS_START) /
        (PARAGRAPH_WORDS_END -
          PARAGRAPH_WORDS_START)
    );

  /* ============================================================
     STATIC LARA MARKUP
     ============================================================ */

  const laraAndParagraphStatic = (
    <div
      className={`w-full ${PAGE_CONTAINER_PADDING}`}
    >
      <div className="mx-auto w-full max-w-[1080px]">
        {/* Static Lara wordmark + photos */}
        <div className="relative flex items-center justify-center pb-10 pt-8 md:pb-14">
          <div
            className="relative w-full"
            style={{
              maxWidth:
                WORDMARK_CONTAINER_WIDTH,
            }}
          >
            <img
              src={laraDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
              style={{
                width: "100vw",
              }}
            />

            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="relative z-10 block h-auto w-full select-none"
            />

            {/* Static scattered photos */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-20"
              style={{
                width: `${PHOTO_WIDTH_PX}px`,
                height:
                  "103.72863006591797px",
                transform:
                  "translate(-50%, -50%)",
              }}
            >
              {SCATTER_PHOTOS.map(
                (photo) => (
                  <img
                    key={photo.id}
                    src={photo.src}
                    alt={photo.alt}
                    className="absolute block select-none"
                    style={{
                      left: `${photo.finalX}px`,
                      top: `${photo.finalY}px`,
                      width: `${photo.width}px`,
                      height: `${photo.height}px`,
                      transform: `rotate(${-photo.figmaAngle}deg)`,
                      transformOrigin:
                        "50% 50%",
                      zIndex:
                        photo.zIndex,
                      objectFit: "cover",
                    }}
                  />
                )
              )}
            </div>
          </div>
        </div>

        {/* Static paragraph */}
        <div className="flex items-center justify-center pb-16 pt-10 md:pb-20 md:pt-16">
          <div className="mx-auto max-w-2xl text-center text-[16px] leading-[1.7] text-[var(--ink)] md:max-w-3xl">
            {PARAGRAPHS.map(
              (
                paragraph,
                index
              ) => (
                <p
                  key={index}
                  className={
                    index ===
                    PARAGRAPHS.length -
                      1
                      ? "mt-8"
                      : "mb-6"
                  }
                >
                  {paragraph}
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ============================================================
     STATIC VERSION
     ============================================================ */

  if (
    renderCompactFromStart ||
    reduceMotion ||
    liveCompleted
  ) {
    return (
      <>
        <section className="w-full bg-[var(--cream)]">
          {laraAndParagraphStatic}
        </section>

        <ReviewsSection
          reduceMotion={reduceMotion}
        />
      </>
    );
  }

  /* ============================================================
     ANIMATED PIN MODE
     ============================================================ */

  let containerStyle;

  if (pinState === "before") {
    containerStyle = {
      position: "relative",
      height: "100vh",
    };
  } else if (
    pinState === "pinned"
  ) {
    /*
      Full-screen pin.

      IMPORTANT:
      - top is 0
      - height is 100vh
      - zIndex is above the navbar

      This makes the Lara animation the only visible page layer
      while the pinned sequence is running.
    */
    containerStyle = {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "100vh",
      zIndex: PIN_Z_INDEX,
    };
  } else {
    containerStyle = {
      position: "absolute",
      top: afterTopRef.current,
      left: 0,
      right: 0,
      height: "100vh",
      zIndex: PIN_Z_INDEX,
    };
  }

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
  };

  return (
    <>
      {/* ========================================================
          ANIMATED LARA TRACK
          ======================================================== */}

      <section
        ref={wrapperRef}
        className="relative w-full bg-[var(--cream)]"
        style={{
          height: `${TRACK_VH}vh`,
        }}
      >
        <div
          ref={contentRef}
          className="w-full bg-[var(--cream)]"
          style={containerStyle}
        >
          <div className="relative h-full w-full">
            {/* ==================================================
                LARA + PHOTOS
                ================================================== */}

            <div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: scene,
                pointerEvents:
                  "none",
              }}
            >
              <div
                className="relative mx-auto w-full"
                style={{
                  maxWidth:
                    WORDMARK_CONTAINER_WIDTH,
                }}
              >
                {/* Decorative Lara background */}
                <img
                  src={laraDecor}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{
                    width: "100vw",
                  }}
                />

                {/* Lara wordmark */}
                <img
                  src={laraWordmark}
                  alt="Lara's Crochet"
                  className="relative z-10 block h-auto w-full select-none pointer-events-none"
                />

                {/* Animated scattered photos */}
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 overflow-visible"
                  style={{
                    width: `${PHOTO_WIDTH_PX}px`,
                    height:
                      "103.72863006591797px",
                    transform:
                      "translate(-50%, -50%)",
                  }}
                >
                  {SCATTER_PHOTOS.map(
                    (
                      photo,
                      index
                    ) => {
                      const state =
                        getPhotoState(
                          photo,
                          PHOTO_RANGES[
                            index
                          ],
                          p
                        );

                      return (
                        <img
                          key={photo.id}
                          src={photo.src}
                          alt={photo.alt}
                          className="absolute block select-none"
                          style={{
                            left: `${photo.finalX}px`,
                            top: `${photo.finalY}px`,
                            width: `${photo.width}px`,
                            height: `${photo.height}px`,
                            zIndex:
                              photo.zIndex,
                            transformOrigin:
                              "50% 50%",
                            objectFit:
                              "cover",
                            opacity:
                              state.opacity *
                              scene,
                            transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale}) rotate(${state.rotate}deg)`,
                          }}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* ==================================================
                PARAGRAPH
                ================================================== */}

            <div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity:
                  paragraphContainer,
                pointerEvents:
                  "none",
              }}
            >
              <div className="mx-auto max-w-2xl text-center text-[16px] leading-[1.7] text-[var(--ink)] md:max-w-3xl">
                {wordParagraphs.map(
                  (
                    words,
                    paragraphIndex
                  ) => (
                    <p
                      key={
                        paragraphIndex
                      }
                      className={
                        paragraphIndex ===
                        wordParagraphs.length -
                          1
                          ? "mt-8"
                          : "mb-6"
                      }
                    >
                      {words.map(
                        ({
                          word,
                          index,
                        }) => {
                          const wordT =
                            clamp01(
                              (paragraphWordsT -
                                index /
                                  totalWords) /
                                (1 /
                                  totalWords)
                            );

                          return (
                            <span
                              key={index}
                              style={{
                                opacity:
                                  wordT,
                              }}
                            >
                              {word}{" "}
                            </span>
                          );
                        }
                      )}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          REVIEWS
          ======================================================== */}

      <ReviewsSection
        reduceMotion={reduceMotion}
      />
    </>
  );
}