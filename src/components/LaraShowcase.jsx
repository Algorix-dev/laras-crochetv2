import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE

   FLOW:

   1. Lara wordmark comes in / settles.
   2. Three photos enter one-by-one.
   3. Each photo starts VERY LARGE and shrinks into its exact
      Figma position.
   4. The photos remain centered over Lara.
   5. Lara + photos stay on screen until ALL THREE animations
      have completely finished.
   6. THEN the paragraph appears.
   7. When the paragraph finishes, THEN reviews appear.

   IMPORTANT:
   - No glow.
   - Lara decorative artwork remains behind the wordmark.
   - Only THREE photos are used.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Long enough scroll distance so the sequence does not feel rushed.
*/
const TRACK_VH = 620;

/* ============================================================
   MAIN STAGES

   Wordmark gets the largest section because it contains:
   - Lara
   - decorative background
   - 3 photo entrances

   Paragraph starts only after this stage.
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.56,
  },

  paragraph: {
    start: 0.58,
    end: 0.78,
  },

  testimonials: {
    start: 0.80,
    end: 1.0,
  },
};

/* ============================================================
   GENERAL STAGE MOVEMENT
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.25,
  exitFrac: 0.20,
  travel: 45,
};

/* ============================================================
   PHOTO ENTRANCE ANIMATION
   ============================================================ */

const PHOTO_ENTER_DURATION_S = 2.8;

/*
  The photos begin VERY large so the user can actually see them
  as they enter.
*/
const PHOTO_ENTER_START_SCALE = 2.25;

/*
  How far outside the final position the photo begins.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 620;

/*
  Extra rotation while entering.
*/
const PHOTO_ENTER_SPIN_OFFSET = 14;

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

  /* ENTER */
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

  /* HOLD */
  if (local <= holdEnd) {
    return {
      opacity: 1,
      translateY: 0,
      enterT: 1,
    };
  }

  /* EXIT */
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
   PARAGRAPHS
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

/*
  Flatten all words so they can reveal progressively.
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
   FIGMA PHOTO POSITIONS
   ============================================================

   Figma frame:
   1920 × 1176

   These are the actual positions you supplied.

   IMPORTANT:
   Figma rotation convention:
     positive = anti-clockwise
     negative = clockwise

   CSS is the opposite:
     positive = clockwise
     negative = anti-clockwise

   Therefore:

     +8.21°  -> CSS -8.21°
      0°     -> CSS  0°
    -19.63°  -> CSS +19.63°
   ============================================================ */

const SCATTER_PHOTOS = [
  /* ----------------------------------------------------------
     FRONT
     ---------------------------------------------------------- */

  {
    id: "front",

    src: scatterTeal,

    alt:
      "Lara's Crochet customer wearing a teal crochet dress",

    width: 175.59957556823136,
    height: 103.72862812295645,

    left: 866.92,
    top: 114.87,

    figmaAngle: 8.21,

    zIndex: 3,

    /*
      First photo enters.
    */
    enterSide: "left",

    enterStart: 0.08,
  },

  /* ----------------------------------------------------------
     MIDDLE
     ---------------------------------------------------------- */

  {
    id: "middle",

    src: scatterBeach,

    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    width: 175.59957885742188,
    height: 103.72863006591797,

    left: 860.18,
    top: 119.27,

    figmaAngle: 0,

    zIndex: 2,

    /*
      Second photo waits for the first.
    */
    enterSide: "right",

    enterStart: 0.38,
  },

  /* ----------------------------------------------------------
     BACK
     ---------------------------------------------------------- */

  {
    id: "back",

    src: scatterStreet,

    alt: "Street-style portrait",

    width: 175.59958036211256,
    height: 103.72863095475553,

    left: 866.81,
    top: 92.77,

    figmaAngle: -19.63,

    zIndex: 1,

    /*
      Third photo waits for the second.
    */
    enterSide: "left",

    enterStart: 0.68,
  },
];

/* ============================================================
   FIGMA FRAME
   ============================================================ */

const FIGMA_WIDTH = 1920;
const FIGMA_HEIGHT = 1176;

/*
  This is deliberately kept close to the actual Figma size.

  The photo itself remains 175.6px at a 1920px viewport.
*/
const PHOTO_BOX_WIDTH = "clamp(100px, 9.15vw, 175.6px)";

/*
  Lara zoom.
*/
const WORDMARK_START_SCALE = 1.12;
const WORDMARK_END_SCALE = 1;

/*
  The decorative background should be visible but subtle.
*/
const DECOR_OPACITY = 0.32;

const WORDMARK_FADE_ENTER_END = 0.22;

/*
  Keep the page horizontally aligned to the same Figma-like
  content area.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";

/* ============================================================
   COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const wrapperRef = useRef(null);

  const contentRef = useRef(null);

  const contentHeightRef = useRef(0);

  const afterTopRef = useRef(0);

  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);

  const [pinState, setPinState] =
    useState("before");

  const [reduceMotion, setReduceMotion] =
    useState(false);

  /*
    Which photos have been triggered.
  */
  const [enteredPhotos, setEnteredPhotos] =
    useState({});

  /*
    IMPORTANT:

    This prevents the paragraph from appearing until all three
    photo animations have physically finished.
  */
  const [photosFinished, setPhotosFinished] =
    useState(false);

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

    mq.addEventListener?.("change", onChange);

    return () =>
      mq.removeEventListener?.(
        "change",
        onChange
      );
  }, []);

  /* ==========================================================
     MEASURE + SCROLL
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

    window.addEventListener("resize", measure);

    window.addEventListener("load", measure);

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

        /* BEFORE */
        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          next = 0;
        }

        /* AFTER */
        else if (
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
        }

        /* PINNED */
        else {
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
     PROGRESS
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
     LARA WORDMARK ANIMATION
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
    Lara starts slightly larger and settles into its normal size.
  */
  const wordmarkScale = reduceMotion
    ? WORDMARK_END_SCALE
    : WORDMARK_START_SCALE -
      (WORDMARK_START_SCALE -
        WORDMARK_END_SCALE) *
        wordmarkFadeT;

  /* ==========================================================
     PHOTO TRIGGER SYSTEM
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) {
      setEnteredPhotos({
        front: true,
        middle: true,
        back: true,
      });

      setPhotosFinished(true);

      return;
    }

    /*
      If the user scrolls all the way back above the Lara section,
      reset the animation so it can replay.
    */
    if (
      wordmarkSlide.enterT <= 0.02
    ) {
      setEnteredPhotos({});

      setPhotosFinished(false);

      return;
    }

    /*
      Trigger each photo separately.
    */
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
     PHOTO COMPLETION

     We only consider the Lara section finished when the third
     photo has entered.

     The actual Framer Motion onAnimationComplete below will then
     release the paragraph.
     ========================================================== */

  const allPhotosTriggered =
    !!enteredPhotos.front &&
    !!enteredPhotos.middle &&
    !!enteredPhotos.back;

  useEffect(() => {
    if (reduceMotion) {
      setPhotosFinished(true);
      return;
    }

    /*
      Don't mark the section finished just because the user
      reached the trigger.

      The last photo's onAnimationComplete does that.
    */

    if (!allPhotosTriggered) {
      setPhotosFinished(false);
    }
  }, [
    allPhotosTriggered,
    reduceMotion,
  ]);

  /* ==========================================================
     CONTAINER POSITION
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
     BASE LAYER
     ========================================================== */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
    transition:
      "opacity 0.45s ease, transform 0.45s ease",
  };

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

          {/* ==================================================
              STAGE A — LARA + PHOTOS
              ================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              /*
                Keep Lara visible until the photo sequence is
                actually complete.

                This is important because we don't want the
                paragraph replacing Lara while the third photo
                is still animating.
              */
              opacity:
                reduceMotion
                  ? 1
                  : photosFinished ||
                    wordmarkSlide.opacity > 0
                    ? 1
                    : 0,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${wordmarkSlide.translateY}px)`,

              pointerEvents: "none",
            }}
          >
            <div
              className="relative mx-auto w-full max-w-[860px] md:max-w-[1080px]"
              style={{
                /*
                  Keep the wordmark itself normal-sized after
                  settling.
                */
                opacity: wordmarkFadeT,
              }}
            >

              {/* ==================================================
                  LARA DECORATIVE ARTWORK

                  RESTORED.

                  This sits behind the Lara wordmark.
                  No glow.
                  ================================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-1/2
                  z-0
                  max-w-none
                  select-none
                  -translate-x-1/2
                  -translate-y-1/2
                "
                style={{
                  width: "100vw",
                  opacity: DECOR_OPACITY,
                }}
              />

              {/* ==================================================
                  LARA WORDMARK
                  ================================================== */}

              <img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="
                  relative
                  z-10
                  block
                  h-auto
                  w-full
                  select-none
                  pointer-events-none
                "
                style={{
                  transform: `scale(${wordmarkScale})`,
                  transformOrigin:
                    "50% 50%",
                }}
              />

              {/* ==================================================
                  PHOTO STACK

                  The important change here:

                  The photo stack is CENTERED over the Lara
                  wordmark itself.

                  We do NOT use the old full-stage Figma
                  positioning which was causing the images to
                  move away from Lara on different screens.
                  ================================================== */}

              <div
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-1/2
                  z-20
                  overflow-visible
                "
                style={{
                  width:
                    PHOTO_BOX_WIDTH,

                  aspectRatio:
                    "175.59957556823136 / 103.72862812295645",

                  /*
                    This is the actual center anchor.
                  */
                  transform:
                    "translate(-50%, -50%)",
                }}
              >

                {SCATTER_PHOTOS.map(
                  (photo) => {
                    const entered =
                      reduceMotion ||
                      !!enteredPhotos[
                        photo.id
                      ];

                    /*
                      Convert Figma rotation to CSS.

                      Figma:
                        + = anti-clockwise
                        - = clockwise

                      CSS:
                        + = clockwise
                        - = anti-clockwise

                      Therefore we negate it.
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;

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

                                  Normal size.
                                  Centered.
                                  Exact Figma rotation.
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

                                  Very large.
                                  Outside the center.
                                  Slightly rotated.
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

                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}

                        /*
                          When the BACK photo finishes,
                          the entire Lara sequence is officially
                          finished.

                          That allows the paragraph to begin.
                        */
                        onAnimationComplete={() => {
                          if (
                            photo.id ===
                              "back" &&
                            entered
                          ) {
                            setPhotosFinished(
                              true
                            );
                          }
                        }}

                        style={{
                          position:
                            "absolute",

                          left: 0,
                          top: 0,

                          width: "100%",
                          height: "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            Absolutely NO border.
                          */
                          border: "none",

                          borderWidth: 0,

                          borderStyle:
                            "none",

                          borderRadius: 0,

                          boxShadow: "none",

                          outline: "none",

                          background:
                            "transparent",

                          transformOrigin:
                            "50% 50%",
                        }}

                        className="
                          block
                          select-none
                          object-cover
                        "
                      />
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* ==================================================
              STAGE B — PARAGRAPH
              ================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              /*
                IMPORTANT:

                Paragraph cannot appear until:
                1. Scroll reaches paragraph stage
                2. ALL Lara/photo animations have finished
              */
              opacity:
                reduceMotion
                  ? 1
                  : photosFinished
                    ? paragraphSlide.opacity
                    : 0,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${paragraphSlide.translateY}px)`,

              pointerEvents:
                photosFinished &&
                paragraphSlide.opacity >
                  0.5
                  ? "auto"
                  : "none",
            }}
          >
            <div
              className="
                mx-auto
                w-full
                max-w-3xl
                space-y-6
                text-center
                text-xl
                leading-relaxed
                text-[var(--ink)]
                md:text-2xl
                md:leading-[1.5]
              "
            >
              {wordParagraphs.map(
                (
                  words,
                  pIndex
                ) => (
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

          {/* ==================================================
              STAGE C — TESTIMONIALS
              ================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              /*
                Reviews wait for the paragraph stage.

                They are NOT enlarged.
              */
              opacity:
                photosFinished
                  ? testimonialsSlide.opacity
                  : 0,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${testimonialsSlide.translateY}px)`,

              pointerEvents:
                testimonialsSlide.opacity >
                  0.5 &&
                photosFinished
                  ? "auto"
                  : "none",
            }}
          >
            <div
              className="
                grid
                w-full
                max-w-5xl
                grid-cols-1
                gap-6
                sm:grid-cols-2
                md:grid-cols-3
              "
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
                    className={`
                      h-full
                      border
                      border-[var(--line)]
                      bg-[var(--cream)]
                      p-6
                      text-center
                      ${
                        index % 3 ===
                        1
                          ? "md:-translate-y-6"
                          : ""
                      }
                    `}
                  >
                    <p
                      className="
                        mb-4
                        text-base
                        leading-relaxed
                        text-[var(--ink)]
                      "
                    >
                      "{testimonial.quote}"
                    </p>

                    <p
                      className="
                        flex
                        items-center
                        justify-center
                        gap-1
                        text-sm
                        font-bold
                        text-[var(--ink)]
                      "
                    >
                      {testimonial.name}

                      <span
                        aria-hidden="true"
                        className="
                          inline-flex
                          h-3.5
                          w-3.5
                          items-center
                          justify-center
                          rounded-full
                          bg-[var(--maroon)]
                          text-[9px]
                          text-white
                        "
                      >
                        ✓
                      </span>
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-[var(--muted)]
                      "
                    >
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