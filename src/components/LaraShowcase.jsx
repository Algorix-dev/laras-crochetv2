import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";

/* ============================================================
   LARA'S CROCHET — SHOWCASE

   WORDMARK + 3 PHOTO ENTRANCE

   - 3 photos only
   - Photos use the Figma 1920px coordinate system
   - Exact final Figma dimensions:
       175.599px × 103.729px
   - Exact Figma angles:
       Front  +8.21°
       Middle  0°
       Back   -19.63°

   IMPORTANT:
   Figma's positive rotation is anti-clockwise.
   CSS's positive rotation is clockwise.

   Therefore:
       +8.21 Figma  -> -8.21 CSS
        0 Figma     ->  0 CSS
       -19.63 Figma -> +19.63 CSS

   Animation:
   - One photo enters at a time
   - Starts oversized
   - Comes from the side
   - Shrinks into its exact final dimensions
   - Settles into the center of Lara
   - Slower entrance so each photo is clearly visible
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  More scroll distance gives the three photos enough room
  to enter one after another before the next section appears.
*/
const TRACK_VH = 620;

/* ============================================================
   SECTION TIMING
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.46,
  },

  paragraph: {
    start: 0.52,
    end: 0.75,
  },

  testimonials: {
    start: 0.80,
    end: 1.0,
  },
};

/* ============================================================
   GENERAL SLIDE SETTINGS
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.15,
  exitFrac: 0.3,
  travel: 70,
};

/* ============================================================
   PHOTO ENTRANCE SETTINGS
   ============================================================ */

/*
  This is deliberately slower than before.

  The important part is that once a photo is triggered,
  Framer Motion gets a fixed 2.8 second animation to complete.
*/
const PHOTO_ENTER_DURATION_S = 2.8;

/*
  Start significantly larger than the final Figma size.
*/
const PHOTO_ENTER_START_SCALE = 2.15;

/*
  How far outside the composition the photo starts.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 650;

/*
  Extra rotation while entering.
  It settles into the exact Figma angle.
*/
const PHOTO_ENTER_SPIN_OFFSET = 14;

/* ============================================================
   FIGMA DESIGN REFERENCE
   ============================================================ */

const FIGMA_WIDTH = 1920;
const FIGMA_HEIGHT = 1176;

/*
  Exact Figma photo dimensions.
*/
const PHOTO_WIDTH = 175.59957556823136;
const PHOTO_HEIGHT = 103.72862812295645;

/*
  Exact Figma positions.

  These are NOT percentages of the wordmark container.

  They are positions in the 1920 × 1176 design frame.
*/
const SCATTER_PHOTOS = [
  {
    id: "front",

    src: scatterTeal,

    alt: "Lara's Crochet customer wearing a teal crochet dress",

    width: 175.59957556823136,
    height: 103.72862812295645,

    left: 866.92,
    top: 114.87,

    /*
      Figma +8.21° = anti-clockwise
      CSS = -8.21°
    */
    figmaAngle: 8.21,

    zIndex: 3,

    /*
      First image comes from the left.
    */
    enterSide: "left",

    /*
      Starts first.
    */
    enterStart: 0.08,
  },

  {
    id: "middle",

    src: scatterBeach,

    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    width: 175.59957885742188,
    height: 103.72863006591797,

    left: 860.18,
    top: 119.27,

    /*
      Figma 0°
    */
    figmaAngle: 0,

    zIndex: 2,

    /*
      Second image comes from the right.
    */
    enterSide: "right",

    /*
      IMPORTANT:
      This is far enough after the first that the first
      gets time to finish before this begins.
    */
    enterStart: 0.39,
  },

  {
    id: "back",

    src: scatterStreet,

    alt: "Street-style portrait",

    width: 175.59958036211256,
    height: 103.72863095475553,

    left: 866.81,
    top: 92.77,

    /*
      Figma -19.63° = clockwise
      CSS = +19.63°
    */
    figmaAngle: -19.63,

    zIndex: 1,

    /*
      Third image comes from the left.
    */
    enterSide: "left",

    /*
      Third starts only after the middle has had
      time to settle.
    */
    enterStart: 0.70,
  },
];

/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;

/*
  Your existing page padding.
*/
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

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
  Convert paragraphs into individual words so the paragraph
  can reveal word-by-word.
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
   COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] = useState(false);

  /*
    Keeps track of which of the 3 photos have already
    been triggered.
  */
  const [enteredPhotos, setEnteredPhotos] = useState({});

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

    return () => {
      mq.removeEventListener?.(
        "change",
        onChange
      );
    };
  }, []);

  /* ==========================================================
     MEASURE + SCROLL PROGRESS
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

        /* Before section */
        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          next = 0;
        }

        /* After section */
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

        /* Pinned */
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
     SECTION PROGRESS
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
    The Lara wordmark itself starts larger and settles down.
  */
  const wordmarkScale = reduceMotion
    ? 1
    : 1.5 -
      0.5 * wordmarkFadeT;

  /* ==========================================================
     PHOTO TRIGGERS
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      When we go back above the wordmark section,
      reset the photos so the animation can replay.
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
     BASE LAYER
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

          {/* ==================================================
              STAGE A — WORDMARK + 3 PHOTOS
              ================================================== */}

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

            {/*
              IMPORTANT CHANGE:

              The wordmark remains inside its normal
              responsive container.

              The photos are positioned separately
              using the full viewport/design frame.
            */}
            <div
              className="relative w-full max-w-[1080px]"
              style={{
                opacity:
                  wordmarkFadeT,
              }}
            >

              {/* ============================================
                  LARA WORDMARK
                  ============================================ */}

              <img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="relative z-10 mx-auto block h-auto w-full select-none pointer-events-none"
                style={{
                  transform: `scale(${wordmarkScale})`,
                  transformOrigin:
                    "50% 50%",
                }}
              />

              {/* ============================================
                  PHOTO LAYER

                  Full viewport coordinate system.

                  This fixes the previous problem where:

                    175.6 / 1920 × 1080

                  made the images approximately 99px wide.

                  They now actually render at approximately
                  175.6px at the 1920px design width.
                  ============================================ */}

              <div
                className="pointer-events-none absolute inset-0 z-20"
                style={{
                  /*
                    Allow the photo layer to escape the
                    1080px wordmark container.

                    The width is tied to the viewport,
                    while the center stays aligned with
                    the Lara wordmark.
                  */
                  left: "50%",
                  top: "50%",

                  width: "100vw",
                  height: "100vh",

                  transform:
                    "translate(-50%, -50%)",

                  overflow: "visible",
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
                      Convert Figma angle
                      to CSS angle.
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    /*
                      Entry direction.
                    */
                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;

                    /*
                      Exact final Figma position,
                      converted relative to the
                      viewport.

                      Instead of placing the image
                      inside the 1080px wordmark
                      container, we anchor its
                      position to the viewport.

                      This keeps the center of the
                      photo stack aligned with the
                      Figma composition.
                    */
                    const finalLeft =
                      `calc((${photo.left} / ${FIGMA_WIDTH}) * 100vw)`;

                    const finalTop =
                      `calc((${photo.top} / ${FIGMA_HEIGHT}) * 100vh)`;

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
                                  Final opacity.
                                */
                                opacity: 1,

                                /*
                                  EXACT final scale.
                                */
                                scale: 1,

                                /*
                                  Final position.
                                */
                                x: 0,
                                y: 0,

                                /*
                                  EXACT final
                                  Figma rotation.
                                */
                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                /*
                                  Hidden before
                                  its turn.
                                */
                                opacity: 0,

                                /*
                                  BIG starting image.
                                */
                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                /*
                                  Comes from its
                                  assigned side.
                                */
                                x: sideOffset,

                                /*
                                  No vertical drift.
                                */
                                y: 0,

                                /*
                                  Extra rotation while
                                  entering, then settles.
                                */
                                rotate:
                                  cssFinalRotation +
                                  (photo.enterSide ===
                                  "left"
                                    ? -PHOTO_ENTER_SPIN_OFFSET
                                    : PHOTO_ENTER_SPIN_OFFSET),
                              }
                        }

                        transition={{
                          /*
                            Slower animation.
                          */
                          duration:
                            PHOTO_ENTER_DURATION_S,

                          /*
                            Smooth but still
                            energetic entrance.
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
                            Use the exact Figma
                            position in the
                            1920px viewport.
                          */
                          left:
                            finalLeft,

                          top:
                            finalTop,

                          /*
                            Exact Figma dimensions.
                            Responsive down on
                            smaller screens.
                          */
                          width:
                            `clamp(96px, ${(
                              photo.width /
                              FIGMA_WIDTH
                            ) * 100}vw, ${photo.width}px)`,

                          height:
                            "auto",

                          aspectRatio:
                            `${photo.width} / ${photo.height}`,

                          objectFit:
                            "cover",

                          /*
                            Absolutely NO white
                            border around photos.
                          */
                          border: "0",
                          outline: "none",

                          /*
                            No rounded corners.
                          */
                          borderRadius: 0,

                          /*
                            No shadow/ring.
                          */
                          boxShadow: "none",

                          /*
                            Keeps the photo scaling
                            from changing its anchor.
                          */
                          transformOrigin:
                            "50% 50%",

                          zIndex:
                            photo.zIndex,

                          /*
                            Prevents image dragging.
                          */
                          userSelect:
                            "none",

                          /*
                            Avoids browser
                            interpolation artifacts.
                          */
                          backfaceVisibility:
                            "hidden",
                        }}

                        draggable={false}

                        className="block select-none"
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
            <div className="mx-auto max-w-3xl space-y-6 text-center text-xl leading-relaxed text-[var(--ink)] md:text-3xl md:leading-[1.5]">

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
                              opacity: wordT,
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

            <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">

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
                      "
                      {
                        testimonial.quote
                      }
                      "
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