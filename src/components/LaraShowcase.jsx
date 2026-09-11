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

   1. Lara wordmark appears
   2. 3 photos enter ONE AT A TIME
      - start VERY BIG
      - fully visible
      - slide in
      - shrink to exact Figma size
      - settle at the centre of Lara
   3. Lara/photo section finishes
   4. Paragraph appears
   5. Paragraph stays long enough to be read
   6. Reviews appear slowly, 3 × 3
   7. All 9 reviews remain visible
   8. Reviews linger before leaving
   9. Footer follows naturally

   IMPORTANT:
   The photos no longer use opacity to reveal themselves.
   This makes the BIG → SMALL transformation clearly visible.
   ============================================================ */


/* ============================================================
   GLOBAL TIMING
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Increased so every stage has enough breathing room.

  The user scrolls through this entire section:
    Lara → Paragraph → Reviews
*/
const TRACK_VH = 760;


/* ============================================================
   STAGE TIMELINE
   ============================================================ */

const STAGE = {
  /*
    Lara gets a large amount of the beginning of the scroll.
  */
  wordmark: {
    start: 0.0,
    end: 0.38,
  },

  /*
    Paragraph starts later and finishes before reviews.
  */
  paragraph: {
    start: 0.45,
    end: 0.69,
  },

  /*
    Reviews have their own large section.
  */
  testimonials: {
    start: 0.74,
    end: 1.0,
  },
};


/* ============================================================
   GENERAL SLIDE SETTINGS
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.25,
  exitFrac: 0.20,
  travel: 45,
};


/* ============================================================
   PHOTO ENTRANCE
   ============================================================ */

/*
  The photos deliberately start VERY large.

  2.8 seconds gives enough time to actually SEE:

      BIG PHOTO
          ↓
      sliding in
          ↓
      shrinking
          ↓
      final size
          ↓
      settling

  There is NO opacity fade.
*/
const PHOTO_ENTER_DURATION_S = 2.8;

const PHOTO_ENTER_START_SCALE = 2.35;

/*
  How far outside the centre the image begins.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 520;

/*
  Extra rotation while entering.
  It settles into the exact Figma angle.
*/
const PHOTO_ENTER_SPIN_OFFSET = 16;


/* ============================================================
   PHOTO FINAL SIZE
   ============================================================ */

const PHOTO_WIDTH = 175.59957556823136;
const PHOTO_HEIGHT = 103.72862812295645;

const PHOTO_ASPECT_RATIO =
  `${PHOTO_WIDTH} / ${PHOTO_HEIGHT}`;


/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================

   These are kept as the original Figma measurements.

   Figma:
   Front:
      width  175.59957556823136
      height 103.72862812295645
      angle  +8.21°
      top    114.87
      left   866.92

   Middle:
      width  175.59957885742188
      height 103.72863006591797
      angle  0°
      top    119.27
      left   860.18

   Back:
      width  175.59958036211256
      height 103.72863095475553
      angle  -19.63°
      top    92.77
      left   866.81

   Figma convention:
      positive = anti-clockwise
      negative = clockwise

   CSS convention is opposite, therefore:
      Figma +8.21  → CSS -8.21
      Figma  0     → CSS  0
      Figma -19.63 → CSS +19.63
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    id: "front",
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",

    width: 175.59957556823136,
    height: 103.72862812295645,

    left: 866.92,
    top: 114.87,

    figmaAngle: 8.21,

    /*
      This is the frontmost image.
    */
    zIndex: 3,

    /*
      First photo.
    */
    enterSide: "left",
    enterStart: 0.05,
  },

  {
    id: "middle",
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    width: 175.59957885742188,
    height: 103.72863006591797,

    left: 860.18,
    top: 119.27,

    figmaAngle: 0,

    zIndex: 2,

    /*
      Second photo.
    */
    enterSide: "right",
    enterStart: 0.19,
  },

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
      Third photo.
    */
    enterSide: "left",
    enterStart: 0.33,
  },
];


/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;


/* ============================================================
   RESPONSIVE PAGE PADDING
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

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


/* ============================================================
   SECTION SLIDE CALCULATION
   ============================================================ */

function computeSlide(
  progress,
  start,
  end,
  {
    enterFrac,
    holdFrac,
    exitFrac,
    travel,
  }
) {
  const span = end - start;

  const local = clamp01(
    (progress - start) / span
  );

  const enterEnd = enterFrac;
  const holdEnd = enterFrac + holdFrac;

  /*
    ENTER
  */
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
      local,
    };
  }

  /*
    HOLD
  */
  if (local <= holdEnd) {
    return {
      opacity: 1,
      translateY: 0,
      enterT: 1,
      local,
    };
  }

  /*
    EXIT
  */
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
    local,
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
   TESTIMONIALS — 9 TOTAL
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
      "The craftsmanship is beautiful and you can feel how much care went into every detail.",
    name: "Amaka N.",
  },

  {
    quote:
      "My order looked even better in person. The fit and finishing were both amazing.",
    name: "Zainab A.",
  },

  {
    quote:
      "I love that every piece feels personal. You can really tell it was made specifically for you.",
    name: "Damilola O.",
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

  const [pinState, setPinState] =
    useState("before");

  const [reduceMotion, setReduceMotion] =
    useState(false);

  /*
    Stores which photos have been triggered.
  */
  const [enteredPhotos, setEnteredPhotos] =
    useState({});

  /*
    Keeps track of the next photo that is allowed
    to enter.

    This prevents all 3 photos from starting together
    if the user scrolls quickly.
  */
  const nextPhotoIndexRef = useRef(0);

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

    const onChange = (e) =>
      setReduceMotion(e.matches);

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


  /* ==========================================================
     SCROLL / PIN SYSTEM
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


        /*
          BEFORE
        */
        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          next = 0;
        }

        /*
          AFTER
        */
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

        /*
          PINNED
        */
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
     CURRENT PROGRESS
     ========================================================== */

  const p = reduceMotion
    ? 1
    : progress;


  /* ==========================================================
     STAGE CALCULATIONS
     ========================================================== */

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
     WORDMARK FADE

     The WORDMARK itself still has its original entrance.

     The photos DO NOT use this opacity.
     ========================================================== */

  const wordmarkFadeT =
    reduceMotion
      ? 1
      : easeOutCubic(
          clamp01(
            wordmarkSlide.enterT /
              WORDMARK_FADE_ENTER_END
          )
        );


  /* ==========================================================
     WORDMARK SCALE
     ========================================================== */

  const wordmarkScale =
    reduceMotion
      ? 1
      : 1.5 -
        0.5 * wordmarkFadeT;


  /* ==========================================================
     PHOTO TRIGGER SYSTEM
     ==========================================================

     The important fix:

     We do NOT simply say:

       "if threshold passed, activate every photo."

     That caused multiple photos to enter together
     when scrolling quickly.

     Instead, only the next photo is allowed to trigger.
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) return;


    /*
      Reset when we return to the very beginning.
    */
    if (
      wordmarkSlide.enterT <= 0.01
    ) {
      nextPhotoIndexRef.current = 0;

      setEnteredPhotos({});

      return;
    }


    const nextIndex =
      nextPhotoIndexRef.current;

    if (
      nextIndex >=
      SCATTER_PHOTOS.length
    ) {
      return;
    }


    const nextPhoto =
      SCATTER_PHOTOS[nextIndex];


    /*
      Only trigger ONE photo at a time.

      Once it has entered, the next photo becomes
      eligible on a later scroll position.
    */
    if (
      wordmarkSlide.enterT >=
      nextPhoto.enterStart
    ) {
      setEnteredPhotos((prev) => ({
        ...prev,
        [nextPhoto.id]: true,
      }));

      nextPhotoIndexRef.current =
        nextIndex + 1;
    }
  }, [
    wordmarkSlide.enterT,
    reduceMotion,
  ]);


  /* ==========================================================
     CONTAINER PINNING
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
  }


  else if (
    pinState === "pinned"
  ) {
    containerStyle = {
      position: "fixed",
      top: NAVBAR_HEIGHT_PX,
      left: 0,
      right: 0,
      height:
        `calc(100vh - ${NAVBAR_HEIGHT_PX}px)`,
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


  /* ==========================================================
     SHARED LAYER STYLE
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
              height:
                `${TRACK_VH}vh`,
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
              STAGE A — LARA WORDMARK + PHOTOS
              ====================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity:
                reduceMotion
                  ? 1
                  : wordmarkSlide.opacity,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${wordmarkSlide.translateY}px)`,

              pointerEvents:
                wordmarkSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="
                relative
                mx-auto
                w-full
                max-w-[1080px]
              "
              style={{
                opacity: wordmarkFadeT,
              }}
            >


              {/* ==================================================
                  LARA DECORATION
                  ================================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  top-1/2
                  left-1/2
                  z-0
                  max-w-none
                  select-none
                  -translate-x-1/2
                  -translate-y-1/2
                "
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
                  transform:
                    `scale(${wordmarkScale})`,
                  transformOrigin:
                    "50% 50%",
                }}
              />


              {/* ==================================================
                  PHOTO STACK
                  ==================================================

                  IMPORTANT:

                  The stack itself is centred directly over
                  the Lara wordmark.

                  We don't use the old Figma left/top values
                  as percentages of the wordmark container.

                  Instead, we use the exact Figma measurements
                  to calculate the tiny offsets around the
                  central anchor.

                  This keeps the entire stack centred even
                  when the screen is 1920px.
                  ================================================== */}

              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  z-20
                  pointer-events-none
                  overflow-visible
                "
                style={{
                  width: `${PHOTO_WIDTH}px`,
                  height: `${PHOTO_HEIGHT}px`,
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
                      Exact Figma → CSS rotation.
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;


                    /*
                      Entry direction.
                    */
                    const sideOffset =
                      photo.enterSide === "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;


                    /*
                      Final offsets from the centre.

                      These are intentionally tiny because
                      the Figma stack is centred around Lara.
                    */
                    const finalX =
                      (photo.left -
                        960) *
                      0.08;


                    const finalY =
                      (photo.top -
                        117.5) *
                      0.08;


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
                                  FULL OPACITY.

                                  This is the important fix:
                                  you can now actually see the
                                  huge photo shrinking.
                                */
                                opacity: 1,

                                /*
                                  Exact final size.
                                */
                                scale: 1,

                                /*
                                  Settle into centre.
                                */
                                x: finalX,
                                y: finalY,

                                /*
                                  Exact Figma angle.
                                */
                                rotate:
                                  cssFinalRotation,
                              }

                            : {
                                /*
                                  Keep it visible while huge.
                                  NO fade.
                                */
                                opacity: 1,

                                /*
                                  Very large starting state.
                                */
                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                /*
                                  Start from the side.
                                */
                                x:
                                  finalX +
                                  sideOffset,

                                y:
                                  finalY,

                                /*
                                  Start with extra rotation,
                                  then settle.
                                */
                                rotate:
                                  cssFinalRotation +
                                  (
                                    photo.enterSide ===
                                    "left"
                                      ? -PHOTO_ENTER_SPIN_OFFSET
                                      : PHOTO_ENTER_SPIN_OFFSET
                                  ),
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

                        style={{
                          position:
                            "absolute",

                          left: 0,
                          top: 0,

                          width:
                            `${photo.width}px`,

                          height:
                            `${photo.height}px`,

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            NO WHITE BORDER.
                          */
                          border: "none",

                          borderRadius: 0,

                          boxShadow:
                            "none",

                          /*
                            Keeps the image itself straight
                            and clean.
                          */
                          objectFit:
                            "cover",

                          transformOrigin:
                            "50% 50%",

                          willChange:
                            "transform",
                        }}

                        className="
                          block
                          select-none
                          pointer-events-none
                        "
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

              opacity:
                reduceMotion
                  ? 0
                  : paragraphSlide.opacity,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${paragraphSlide.translateY}px)`,

              pointerEvents:
                paragraphSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="
                mx-auto
                w-full
                max-w-4xl
                space-y-8
                text-center
                text-2xl
                leading-relaxed
                text-[var(--ink)]
                md:text-4xl
                md:leading-[1.55]
                lg:text-[42px]
                lg:leading-[1.5]
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
                              opacity: wordT,
                              transition:
                                "opacity 0.2s linear",
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
              STAGE C — REVIEWS
              ====================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity:
                reduceMotion
                  ? 0
                  : testimonialsSlide.opacity,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${testimonialsSlide.translateY}px)`,

              pointerEvents:
                testimonialsSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="
                grid
                w-full
                max-w-6xl
                grid-cols-1
                gap-4
                sm:grid-cols-2
                md:grid-cols-3
                md:gap-5
              "
            >

              {TESTIMONIALS.map(
                (
                  testimonial,
                  index
                ) => {

                  /*
                    Reviews fade in slowly one after
                    another instead of all appearing
                    instantly.

                    9 reviews → roughly 3 rows.
                  */

                  const reviewProgress =
                    clamp01(
                      (
                        testimonialsSlide.enterT *
                        1.45
                      ) -
                        index * 0.10
                    );

                  const reviewOpacity =
                    reduceMotion
                      ? 1
                      : easeInOutCubic(
                          reviewProgress
                        );

                  const reviewTranslate =
                    reduceMotion
                      ? 0
                      : 22 *
                        (
                          1 -
                          reviewOpacity
                        );


                  return (
                    <motion.div
                      key={
                        testimonial.name
                      }
                      style={{
                        opacity:
                          reviewOpacity,

                        transform:
                          `translateY(${reviewTranslate}px)`,

                        /*
                          Prevents cards from becoming
                          huge at 1920px.
                        */
                        minHeight:
                          "150px",
                      }}

                      className={`
                        flex
                        h-full
                        flex-col
                        justify-center
                        border
                        border-[var(--line)]
                        bg-[var(--cream)]
                        px-5
                        py-5
                        text-center

                        ${
                          index % 3 === 1
                            ? "md:-translate-y-3"
                            : ""
                        }
                      `}
                    >

                      <p
                        className="
                          mb-3
                          text-sm
                          leading-relaxed
                          text-[var(--ink)]
                          md:text-[15px]
                          md:leading-[1.45]
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
                          text-xs
                          font-bold
                          text-[var(--ink)]
                          md:text-sm
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
                          text-[10px]
                          text-[var(--muted)]
                          md:text-xs
                        "
                      >
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

    </section>
  );
}