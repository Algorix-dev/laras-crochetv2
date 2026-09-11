import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE
   ------------------------------------------------------------
   Sequence:

   1. Lara wordmark enters
   2. Three photos enter ONE BY ONE
   3. Each photo starts BIG and shrinks into its Figma position
   4. Lara/photo composition holds
   5. Lara section leaves completely
   6. Paragraph appears
   7. Paragraph finishes
   8. Reviews appear

   IMPORTANT:
   - Only the 3 Figma photos are used.
   - No glow.
   - No white borders.
   - Decorative background remains.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  More vertical scroll room gives every animation enough time.

  The important thing is that the stages below are separated.
*/
const TRACK_VH = 620;

/* ============================================================
   STAGE TIMING

   Lara finishes before paragraph starts.
   Paragraph finishes before reviews start.
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.48,
  },

  paragraph: {
    start: 0.54,
    end: 0.76,
  },

  testimonials: {
    start: 0.82,
    end: 1.0,
  },
};

/*
  This controls the movement of the THREE photos.

  They are not controlled directly by scroll after triggering.
  Once their trigger point is reached, Framer Motion gets enough
  real time to play the complete entrance.
*/
const PHOTO_ENTER_DURATION_S = 3.0;

/*
  BIG starting size.

  2.15 means the photo starts at 215% of its final size.
  It then shrinks down to exactly 100%.
*/
const PHOTO_ENTER_START_SCALE = 2.15;

/*
  How far from the center each photo starts.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 700;

/*
  Extra rotation while entering.
  It settles into the exact Figma angle.
*/
const PHOTO_ENTER_SPIN_OFFSET = 12;

/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================ */

const PHOTO_ASPECT_RATIO =
  "175.59957556823136 / 103.72862812295645";

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
      Figma:
      +8.21° = anti-clockwise

      CSS rotate uses the opposite sign visually, therefore:
      CSS = -8.21°
    */
    figmaAngle: 8.21,

    zIndex: 3,

    enterSide: "left",

    /*
      First photo.
    */
    enterStart: 0.12,
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
      Figma:
      0°
    */
    figmaAngle: 0,

    zIndex: 2,

    enterSide: "right",

    /*
      Second photo.
    */
    enterStart: 0.32,
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
      Figma:
      -19.63° = clockwise

      CSS = +19.63°
    */
    figmaAngle: -19.63,

    zIndex: 1,

    enterSide: "left",

    /*
      Third photo.
    */
    enterStart: 0.52,
  },
];

/* ============================================================
   PARAGRAPHS
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

/* ============================================================
   WORD PARAGRAPH BUILDER
   ============================================================ */

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
   HELPERS
   ============================================================ */

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/*
  General stage transition.

  Used only for moving the whole stage in/out.
*/
function computeStage(progress, start, end) {
  const span = end - start;
  const local = clamp01((progress - start) / span);

  /*
    First 22% = enter
    Middle 58% = hold
    Last 20% = leave
  */
  const enterEnd = 0.22;
  const exitStart = 0.80;

  if (local <= enterEnd) {
    const t = easeOutCubic(local / enterEnd);

    return {
      opacity: t,
      translateY: (1 - t) * 55,
      local,
    };
  }

  if (local <= exitStart) {
    return {
      opacity: 1,
      translateY: 0,
      local,
    };
  }

  const t = easeOutCubic(
    (local - exitStart) / (1 - exitStart)
  );

  return {
    opacity: 1 - t,
    translateY: -t * 55,
    local,
  };
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

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] = useState(false);

  /*
    Tracks which of the three photos have been triggered.
  */
  const [enteredPhotos, setEnteredPhotos] = useState({});

  const {
    result: wordParagraphs,
    totalWords,
  } = useMemo(
    () => buildWordParagraphs(PARAGRAPHS),
    []
  );

  /* ============================================================
     REDUCED MOTION
     ============================================================ */

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
      mq.removeEventListener?.("change", onChange);
    };
  }, []);

  /* ============================================================
     SCROLL / PINNING
     ============================================================ */

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
        let nextProgress;

        /*
          Before the showcase reaches the navbar.
        */
        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          nextProgress = 0;
        }

        /*
          Showcase has completed.
        */
        else if (
          rect.bottom <=
          NAVBAR_HEIGHT_PX + contentHeight
        ) {
          nextState = "after";
          nextProgress = 1;

          afterTopRef.current = Math.max(
            0,
            rect.height - contentHeight
          );
        }

        /*
          Showcase is pinned.
        */
        else {
          nextState = "pinned";

          nextProgress =
            pinnableRange > 0
              ? clamp01(
                  (NAVBAR_HEIGHT_PX - rect.top) /
                    pinnableRange
                )
              : 1;
        }

        setPinState((prev) =>
          prev === nextState
            ? prev
            : nextState
        );

        setProgress(nextProgress);
      }

      rafRef.current =
        requestAnimationFrame(tick);
    };

    rafRef.current =
      requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);

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

  /* ============================================================
     CURRENT PROGRESS
     ============================================================ */

  const p = reduceMotion ? 1 : progress;

  const wordmarkStage = computeStage(
    p,
    STAGE.wordmark.start,
    STAGE.wordmark.end
  );

  const paragraphStage = computeStage(
    p,
    STAGE.paragraph.start,
    STAGE.paragraph.end
  );

  const testimonialsStage = computeStage(
    p,
    STAGE.testimonials.start,
    STAGE.testimonials.end
  );

  /* ============================================================
     LARA WORDMARK

     Starts large and settles into normal size.
     ============================================================ */

  const wordmarkEnterT = clamp01(
    wordmarkStage.local / 0.35
  );

  const wordmarkScale = reduceMotion
    ? 1
    : 1.55 -
      0.55 *
        easeOutCubic(wordmarkEnterT);

  /* ============================================================
     PHOTO TRIGGERS

     Each photo is triggered separately.

     The important difference from the previous version:
     they are NOT all tied to the same instant.

     Once triggered, Framer Motion completes the entire
     big → small animation.
     ============================================================ */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      Reset when returning above the Lara stage.
    */
    if (p < 0.02) {
      setEnteredPhotos({});
      return;
    }

    setEnteredPhotos((previous) => {
      let changed = false;

      const next = {
        ...previous,
      };

      SCATTER_PHOTOS.forEach((photo) => {
        if (
          !next[photo.id] &&
          wordmarkStage.local >=
            photo.enterStart
        ) {
          next[photo.id] = true;
          changed = true;
        }
      });

      return changed ? next : previous;
    });
  }, [
    p,
    wordmarkStage.local,
    reduceMotion,
  ]);

  /* ============================================================
     CONTAINER PINNING
     ============================================================ */

  let containerStyle;

  if (
    reduceMotion ||
    pinState === "before"
  ) {
    containerStyle = {
      position: "relative",
      height: "100vh",
    };
  } else if (pinState === "pinned") {
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

  /* ============================================================
     COMMON STAGE STYLE
     ============================================================ */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <section
      ref={wrapperRef}
      className="relative w-full overflow-hidden bg-[var(--cream)]"
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
        <div className="relative h-full w-full overflow-hidden">

          {/* ======================================================
              STAGE A
              LARA + DECOR + THREE PHOTOS
              ====================================================== */}

          <div
            className="absolute inset-0 flex items-center justify-center px-5 md:px-8 lg:px-[15.83%]"
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 1
                : wordmarkStage.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${wordmarkStage.translateY}px)`,

              pointerEvents:
                wordmarkStage.opacity > 0.5
                  ? "auto"
                  : "none",

              zIndex: 10,
            }}
          >
            <div
              className="relative mx-auto w-full max-w-[1080px]"
              style={{
                /*
                  Keeps the entire Lara composition centered.
                */
                opacity: 1,
              }}
            >

              {/* ==================================================
                  DECORATIVE BACKGROUND

                  RESTORED.

                  It stays behind Lara and the photos.
                  No glow.
                  ================================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none select-none"
                style={{
                  width: "100vw",
                  height: "auto",
                  transform:
                    "translate(-50%, -50%)",
                  opacity: 1,
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
                  PHOTO STACK

                  IMPORTANT:

                  The photos are positioned relative to the
                  actual Lara wordmark container.

                  Therefore when they finish they remain centered
                  on Lara instead of drifting away.
                  ================================================== */}

              <div
                className="pointer-events-none absolute inset-0 z-20"
                style={{
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
                      Convert Figma rotation to CSS.

                      Figma +8.21 = anti-clockwise
                      CSS -8.21

                      Figma 0 = CSS 0

                      Figma -19.63 = clockwise
                      CSS +19.63
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;

                    /*
                      These percentages are based on the
                      1920 × 1176 Figma frame.
                    */
                    const finalLeft =
                      (photo.left / 1920) *
                      100;

                    const finalTop =
                      (photo.top / 1176) *
                      100;

                    const finalWidth =
                      (photo.width / 1920) *
                      100;

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

                                  Exact normal size.
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
                                  Comes from side.
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
                            Smooth luxury-style settling.
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
                            Exact Figma position.
                          */
                          left: `${finalLeft}%`,
                          top: `${finalTop}%`,

                          /*
                            Exact proportional width.
                          */
                          width: `${finalWidth}%`,

                          height: "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            NO white border.
                          */
                          border: "0",
                          outline: "none",
                          boxShadow: "none",

                          /*
                            Keep the exact Figma angle.
                          */
                          transformOrigin:
                            "50% 50%",

                          /*
                            Prevent browser image
                            selection artifacts.
                          */
                          userSelect: "none",

                          display: "block",
                        }}
                        className="select-none"
                        draggable={false}
                      />
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* ======================================================
              STAGE B
              PARAGRAPH

              This cannot start until Stage A has essentially
              completed.
              ====================================================== */}

          <div
            className="absolute inset-0 flex items-center justify-center px-5 md:px-8 lg:px-[15.83%]"
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 1
                : paragraphStage.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${paragraphStage.translateY}px)`,

              pointerEvents:
                paragraphStage.opacity >
                0.5
                  ? "auto"
                  : "none",

              zIndex: 20,
            }}
          >
            <div
              className="
                mx-auto
                w-full
                max-w-3xl
                space-y-6
                text-center
                text-lg
                leading-relaxed
                text-[var(--ink)]
                md:text-xl
                md:leading-[1.5]
              "
            >
              {wordParagraphs.map(
                (words, pIndex) => (
                  <p key={pIndex}>
                    {words.map(
                      ({
                        word,
                        index,
                      }) => {
                        /*
                          Paragraph words reveal gradually
                          after the Lara stage has left.
                        */
                        const wordT =
                          reduceMotion
                            ? 1
                            : clamp01(
                                (
                                  paragraphStage.local -
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
              STAGE C
              TESTIMONIALS

              Normal centered cards.
              Not enlarged.
              ====================================================== */}

          <div
            className="absolute inset-0 flex items-center justify-center px-5 md:px-8 lg:px-[15.83%]"
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 1
                : testimonialsStage.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${testimonialsStage.translateY}px)`,

              pointerEvents:
                testimonialsStage.opacity >
                0.5
                  ? "auto"
                  : "none",

              zIndex: 30,
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
                        index % 3 === 1
                          ? "md:-translate-y-6"
                          : ""
                      }
                    `}
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