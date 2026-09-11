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

   Animation order:

   1. LARA WORDMARK appears
   2. BACK photo enters from the BOTTOM
   3. BACK photo becomes normal size and settles
   4. MIDDLE photo enters from the LEFT
   5. MIDDLE photo becomes normal size and settles
   6. FRONT photo enters from the RIGHT
   7. FRONT photo becomes normal size and settles
   8. Lara section holds
   9. Paragraph appears slowly
   10. Paragraph holds
   11. Reviews appear slowly
   12. Reviews hold
   13. Section finishes and page continues to footer

   Only ONE photo is visible at a time.
   ============================================================ */


/* ============================================================
   BASIC SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Long scroll track.

  This gives the Lara section plenty of physical scroll distance
  before paragraph/reviews take over.
*/
const TRACK_VH = 760;


/* ============================================================
   SECTION TIMELINE
   ============================================================

   The Lara stage deliberately occupies most of the beginning.

   The paragraph starts later and has its own large section.

   Reviews get the final portion.
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0,
    end: 0.56,
  },

  paragraph: {
    start: 0.67,
    end: 0.84,
  },

  testimonials: {
    start: 0.88,
    end: 1,
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
  IMPORTANT:

  These animations are intentionally slower than before.

  The photos start VERY large and remain visible while shrinking.

  There is NO opacity fade on the photo itself.
*/

const PHOTO_ENTER_DURATION_S = 3.2;

/*
  Very large starting scale.

  2.4 means approximately 240% of the final Figma size.
*/
const PHOTO_ENTER_START_SCALE = 2.4;


/*
  Extra rotation while entering.

  This makes the large photo feel like it is coming into place
  rather than simply scaling down.
*/
const PHOTO_ENTER_SPIN_OFFSET = 10;


/*
  How far outside the visible composition the photo starts.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 700;
const PHOTO_ENTER_BOTTOM_DISTANCE = 650;


/*
  Small pause after a photo has reached its final position.

  The next photo waits for this before entering.
*/
const PHOTO_SETTLE_DELAY_MS = 550;


/* ============================================================
   FIGMA PHOTO DIMENSIONS
   ============================================================ */

const FIGMA_WIDTH = 175.59957556823136;
const FIGMA_HEIGHT = 103.72862812295645;

const PHOTO_ASPECT_RATIO = `${FIGMA_WIDTH} / ${FIGMA_HEIGHT}`;


/*
  The photos should remain approximately this physical size
  relative to the 1920px Figma composition.

  At 1920px viewport width:

  175.6px ≈ 9.15vw
*/
const PHOTO_BOX_WIDTH = "clamp(120px, 9.15vw, 175.6px)";


/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================

   Original Figma:

   Front:
     width: 175.59957556823136
     height: 103.72862812295645
     angle: +8.21°
     top: 114.87px
     left: 866.92px

   Middle:
     width: 175.59957885742188
     height: 103.72863006591797
     angle: 0°
     top: 119.27px
     left: 860.18px

   Back:
     width: 175.59958036211256
     height: 103.72863095475553
     angle: -19.63°
     top: 92.77px
     left: 866.81px
*/


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
      Figma negative means clockwise.
    */
    figmaAngle: -19.63,

    /*
      BACK is first.
    */
    sequence: 0,

    /*
      Comes from below.
    */
    enterSide: "bottom",

    zIndex: 1,
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
      Middle is perfectly straight.
    */
    figmaAngle: 0,

    /*
      Middle is second.
    */
    sequence: 1,

    /*
      Comes from the left.
    */
    enterSide: "left",

    zIndex: 2,
  },

  {
    id: "front",
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",

    width: 175.59957556823136,
    height: 103.72862812295645,

    left: 866.92,
    top: 114.87,

    /*
      Figma +8.21 means anti-clockwise.

      CSS uses the opposite visual direction,
      therefore final CSS rotation is -8.21°.
    */
    figmaAngle: 8.21,

    /*
      Front is last.
    */
    sequence: 2,

    /*
      Comes from the right.
    */
    enterSide: "right",

    zIndex: 3,
  },
];


/* ============================================================
   WORDMARK SETTINGS
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;


/*
  Keep the existing horizontal page margins.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";


/*
  Lara starts slightly oversized and settles into normal size.
*/
const WORDMARK_START_SCALE = 1.18;


/* ============================================================
   HELPERS
   ============================================================ */

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}


function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}


/*
  General stage animation.

  This is still scroll-based, but intentionally has a generous
  amount of hold time so the content doesn't fly past.
*/

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
  Flatten the paragraphs into individual words.

  The reveal remains word-by-word, but the timing is deliberately
  slow enough to read.
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

  /*
    Current scroll progress through the entire pinned section.
  */
  const [progress, setProgress] = useState(0);

  /*
    Controls whether the section is:

    before viewport
    pinned
    after viewport
  */
  const [pinState, setPinState] =
    useState("before");

  /*
    Accessibility.
  */
  const [reduceMotion, setReduceMotion] =
    useState(false);

  /*
    Which photo is currently allowed to animate.

    -1 = none
     0 = back
     1 = middle
     2 = front
     3 = sequence complete
  */
  const [activePhoto, setActivePhoto] =
    useState(-1);

  /*
    Keeps track of whether each photo has finished.
  */
  const [completedPhotos, setCompletedPhotos] =
    useState({});

  /*
    Prevents the sequence from restarting repeatedly
    while the user remains in the Lara stage.
  */
  const sequenceStartedRef = useRef(false);


  /* ==========================================================
     PARAGRAPH WORD DATA
     ========================================================== */

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
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    setReduceMotion(mediaQuery.matches);

    const onChange = (event) => {
      setReduceMotion(event.matches);
    };

    mediaQuery.addEventListener?.(
      "change",
      onChange
    );

    return () => {
      mediaQuery.removeEventListener?.(
        "change",
        onChange
      );
    };
  }, []);


  /* ==========================================================
     MEASURE PINNED CONTENT
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

    const resizeObserver =
      new ResizeObserver(measure);

    if (contentRef.current) {
      resizeObserver.observe(
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

    return () => {
      resizeObserver.disconnect();

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
     SCROLL TRACKING
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) return;

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
          BEFORE
        */
        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          nextProgress = 0;
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
          nextProgress = 1;

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

          nextProgress =
            pinnableRange > 0
              ? clamp01(
                  (NAVBAR_HEIGHT_PX -
                    rect.top) /
                    pinnableRange
                )
              : 1;
        }

        setPinState((previous) =>
          previous === nextState
            ? previous
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
      cancelAnimationFrame(
        rafRef.current
      );
    };
  }, [reduceMotion]);


  /* ==========================================================
     STAGE PROGRESS
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
     WORDMARK SCALE
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
    Lara starts a little larger and settles to 100%.

    This is subtle so the logo itself doesn't look distorted.
  */

  const wordmarkScale =
    reduceMotion
      ? 1
      : WORDMARK_START_SCALE -
        (WORDMARK_START_SCALE - 1) *
          wordmarkFadeT;


  /* ==========================================================
     START PHOTO SEQUENCE
     ==========================================================

     This is the important part.

     We DO NOT trigger all three photos from scroll thresholds.

     Instead:

       scroll reaches Lara
          ↓
       BACK begins
          ↓
       BACK completes
          ↓
       MIDDLE begins
          ↓
       MIDDLE completes
          ↓
       FRONT begins
          ↓
       FRONT completes
          ↓
       Lara sequence complete

     This prevents the "three photos suddenly appearing together"
     problem when scrolling at different speeds.
  */

  useEffect(() => {
    if (reduceMotion) {
      setActivePhoto(3);
      return;
    }

    /*
      User is above the Lara stage again.

      Reset the sequence so it can replay.
    */

    if (wordmarkSlide.enterT <= 0.01) {
      sequenceStartedRef.current = false;

      setActivePhoto(-1);
      setCompletedPhotos({});

      return;
    }


    /*
      Start the first photo once the Lara wordmark is established.
    */

    if (
      !sequenceStartedRef.current &&
      wordmarkSlide.enterT >= 0.18
    ) {
      sequenceStartedRef.current = true;

      setActivePhoto(0);
      setCompletedPhotos({});
    }
  }, [
    wordmarkSlide.enterT,
    reduceMotion,
  ]);


  /* ==========================================================
     WHEN A PHOTO FINISHES
     ========================================================== */

  function handlePhotoComplete(index) {
    setCompletedPhotos((previous) => ({
      ...previous,
      [index]: true,
    }));


    /*
      Wait a little after the current image has settled,
      then allow the next one to enter.
    */

    window.setTimeout(() => {
      setActivePhoto((current) => {
        /*
          Don't advance if something changed unexpectedly.
        */
        if (current !== index) {
          return current;
        }


        /*
          Start next photo.
        */

        if (
          index <
          SCATTER_PHOTOS.length - 1
        ) {
          return index + 1;
        }


        /*
          All three photos are finished.
        */

        return 3;
      });
    }, PHOTO_SETTLE_DELAY_MS);
  }


  /* ==========================================================
     PINNED CONTAINER
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


  /* ==========================================================
     BASE LAYER STYLE
     ========================================================== */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,

    /*
      Slower transitions between the major stages.
    */
    transition:
      "opacity 0.9s ease, transform 0.9s ease",
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
              STAGE A — LARA WORDMARK + PHOTOS
              ================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              /*
                Lara remains visible for a long time.
              */
              opacity:
                reduceMotion
                  ? 1
                  : wordmarkSlide.opacity,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${wordmarkSlide.translateY}px)`,

              /*
                Don't let this invisible stage intercept clicks.
              */
              pointerEvents:
                wordmarkSlide.opacity >
                0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="relative mx-auto w-full max-w-[1080px]"
              style={{
                opacity: wordmarkFadeT,
              }}
            >


              {/* ============================================
                  LARA DECOR
                  ============================================

                  No glow.

                  No blur.

                  No white background effect.

                  The original Figma decoration remains behind
                  the Lara wordmark.
              */}

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
                }}
              />


              {/* ============================================
                  LARA WORDMARK
                  ============================================ */}

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


              {/* ============================================
                  PHOTO STACK

                  The entire stack is positioned relative to
                  the center of the Lara wordmark.

                  This is why the photos stay centered instead
                  of drifting to the top-left.
                  ============================================ */}

              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  z-20
                  overflow-visible
                  pointer-events-none
                "
                style={{
                  width: PHOTO_BOX_WIDTH,
                  aspectRatio:
                    PHOTO_ASPECT_RATIO,

                  /*
                    The Figma photos sit slightly above the exact
                    mathematical center of the wordmark.

                    This is a small correction so they visually
                    sit ON the Lara rather than above it.
                  */

                  transform:
                    "translate(-50%, -50%) translate(-7px, -3px)",
                }}
              >

                {SCATTER_PHOTOS.map(
                  (photo, index) => {

                    const isActive =
                      activePhoto === index;

                    const isFinished =
                      !!completedPhotos[index];

                    /*
                      CSS rotation is opposite to the Figma
                      convention.

                      Figma:
                        +8.21 = anti-clockwise
                        -19.63 = clockwise

                      CSS:
                        -8.21
                        +19.63
                    */

                    const cssFinalRotation =
                      -photo.figmaAngle;


                    /* ----------------------------------------
                       START POSITION
                       ---------------------------------------- */

                    let startX = 0;
                    let startY = 0;

                    if (
                      photo.enterSide ===
                      "left"
                    ) {
                      startX =
                        -PHOTO_ENTER_SIDE_DISTANCE;
                    }

                    else if (
                      photo.enterSide ===
                      "right"
                    ) {
                      startX =
                        PHOTO_ENTER_SIDE_DISTANCE;
                    }

                    else if (
                      photo.enterSide ===
                      "bottom"
                    ) {
                      startY =
                        PHOTO_ENTER_BOTTOM_DISTANCE;
                    }


                    /*
                      Only the currently active photo is visible.

                      Finished photos are hidden before the next
                      one starts so there is NEVER a moment where
                      two photos overlap visibly.
                    */

                    const shouldShow =
                      isActive;


                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}

                        initial={false}

                        animate={
                          shouldShow
                            ? {
                                /*
                                  FULLY VISIBLE.

                                  No fade-in.
                                */
                                opacity: 1,

                                /*
                                  Starts huge.
                                */
                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                /*
                                  Comes from its designated
                                  direction.
                                */
                                x: startX,

                                y: startY,

                                /*
                                  Starts with a little extra
                                  rotation.
                                */
                                rotate:
                                  cssFinalRotation +
                                  (
                                    photo.enterSide ===
                                    "left"
                                      ? -PHOTO_ENTER_SPIN_OFFSET
                                      : photo.enterSide ===
                                        "right"
                                      ? PHOTO_ENTER_SPIN_OFFSET
                                      : PHOTO_ENTER_SPIN_OFFSET
                                  ),
                              }
                            : {
                                opacity: 0,
                                scale: 1,
                                x: 0,
                                y: 0,
                                rotate:
                                  cssFinalRotation,
                              }
                        }

                        /*
                          The important animation:

                          BIG
                            ↓
                          slowly shrink
                            ↓
                          NORMAL
                            ↓
                          fit in Figma position
                        */

                        transition={
                          shouldShow
                            ? {
                                duration:
                                  PHOTO_ENTER_DURATION_S,

                                ease: [
                                  0.16,
                                  1,
                                  0.3,
                                  1,
                                ],
                              }
                            : {
                                duration: 0,
                              }
                        }

                        /*
                          When the active photo has finished
                          shrinking into place, trigger the next.
                        */

                        onAnimationComplete={() => {
                          if (
                            isActive &&
                            !isFinished
                          ) {
                            handlePhotoComplete(
                              index
                            );
                          }
                        }}

                        style={{
                          position:
                            "absolute",

                          inset: 0,

                          /*
                            Exact Figma width.
                          */
                          width: "100%",

                          /*
                            Exact aspect ratio.
                          */
                          height: "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            Absolutely NO white border.
                          */
                          border: "none",

                          borderRadius: 0,

                          boxShadow:
                            "none",

                          outline: "none",

                          /*
                            Keep the animation centered.
                          */
                          transformOrigin:
                            "50% 50%",

                          /*
                            Prevent browser interpolation
                            from making the image look soft.
                          */
                          backfaceVisibility:
                            "hidden",

                          WebkitBackfaceVisibility:
                            "hidden",
                        }}

                        className="
                          block
                          select-none
                          object-cover
                          pointer-events-none
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
              ==================================================

              IMPORTANT:
              This is 16px, matching the Figma.
              ================================================== */}

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
                paragraphSlide.opacity >
                0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="
                mx-auto
                max-w-3xl
                space-y-6
                text-center
                text-[16px]
                leading-[1.6]
                text-[var(--ink)]
              "
            >

              {wordParagraphs.map(
                (words, paragraphIndex) => (

                  <p key={paragraphIndex}>

                    {words.map(
                      ({ word, index }) => {

                        /*
                          Slow word-by-word reveal.

                          We spread the words over a much larger
                          portion of the paragraph entrance.
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
                              opacity: wordT,

                              /*
                                Small transition so individual
                                words don't snap.
                              */
                              transition:
                                "opacity 0.35s linear",
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

              9 reviews.

              Smaller cards so all 9 can comfortably fit into
              the reviews section.

              The whole section enters and exits slowly.
              ================================================== */}

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
                max-w-[1100px]
                grid-cols-1
                gap-3
                sm:grid-cols-2
                md:grid-cols-3
              "
            >

              {TESTIMONIALS.map(
                (
                  testimonial,
                  index
                ) => (

                  <motion.div
                    key={
                      testimonial.name
                    }

                    /*
                      Very subtle movement.

                      The review cards themselves shouldn't jump
                      around while appearing.
                    */
                    initial={false}

                    animate={{
                      opacity:
                        testimonialsSlide.opacity,
                      y:
                        index % 3 === 1
                          ? -8
                          : 0,
                    }}

                    transition={{
                      duration: 1.2,
                      ease: [
                        0.22,
                        1,
                        0.36,
                        1,
                      ],
                    }}

                    className="
                      h-full
                      border
                      border-[var(--line)]
                      bg-[var(--cream)]
                      p-4
                      text-center
                    "
                  >

                    <p
                      className="
                        mb-3
                        text-[13px]
                        leading-[1.5]
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
                        text-[12px]
                        font-bold
                        text-[var(--ink)]
                      "
                    >

                      {testimonial.name}

                      <span
                        aria-hidden="true"
                        className="
                          inline-flex
                          h-3
                          w-3
                          items-center
                          justify-center
                          rounded-full
                          bg-[var(--maroon)]
                          text-[8px]
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
                      "
                    >
                      Verified Customer
                    </p>

                  </motion.div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}