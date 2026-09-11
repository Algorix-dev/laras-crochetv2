import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Long enough scroll distance for:
  - wordmark
  - photo 1
  - photo 2
  - photo 3
  - paragraph
  - testimonials
*/
const TRACK_VH = 620;

/* ============================================================
   STAGE TIMELINE
   ============================================================ */

const STAGE = {
  wordmark: { start: 0.0, end: 0.42 },
  paragraph: { start: 0.47, end: 0.72 },
  testimonials: { start: 0.77, end: 1.0 },
};

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.15,
  exitFrac: 0.3,
  travel: 70,
};

/* ============================================================
   PHOTO ENTRANCE ANIMATION
   ============================================================ */

/*
  Each photo gets a full entrance animation.

  The important thing here is that the trigger points are
  separated enough so the three photos don't appear together.

  Sequence:

    1. BACK
    2. MIDDLE
    3. FRONT

  Each one starts:
    - 1.75x larger
    - off to the side
    - slightly more rotated

  Then it:
    - moves into position
    - shrinks to 1x
    - settles into its final rotation
*/
const PHOTO_ENTER_DURATION_S = 2.8;
const PHOTO_ENTER_START_SCALE = 1.75;
const PHOTO_ENTER_SIDE_DISTANCE = 520;
const PHOTO_ENTER_SPIN_OFFSET = 18;

/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;

/*
  This controls how much the Lara wordmark is allowed to grow
  during its own entrance.
*/
const WORDMARK_START_SCALE = 1.5;

/* ============================================================
   PAGE WIDTH
   ============================================================ */

const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";

/* ============================================================
   HELPERS
   ============================================================ */

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function computeSlide(
  progress,
  start,
  end,
  { enterFrac, holdFrac, exitFrac, travel }
) {
  const span = end - start;

  const local = clamp01(
    (progress - start) / span
  );

  const enterEnd = enterFrac;
  const holdEnd = enterFrac + holdFrac;

  if (local <= enterEnd) {
    const enterT =
      enterFrac > 0
        ? clamp01(local / enterFrac)
        : 1;

    const eased = easeOutCubic(enterT);

    return {
      opacity: eased,
      translateY: (1 - eased) * travel,
      enterT,
    };
  }

  if (local <= holdEnd) {
    return {
      opacity: 1,
      translateY: 0,
      enterT: 1,
    };
  }

  const exitT =
    exitFrac > 0
      ? clamp01(
          (local - holdEnd) / exitFrac
        )
      : 1;

  const eased = easeOutCubic(exitT);

  return {
    opacity: 1 - eased,
    translateY: -eased * travel,
    enterT: 1,
  };
}

/* ============================================================
   WORD PARAGRAPHS
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

/*
  Flatten all paragraph words into one continuous sequence so
  the text reveals progressively rather than paragraph-by-
  paragraph.
*/
function buildWordParagraphs(paragraphs) {
  let globalIndex = 0;

  const result = paragraphs.map((paragraph) =>
    paragraph
      .split(" ")
      .map((word) => ({
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
   TESTIMONIALS
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
      "[Placeholder review — swap for a real quote from Lara]",
    name: "Placeholder Name 1",
  },

  {
    quote:
      "[Placeholder review — swap for a real quote from Lara]",
    name: "Placeholder Name 2",
  },

  {
    quote:
      "[Placeholder review — swap for a real quote from Lara]",
    name: "Placeholder Name 3",
  },
];

/* ============================================================
   WORDMARK PHOTOS — EXACT FIGMA MEASUREMENTS
   ============================================================ */

/*
  Figma frame:
    1920 × 1176

  IMPORTANT:
  These are the three photos only.

  We keep the exact:
    width
    height
    left
    top
    angle

  from your Figma design.
*/

const PHOTO_ASPECT_RATIO =
  "175.59957556823136 / 103.72862812295645";

const SCATTER_PHOTOS = [
  {
    id: "back",

    src: scatterStreet,

    alt: "Street-style portrait",

    width: 175.59958036211256,
    height: 103.72863095475553,

    left: 866.81,
    top: 92.77,

    /*
      Figma:
        -19.63° = clockwise
    */
    figmaAngle: -19.63,

    zIndex: 1,

    /*
      First photo.
    */
    enterSide: "left",
    enterStart: 0.08,
  },

  {
    id: "middle",

    src: scatterBeach,

    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    width: 175.59957885742188,
    height: 103.72863006591797,

    left: 860.18,
    top: 119.27,

    /*
      Figma:
        0° = straight
    */
    figmaAngle: 0,

    zIndex: 2,

    /*
      Second photo.
    */
    enterSide: "right",
    enterStart: 0.36,
  },

  {
    id: "front",

    src: scatterTeal,

    alt:
      "Lara's Crochet customer wearing a teal crochet dress",

    width: 175.59957556823136,
    height: 103.72862812295645,

    left: 866.92,
    top: 114.87,

    /*
      Figma:
        +8.21° = anti-clockwise
    */
    figmaAngle: 8.21,

    zIndex: 3,

    /*
      Third photo.
    */
    enterSide: "left",
    enterStart: 0.64,
  },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] =
    useState(false);

  /*
    Tracks which photos have already been triggered.

    Once a photo enters, it is allowed to finish its
    complete animation even if the user scrolls quickly.
  */
  const [enteredPhotos, setEnteredPhotos] =
    useState({});

  const {
    result: wordParagraphs,
    totalWords,
  } = useMemo(
    () => buildWordParagraphs(PARAGRAPHS),
    []
  );

  /* ==========================================================
     REDUCED MOTION
     ========================================================== */

  useEffect(() => {
    const mq = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    setReduceMotion(mq.matches);

    const onChange = (e) => {
      setReduceMotion(e.matches);
    };

    mq.addEventListener?.(
      "change",
      onChange
    );

    return () => {
      mq.removeEventListener?.(
        "change",
        onChange
      );
    };
  }, []);

  /* ==========================================================
     SCROLL / PINNING
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) return;

    const measure = () => {
      if (contentRef.current) {
        contentHeightRef.current =
          contentRef.current.offsetHeight;
      }
    };

    measure();

    const ro = new ResizeObserver(measure);

    if (contentRef.current) {
      ro.observe(contentRef.current);
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
      const wrapper = wrapperRef.current;

      if (wrapper) {
        const rect =
          wrapper.getBoundingClientRect();

        const contentHeight =
          contentHeightRef.current;

        const pinnableRange =
          rect.height - contentHeight;

        let nextState;
        let next;

        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          next = 0;
        } else if (
          rect.bottom <=
          NAVBAR_HEIGHT_PX +
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
                  (NAVBAR_HEIGHT_PX -
                    rect.top) /
                    pinnableRange
                )
              : 1;
        }

        setPinState((prev) =>
          prev === nextState
            ? prev
            : nextState
        );

        setProgress(next);
      }

      rafRef.current =
        requestAnimationFrame(tick);
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
  }, [reduceMotion]);

  /* ==========================================================
     CURRENT PROGRESS
     ========================================================== */

  const p = reduceMotion
    ? 1
    : progress;

  const wordmarkSlide =
    computeSlide(
      p,
      STAGE.wordmark.start,
      STAGE.wordmark.end,
      SLIDE_PHASES
    );

  const paragraphSlide =
    computeSlide(
      p,
      STAGE.paragraph.start,
      STAGE.paragraph.end,
      SLIDE_PHASES
    );

  const testimonialsSlide =
    computeSlide(
      p,
      STAGE.testimonials.start,
      STAGE.testimonials.end,
      SLIDE_PHASES
    );

  /* ==========================================================
     WORDMARK ANIMATION
     ========================================================== */

  const wordmarkFadeT = reduceMotion
    ? 1
    : easeOutCubic(
        clamp01(
          wordmarkSlide.enterT /
            WORDMARK_FADE_ENTER_END
        )
      );

  /*
    Lara starts large and settles to normal size.
  */
  const wordmarkScale = reduceMotion
    ? 1
    : WORDMARK_START_SCALE -
      (WORDMARK_START_SCALE - 1) *
        wordmarkFadeT;

  /* ==========================================================
     PHOTO TRIGGERS
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      If the user goes back above the wordmark stage,
      reset the photos so the sequence can replay.
    */
    if (
      wordmarkSlide.enterT <= 0.02
    ) {
      setEnteredPhotos({});
      return;
    }

    setEnteredPhotos((prev) => {
      let changed = false;

      const next = {
        ...prev,
      };

      SCATTER_PHOTOS.forEach(
        (photo) => {
          if (
            !next[photo.id] &&
            wordmarkSlide.enterT >=
              photo.enterStart
          ) {
            next[photo.id] = true;
            changed = true;
          }
        }
      );

      return changed
        ? next
        : prev;
    });
  }, [
    wordmarkSlide.enterT,
    reduceMotion,
  ]);

  /* ==========================================================
     PINNING
     ========================================================== */

  let containerStyle;

  if (
    reduceMotion ||
    pinState === "before"
  ) {
    containerStyle = {
      position: "relative",
      height: "100vh",
    };
  } else if (
    pinState === "pinned"
  ) {
    containerStyle = {
      position: "fixed",
      top: NAVBAR_HEIGHT_PX,
      left: 0,
      right: 0,
      height: `calc(100vh - ${NAVBAR_HEIGHT_PX}px)`,
      zIndex: 10,
    };
  } else {
    containerStyle = {
      position: "absolute",
      top: afterTopRef.current,
      left: 0,
      right: 0,
      height: "100vh",
    };
  }

  /* ==========================================================
     BASE LAYER STYLE
     ========================================================== */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
    transition:
      "opacity 0.4s ease, transform 0.4s ease",
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      ref={wrapperRef}
      className="relative w-full bg-[var(--cream)]"
      style={
        reduceMotion
          ? undefined
          : {
              height: `${TRACK_VH}vh`,
            }
      }
    >
      <div
        ref={contentRef}
        className="w-full bg-[var(--cream)]"
        style={containerStyle}
      >
        <div className="relative h-full w-full">

          {/* ======================================================
              STAGE A — WORDMARK + THREE PHOTOS
              ====================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 1
                : wordmarkSlide.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${wordmarkSlide.translateY}px)`,

              pointerEvents:
                wordmarkSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >
            <div
              className="relative mx-auto w-full max-w-[860px] md:max-w-[1080px]"
              style={{
                opacity: wordmarkFadeT,
              }}
            >

              {/* ==================================================
                  LARA DECOR
                  ================================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  width: "100vw",
                }}
              />

              {/* ==================================================
                  LARA WORDMARK
                  ================================================== */}

              <img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="relative z-10 block h-auto w-full select-none pointer-events-none"
                style={{
                  transform: `scale(${wordmarkScale})`,
                  transformOrigin:
                    "50% 50%",
                }}
              />

              {/* ==================================================
                  THREE STACKED PHOTOS
                  ================================================== */}

              <div
                className="absolute inset-0 z-20 overflow-visible pointer-events-none"
              >
                {SCATTER_PHOTOS.map(
                  (photo) => {
                    /*
                      Convert Figma angle to CSS angle.

                      Figma:
                        +8.21 = anti-clockwise
                        0     = straight
                        -19.63 = clockwise

                      CSS:
                        positive = clockwise

                      Therefore:
                        CSS = Figma × -1
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    /*
                      Entrance direction.
                    */
                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;

                    /*
                      ------------------------------------------------
                      EXACT FIGMA POSITIONING
                      ------------------------------------------------

                      Your Figma canvas is:

                        1920 × 1176

                      The three images are positioned relative to
                      the center of that canvas.

                      Center X = 960px.

                      This prevents the photos from drifting away
                      from the center of the Lara wordmark.
                    */

                    const photoCenterX =
                      photo.left +
                      photo.width / 2;

                    const centerOffsetX =
                      photoCenterX - 960;

                    /*
                      Convert the Figma X offset to responsive
                      viewport units.

                      At 1920px:

                        1vw = 19.2px

                      So the exact Figma relationship is retained.
                    */
                    const finalLeft =
                      `calc(50% + ${centerOffsetX / 19.2}vw)`;

                    /*
                      Figma Y position.

                      Using vw keeps the composition proportional
                      to the 1920px reference.
                    */
                    const finalTop =
                      `${(photo.top / 19.2)}vw`;

                    /*
                      Exact Figma width.
                    */
                    const finalWidth =
                      `${(photo.width / 19.2)}vw`;

                    const entered =
                      reduceMotion ||
                      !!enteredPhotos[
                        photo.id
                      ];

                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}
                        initial={false}

                        animate={
                          entered
                            ? {
                                /*
                                  FINAL STATE
                                */
                                opacity: 1,
                                scale: 1,
                                x: 0,
                                y: 0,
                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                /*
                                  START STATE

                                  Large
                                  Off-screen
                                  Rotated
                                  Invisible
                                */
                                opacity: 0,
                                scale:
                                  PHOTO_ENTER_START_SCALE,
                                x: sideOffset,
                                y: 0,
                                rotate:
                                  cssFinalRotation +
                                  (photo.enterSide ===
                                  "left"
                                    ? -PHOTO_ENTER_SPIN_OFFSET
                                    : PHOTO_ENTER_SPIN_OFFSET),
                              }
                        }

                        transition={{
                          duration:
                            PHOTO_ENTER_DURATION_S,

                          /*
                            Smooth deceleration as the photo
                            approaches its final Figma position.
                          */
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}

                        style={{
                          position:
                            "absolute",

                          /*
                            Exact Figma position,
                            centered against the 1920px design.
                          */
                          left:
                            finalLeft,

                          top:
                            finalTop,

                          /*
                            Exact Figma width.
                          */
                          width:
                            finalWidth,

                          /*
                            Preserve natural image ratio.
                          */
                          height:
                            "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          /*
                            IMPORTANT:
                            No white borders.
                            No rounded corners.
                            No shadow.
                          */
                          border:
                            "none",

                          borderRadius: 0,

                          boxShadow:
                            "none",

                          /*
                            Keep the transform centered.
                          */
                          transformOrigin:
                            "50% 50%",

                          /*
                            Layer order:
                              back → middle → front
                          */
                          zIndex:
                            photo.zIndex,

                          /*
                            Don't crop the exported Figma image.
                          */
                          objectFit:
                            "contain",

                          display:
                            "block",

                          /*
                            Prevent the browser from adding
                            inline-image spacing.
                          */
                          verticalAlign:
                            "top",
                        }}

                        className="select-none pointer-events-none"
                      />
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* ======================================================
              STAGE B — PARAGRAPH
              ====================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 0
                : paragraphSlide.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${paragraphSlide.translateY}px)`,

              pointerEvents:
                paragraphSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >
            <div
              className="mx-auto max-w-3xl space-y-6 text-center text-xl leading-relaxed text-[var(--ink)] md:text-3xl md:leading-[1.5]"
            >
              {wordParagraphs.map(
                (words, pIndex) => (
                  <p key={pIndex}>
                    {words.map(
                      ({
                        word,
                        index,
                      }) => {
                        const wordT =
                          reduceMotion
                            ? 1
                            : clamp01(
                                (
                                  paragraphSlide.enterT -
                                  index /
                                    totalWords
                                ) /
                                  (1 /
                                    totalWords)
                              );

                        return (
                          <span
                            key={index}
                            style={{
                              opacity:
                                wordT,

                              transition:
                                "opacity 0.15s linear",
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

          {/* ======================================================
              STAGE C — TESTIMONIALS
              ====================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 0
                : testimonialsSlide.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${testimonialsSlide.translateY}px)`,

              pointerEvents:
                testimonialsSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >
            <div
              className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
            >
              {TESTIMONIALS.map(
                (
                  testimonial,
                  index
                ) => (
                  <div
                    key={
                      testimonial.name
                    }
                    className={`h-full border border-[var(--line)] bg-[var(--cream)] p-6 text-center ${
                      index % 3 === 1
                        ? "md:-translate-y-6"
                        : ""
                    }`}
                  >
                    <p className="mb-4 text-base leading-relaxed text-[var(--ink)]">
                      "{testimonial.quote}"
                    </p>

                    <p className="flex items-center justify-center gap-1 text-sm font-bold text-[var(--ink)]">
                      {
                        testimonial.name
                      }

                      <span
                        aria-hidden="true"
                        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-[9px] text-white"
                      >
                        ✓
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Verified Customer
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}