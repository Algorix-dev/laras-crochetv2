import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE

   SECTION FLOW:

   1. LARA WORDMARK
      - Lara comes in / settles.
      - Decorative artwork stays behind it.

   2. THREE PHOTOS
      - One at a time.
      - Very large when they enter.
      - Slide in from the side.
      - Shrink down into their final size.
      - Finish centered over Lara.
      - No white border / shadow.
      - Exact Figma rotation direction preserved.

   3. PARAGRAPHS
      - Only starts after the Lara/photo sequence is finished.
      - Word-by-word reveal.
      - Slow enough to actually read.

   4. REVIEWS
      - Starts only after paragraph section is finished.
      - 3 reviews per row.
      - Rows appear one after another.
      - Slow fade in/out.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Large scroll track gives each section enough breathing room.
*/
const TRACK_VH = 700;

/* ============================================================
   STAGE TIMING
   ============================================================ */

const STAGE = {
  /*
    Lara + photos occupy the first ~45%.
  */
  wordmark: {
    start: 0.0,
    end: 0.46,
  },

  /*
    There is deliberately a small gap between the Lara sequence
    and paragraph.
  */
  paragraph: {
    start: 0.51,
    end: 0.73,
  },

  /*
    Reviews start only after paragraph has completely finished.
  */
  testimonials: {
    start: 0.80,
    end: 1.0,
  },
};

/* ============================================================
   GENERIC SLIDE
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.15,
  exitFrac: 0.3,
  travel: 55,
};

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

  const local = clamp01((progress - start) / span);

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
      ? clamp01((local - holdEnd) / exitFrac)
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
];

/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================

   Figma frame:
   1920 × 1176

   These are intentionally NOT used as absolute top/left values
   inside the Lara container.

   Instead, we use the measurements to calculate the small
   offsets from the centre of the Lara wordmark.

   This is what prevents the photos from jumping to the top
   of the screen on different viewport sizes.
   ============================================================ */

const FIGMA_FRAME_WIDTH = 1920;
const FIGMA_FRAME_HEIGHT = 1176;

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
      Figma +8.21° = anti-clockwise.

      CSS rotate() uses the opposite sign for the visual
      direction, therefore CSS receives -8.21.
    */
    figmaAngle: 8.21,

    zIndex: 3,

    /*
      First photo comes from the LEFT.
    */
    enterSide: "left",

    /*
      First photo starts early.
    */
    enterStart: 0.18,
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
      Figma 0° = CSS 0°.
    */
    figmaAngle: 0,

    zIndex: 2,

    /*
      Second photo comes from the RIGHT.
    */
    enterSide: "right",

    /*
      Noticeably later than photo 1.
    */
    enterStart: 0.47,
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
      Figma -19.63° = clockwise.

      CSS therefore uses +19.63°.
    */
    figmaAngle: -19.63,

    zIndex: 1,

    /*
      Third photo comes from the LEFT.
    */
    enterSide: "left",

    /*
      Last photo enters significantly later.
    */
    enterStart: 0.76,
  },
];

/* ============================================================
   PHOTO ANIMATION SETTINGS
   ============================================================ */

/*
  BIG.

  This is deliberately much larger than the final 175px-ish
  Figma size so the entrance is obvious.
*/
const PHOTO_ENTER_START_SCALE = 2.35;

/*
  Extra distance outside the Lara area before entering.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 650;

/*
  Each photo gets a long entrance.
*/
const PHOTO_ENTER_DURATION_S = 2.9;

/*
  Small extra rotation while entering.
*/
const PHOTO_ENTER_SPIN_OFFSET = 16;

/*
  The final Figma width as responsive viewport width.
*/
const PHOTO_FINAL_WIDTH = "9.1458vw";

/*
  Keep photos from becoming ridiculously large on huge screens.
*/
const PHOTO_FINAL_WIDTH_RESPONSIVE =
  "clamp(130px, 9.1458vw, 175.6px)";

/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;

/*
  The whole showcase uses a wide central composition.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";

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
    Each photo becomes true only after its own trigger point
    is reached.
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
     SCROLL MEASUREMENT / PINNING
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
              rect.height - contentHeight
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

  /* ============================================================
     STAGE PROGRESS
     ============================================================ */

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

  /* ============================================================
     LARA WORDMARK SCALE
     ============================================================ */

  const wordmarkFadeT = reduceMotion
    ? 1
    : easeOutCubic(
        clamp01(
          wordmarkSlide.enterT /
            WORDMARK_FADE_ENTER_END
        )
      );

  /*
    Lara itself starts larger and settles into normal size.
  */
  const wordmarkScale = reduceMotion
    ? 1
    : 1.35 -
      0.35 * wordmarkFadeT;

  /* ============================================================
     PHOTO TRIGGERS
     ============================================================ */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      If we return above the Lara sequence,
      reset the photos so they can play again.
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

  /* ============================================================
     CONTAINER POSITION
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

  /* ============================================================
     BASE LAYER
     ============================================================ */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
    transition:
      "opacity 0.5s ease, transform 0.5s ease",
  };

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
        <div className="relative h-full w-full">
          {/* ========================================================
              STAGE A — LARA + THREE PHOTOS
              ======================================================== */}

          <div
            className={`flex h-full items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 1
                : wordmarkSlide.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${wordmarkSlide.translateY}px)`,

              pointerEvents:
                wordmarkSlide.opacity >
                0.5
                  ? "auto"
                  : "none",
            }}
          >
            {/* ======================================================
                IMPORTANT:

                This is now a fixed CENTRAL COMPOSITION.

                The photo layer is anchored to the centre of this
                composition rather than using Figma top/left as
                coordinates inside the Lara image.

                This is what stops the photos appearing at the top.
                ====================================================== */}

            <div
              className="relative flex w-full max-w-[1080px] items-center justify-center"
              style={{
                opacity: wordmarkFadeT,
              }}
            >
              {/* ====================================================
                  LARA DECORATION

                  KEEP THIS BEHIND THE WORDMARK.
                  ==================================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none select-none"
                style={{
                  width:
                    "min(100vw, 1920px)",
                  transform:
                    "translate(-50%, -50%)",
                }}
              />

              {/* ====================================================
                  LARA WORDMARK

                  No glow.
                  No shadow.
                  ==================================================== */}

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

              {/* ====================================================
                  PHOTO STACK

                  This entire stack is centered over Lara.

                  The photos themselves use the Figma measurements
                  only to calculate their tiny relative offsets.
                  ==================================================== */}

              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-20"
                style={{
                  width:
                    PHOTO_FINAL_WIDTH_RESPONSIVE,
                  height:
                    "clamp(77px, 5.4025vw, 103.73px)",

                  /*
                    This is the important part:
                    the photo stack is centred on Lara.
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
                      Figma angle → CSS angle.

                      +8.21 Figma
                      becomes -8.21 CSS

                      0 remains 0

                      -19.63 Figma
                      becomes +19.63 CSS
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    /*
                      Calculate how far the Figma photo centre
                      sits from the centre of the 1920px frame.

                      This gives us the tiny X offset needed to
                      reproduce the original Figma pile while
                      keeping the whole pile centred on Lara.
                    */
                    const photoCenterX =
                      photo.left +
                      photo.width / 2;

                    const frameCenterX =
                      FIGMA_FRAME_WIDTH / 2;

                    const finalX =
                      photoCenterX -
                      frameCenterX;

                    /*
                      Same principle vertically.

                      We intentionally keep the Y difference small
                      because the photos are supposed to sit over
                      the centre of Lara rather than at the top.
                    */
                    const photoCenterY =
                      photo.top +
                      photo.height / 2;

                    const referenceCenterY =
                      FIGMA_FRAME_HEIGHT / 2;

                    /*
                      Scale the original vertical relationship down
                      so the photos remain around the centre of Lara
                      instead of being pushed toward the top.
                    */
                    const finalY =
                      (photoCenterY -
                        referenceCenterY) *
                      0.12;

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
                        draggable="false"
                        initial={false}
                        animate={
                          entered
                            ? {
                                opacity: 1,
                                scale: 1,
                                x: finalX,
                                y: finalY,
                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                /*
                                  Start HUGE.
                                */
                                opacity: 0,
                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                /*
                                  Start from the side.
                                */
                                x:
                                  finalX +
                                  sideOffset,

                                y: finalY,

                                /*
                                  Slightly more rotated during
                                  entrance, then settles to exact
                                  Figma angle.
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
                            Each individual image gets nearly
                            3 seconds to complete its movement.
                          */
                          duration:
                            PHOTO_ENTER_DURATION_S,

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
                            Each photo occupies the same physical
                            stack box.
                          */
                          left: 0,
                          top: 0,

                          width: "100%",
                          height: "100%",

                          /*
                            IMPORTANT:
                            no border, no ring, no shadow.
                          */
                          border: "none",
                          outline: "none",
                          boxShadow:
                            "none",

                          borderRadius: 0,

                          /*
                            Keeps the actual image proportions.
                          */
                          objectFit:
                            "cover",

                          transformOrigin:
                            "50% 50%",

                          zIndex:
                            photo.zIndex,

                          /*
                            Prevent browser image-selection
                            artefacts.
                          */
                          userSelect:
                            "none",
                          WebkitUserDrag:
                            "none",
                        }}
                        className="block select-none"
                      />
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* ========================================================
              STAGE B — PARAGRAPH

              This does NOT begin until the Lara sequence has
              finished.
              ======================================================== */}

          <div
            className={`flex h-full items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 0
                : paragraphSlide.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${paragraphSlide.translateY}px)`,

              pointerEvents:
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
                text-base
                leading-relaxed
                text-[var(--ink)]
                md:text-xl
                md:leading-[1.55]
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
                          Slower word reveal.

                          The old version gave every word a very tiny
                          slice of the animation, which made the whole
                          paragraph fly in.

                          This spreads the reveal over the whole
                          paragraph entrance.
                        */
                        const wordProgress =
                          clamp01(
                            (paragraphSlide.enterT -
                              index /
                                totalWords) /
                              (1 /
                                totalWords)
                          );

                        const wordT =
                          reduceMotion
                            ? 1
                            : easeOutCubic(
                                wordProgress
                              );

                        return (
                          <span
                            key={index}
                            style={{
                              opacity:
                                wordT,

                              transition:
                                "opacity 0.3s ease",
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

          {/* ========================================================
              STAGE C — REVIEWS

              3 reviews per row.

              Rows reveal progressively instead of all 9 appearing
              simultaneously.
              ======================================================== */}

          <div
            className={`flex h-full items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity: reduceMotion
                ? 0
                : testimonialsSlide.opacity,

              transform: reduceMotion
                ? "none"
                : `translateY(${testimonialsSlide.translateY}px)`,

              pointerEvents:
                testimonialsSlide.opacity >
                0.5
                  ? "auto"
                  : "none",
            }}
          >
            <div className="w-full max-w-5xl">
              <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {TESTIMONIALS.map(
                  (
                    testimonial,
                    index
                  ) => {
                    /*
                      Every 3 reviews belong to one row.

                      Row 1 = 0,1,2
                      Row 2 = 3,4,5

                      This makes the reviews naturally appear
                      row-by-row.
                    */
                    const row =
                      Math.floor(
                        index / 3
                      );

                    /*
                      Two rows total.

                      Each row gets its own section of the
                      testimonial entrance.
                    */
                    const rowProgress =
                      clamp01(
                        (testimonialsSlide.enterT -
                          row * 0.32) /
                          0.32
                      );

                    const cardOpacity =
                      reduceMotion
                        ? 1
                        : easeOutCubic(
                            rowProgress
                          );

                    /*
                      Very small vertical movement so the cards
                      feel like they are gently arriving.
                    */
                    const cardY =
                      reduceMotion
                        ? 0
                        : (1 -
                            rowProgress) *
                          28;

                    return (
                      <motion.div
                        key={
                          testimonial.name
                        }
                        initial={false}
                        animate={{
                          opacity:
                            cardOpacity,
                          y: cardY,
                        }}
                        transition={{
                          duration: 1.2,
                          ease: [
                            0.16,
                            1,
                            0.3,
                            1,
                          ],
                        }}
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
                        <p className="mb-4 text-base leading-relaxed text-[var(--ink)]">
                          "{testimonial.quote}"
                        </p>

                        <p className="flex items-center justify-center gap-1 text-sm font-bold text-[var(--ink)]">
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

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Verified Customer
                        </p>
                      </motion.div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}