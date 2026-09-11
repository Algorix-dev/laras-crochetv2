import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE
   ============================================================

   SEQUENCE:

   1. LARA WORDMARK
      - Comes in large
      - Shrinks into its normal size

   2. THREE PHOTOS
      - One at a time
      - Start VERY large
      - Come from the sides
      - Shrink while moving into position
      - Finish at the exact Figma size / position / rotation
      - No white borders
      - No shadows

   3. PARAGRAPH
      - Does NOT start until the Lara/photo sequence finishes
      - Normal centered typography
      - Words reveal gradually

   4. REVIEWS
      - Does NOT start until paragraph finishes
      - Normal centered review cards

   ============================================================ */


/* ============================================================
   GLOBAL LAYOUT
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  This is deliberately long enough to give the three photos
  plenty of room to animate one after another.

  The important thing is that the animation itself is not being
  directly tied to the speed of the mouse wheel.
*/
const TRACK_VH = 760;


/* ============================================================
   STAGE TIMING
   ============================================================

   Lara/photos occupy the beginning.

   Paragraph starts only AFTER the entire photo sequence.

   Reviews start only AFTER paragraph is completely finished.
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.52,
  },

  paragraph: {
    start: 0.57,
    end: 0.80,
  },

  testimonials: {
    start: 0.85,
    end: 1.0,
  },
};


/* ============================================================
   GENERAL STAGE MOVEMENT
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.72,
  holdFrac: 0.18,
  exitFrac: 0.10,
  travel: 45,
};


/* ============================================================
   PHOTO ENTRANCE
   ============================================================ */

/*
  Large starting size.

  The photos are intentionally MUCH bigger when they first
  appear so the user can clearly see the animation.
*/
const PHOTO_ENTER_START_SCALE = 3.0;

/*
  How far outside the composition the photo begins.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 700;

/*
  Each photo gets a long entrance.

  This is independent of how quickly the user scrolls once
  the photo has been triggered.
*/
const PHOTO_ENTER_DURATION_S = 2.8;


/*
  Extra rotation while entering.

  It settles to the exact Figma angle.
*/
const PHOTO_ENTER_SPIN_OFFSET = 12;


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


  /* ---------------------------
     ENTER
     --------------------------- */

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


  /* ---------------------------
     HOLD
     --------------------------- */

  if (local <= holdEnd) {
    return {
      opacity: 1,
      translateY: 0,
      enterT: 1,
    };
  }


  /* ---------------------------
     EXIT
     --------------------------- */

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


/* ============================================================
   WORD-BY-WORD PARAGRAPH DATA
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
   EXACT FIGMA PHOTO POSITIONS
   ============================================================

   Figma frame:
   1920 × 1176

   IMPORTANT:

   Figma rotation:
     +8.21° = anti-clockwise
      0°    = straight
    -19.63° = clockwise

   CSS uses the opposite sign visually, so we convert:

     +8.21  → -8.21 CSS
      0     →  0 CSS
    -19.63  → +19.63 CSS
   ============================================================ */

const PHOTO_ASPECT_RATIO =
  "175.59957556823136 / 103.72862812295645";


const SCATTER_PHOTOS = [
  {
    id: "front",

    src: scatterTeal,

    alt:
      "Lara's Crochet customer wearing a teal crochet dress",

    /* EXACT FIGMA */
    width: 175.59957556823136,
    height: 103.72862812295645,
    left: 866.92,
    top: 114.87,

    figmaAngle: 8.21,

    zIndex: 30,

    /*
      First photo.
    */
    enterSide: "left",

    /*
      Starts first.
    */
    enterStart: 0.05,
  },


  {
    id: "middle",

    src: scatterBeach,

    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    /* EXACT FIGMA */
    width: 175.59957885742188,
    height: 103.72863006591797,
    left: 860.18,
    top: 119.27,

    figmaAngle: 0,

    zIndex: 20,

    /*
      Second photo.
    */
    enterSide: "right",

    enterStart: 0.38,
  },


  {
    id: "back",

    src: scatterStreet,

    alt:
      "Street-style portrait",

    /* EXACT FIGMA */
    width: 175.59958036211256,
    height: 103.72863095475553,
    left: 866.81,
    top: 92.77,

    figmaAngle: -19.63,

    zIndex: 10,

    /*
      Third photo.
    */
    enterSide: "left",

    enterStart: 0.71,
  },
];


/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;


/*
  Keep the original page side spacing.
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


  /* ---------------------------
     Scroll progress
     --------------------------- */

  const [progress, setProgress] = useState(0);


  /* ---------------------------
     Pin state
     --------------------------- */

  const [pinState, setPinState] =
    useState("before");


  /* ---------------------------
     Reduced motion
     --------------------------- */

  const [reduceMotion, setReduceMotion] =
    useState(false);


  /* ---------------------------
     Photos that have started
     --------------------------- */

  const [enteredPhotos, setEnteredPhotos] =
    useState({});


  /* ---------------------------
     Paragraph words
     --------------------------- */

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

    return () =>
      mq.removeEventListener?.(
        "change",
        onChange
      );
  }, []);


  /* ============================================================
     SCROLL TRACKING
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


        /* ---------------------------
           Before showcase
           --------------------------- */

        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          next = 0;
        }


        /* ---------------------------
           Showcase finished
           --------------------------- */

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


        /* ---------------------------
           Showcase pinned
           --------------------------- */

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
     LARA WORDMARK ANIMATION
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
    Lara begins large and settles to normal.

    This does NOT affect paragraph/review sizing.
  */

  const wordmarkScale = reduceMotion
    ? 1
    : 1.55 -
      0.55 *
        wordmarkFadeT;


  /* ============================================================
     PHOTO TRIGGERS
     ============================================================

     IMPORTANT:

     The three photos are NOT all triggered together.

     Each has a separate threshold.

     Once triggered, Framer Motion gets a full 2.8 seconds
     to perform the large → small entrance.
     ============================================================ */

  useEffect(() => {
    if (reduceMotion) return;


    /*
      If we completely leave the Lara stage while scrolling
      backwards, reset the photos so the animation can replay.
    */

    if (
      wordmarkSlide.enterT <= 0.01
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
     PINNED CONTAINER
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
  }


  else if (
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
  }


  else {
    containerStyle = {
      position: "absolute",
      top: afterTopRef.current,
      left: 0,
      right: 0,
      height: "100vh",
    };
  }


  /* ============================================================
     SHARED STAGE STYLE
     ============================================================ */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,

    /*
      Only the stage itself transitions.

      This does NOT resize the paragraph/reviews.
    */
    transition:
      "opacity 0.45s ease, transform 0.45s ease",
  };


  /* ============================================================
     RENDER
     ============================================================ */

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
              STAGE A — LARA + THREE PHOTOS
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
                wordmarkSlide.opacity >
                0.5
                  ? "auto"
                  : "none",
            }}
          >

            {/* ----------------------------------------------
                MAIN LARA COMPOSITION
                ---------------------------------------------- */}

            <div
              className="relative mx-auto w-full max-w-[1080px]"
              style={{
                opacity:
                  wordmarkFadeT,
              }}
            >


              {/* ==========================================
                  DECORATIVE BACKGROUND
                  ==========================================

                  Restored.

                  No glow is added here.
                  ========================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  width: "100vw",
                }}
              />


              {/* ==========================================
                  LARA WORDMARK
                  ========================================== */}

              <img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="relative z-10 block h-auto w-full pointer-events-none select-none"
                style={{
                  transform: `scale(${wordmarkScale})`,
                  transformOrigin:
                    "50% 50%",
                }}
              />


              {/* ==========================================
                  PHOTO LAYER
                  ========================================== */}

              <div
                className="pointer-events-none absolute inset-0 z-20 overflow-visible"
              >

                {SCATTER_PHOTOS.map(
                  (photo) => {
                    const entered =
                      reduceMotion ||
                      !!enteredPhotos[
                        photo.id
                      ];


                    /*
                      Convert Figma angle into CSS angle.

                      Figma:
                        +8.21 = anti-clockwise
                        -19.63 = clockwise

                      CSS needs the opposite sign.
                    */

                    const cssFinalRotation =
                      -photo.figmaAngle;


                    /*
                      Side from which the photo
                      enters.
                    */

                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;


                    /*
                      EXACT Figma coordinates
                      converted to percentages.

                      We position these relative to
                      the 1920 × 1176 Figma frame.
                    */

                    const finalLeft =
                      `${
                        (photo.left /
                          1920) *
                        100
                      }%`;


                    const finalTop =
                      `${
                        (photo.top /
                          1176) *
                        100
                      }%`;


                    const finalWidth =
                      `${
                        (photo.width /
                          1920) *
                        100
                      }%`;


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

                                /*
                                  NORMAL Figma size
                                */

                                scale: 1,

                                /*
                                  Finish exactly
                                  at the Figma position.
                                */

                                x: 0,
                                y: 0,

                                /*
                                  Finish at the exact
                                  Figma angle.
                                */

                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                /*
                                  START STATE
                                */

                                opacity: 0,

                                /*
                                  VERY BIG
                                */

                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                /*
                                  Start from side.
                                */

                                x:
                                  sideOffset,

                                /*
                                  Keep the vertical
                                  Figma position.
                                */

                                y: 0,

                                /*
                                  Slightly more rotated
                                  while entering.
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
                            This is deliberately slow.

                            Every photo gets its own
                            complete 2.8 second animation.
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

                          left:
                            finalLeft,

                          top:
                            finalTop,

                          width:
                            finalWidth,

                          height:
                            "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            NO WHITE BORDER
                          */

                          border: "none",

                          borderRadius: 0,

                          boxShadow:
                            "none",

                          /*
                            Keeps the enlargement
                            centered on the actual image.
                          */

                          transformOrigin:
                            "50% 50%",

                          /*
                            Prevents the browser from
                            introducing a visible image
                            border.
                          */

                          display:
                            "block",
                        }}

                        className="select-none object-cover"
                      />
                    );
                  }
                )}

              </div>
            </div>
          </div>


          {/* ==================================================
              STAGE B — PARAGRAPH
              ==================================================

              IMPORTANT:

              This stage is completely separate from Lara.

              It cannot appear until STAGE A has finished.

              Typography is intentionally back to a normal,
              centered size.
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
                max-w-2xl
                space-y-5
                text-center
                text-base
                leading-relaxed
                text-[var(--ink)]
                md:text-xl
                md:leading-[1.6]
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

                        /*
                          Slow down the word reveal.

                          The paragraph itself has enough
                          scroll space now, so the words
                          don't pile in instantly.
                        */

                        const wordT =
                          reduceMotion
                            ? 1
                            : clamp01(
                                (
                                  paragraphSlide.enterT -
                                  index /
                                    totalWords
                                ) /
                                  (
                                    1 /
                                      totalWords
                                  )
                              );


                        return (
                          <span
                            key={index}
                            style={{
                              opacity:
                                wordT,

                              transition:
                                "opacity 0.25s linear",
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
              STAGE C — REVIEWS
              ==================================================

              Reviews only begin after paragraph stage.

              Kept at a normal size.
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
                testimonialsSlide.opacity >
                0.5
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
                gap-5
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
                      p-5
                      text-center
                      ${
                        index % 3 ===
                        1
                          ? "md:-translate-y-5"
                          : ""
                      }
                    `}
                  >

                    <p
                      className="
                        mb-4
                        text-sm
                        leading-relaxed
                        text-[var(--ink)]
                        md:text-base
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