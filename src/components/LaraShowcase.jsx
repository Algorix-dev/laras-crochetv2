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

   1. Lara wordmark enters.
   2. Back photo enters from BELOW.
   3. Back photo settles into position.
   4. Middle photo enters from LEFT.
   5. Middle photo settles into position.
   6. Front photo enters from RIGHT.
   7. Front photo settles into position.
   8. Lara section finishes.
   9. Paragraph begins.
   10. Paragraph finishes and holds.
   11. Reviews begin.
   12. All 9 reviews remain visible long enough to read.
   13. Reviews finish.
   14. Section continues naturally to the footer.

   IMPORTANT:
   Only ONE scatter photo is rendered at a time during the
   entrance sequence. This prevents the photos from scattering
   or appearing together when scrolling quickly.
   ============================================================ */


/* ============================================================
   EASY TUNING
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  The section is intentionally long so the animations have
  enough scroll distance and do not feel rushed.
*/
const TRACK_VH = 1000;


/* ============================================================
   STAGE TIMING
   ============================================================

   Lara gets the largest amount of space because the three
   photographs need time to enter one by one.

   Paragraph and reviews are deliberately separated so they
   cannot pile on top of each other.
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.60,
  },

  paragraph: {
    start: 0.67,
    end: 0.84,
  },

  testimonials: {
    start: 0.91,
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
  travel: 50,
};


/* ============================================================
   PHOTO ENTRANCE ANIMATION
   ============================================================

   The large starting scale is intentional.

   The opacity stays at 1 while entering so the user can clearly
   SEE the photograph coming in at its large size.

   It then shrinks down to its final Figma size.
   ============================================================ */

const PHOTO_ENTER_DURATION_S = 2.8;

const PHOTO_ENTER_START_SCALE = 2.25;

/*
  How far outside the center each image begins.

  Back    = comes from below
  Middle  = comes from left
  Front   = comes from right
*/
const PHOTO_ENTER_SIDE_DISTANCE_X = 760;
const PHOTO_ENTER_SIDE_DISTANCE_Y = 620;


/* ============================================================
   PHOTO ENTRANCE THRESHOLDS
   ============================================================

   These are percentages of the Lara stage.

   The thresholds are intentionally separated.

   However, the next photo is NOT allowed to start until the
   previous photo has completely finished its animation.

   That is what prevents all three from appearing together.
   ============================================================ */

const PHOTO_TRIGGER_POINTS = [
  0.07, // back
  0.25, // middle
  0.43, // front
];


/* ============================================================
   FIGMA PHOTO SIZE
   ============================================================ */

const PHOTO_WIDTH = 175.59957556823136;
const PHOTO_HEIGHT = 103.72862812295645;

const PHOTO_ASPECT_RATIO = `${PHOTO_WIDTH} / ${PHOTO_HEIGHT}`;


/* ============================================================
   FIGMA POSITIONS
   ============================================================

   Figma frame:
   1920 × 1176

   The three images are almost perfectly centered horizontally
   around the middle of the Lara wordmark.

   Instead of positioning them from the edge of the entire
   page, we position the PHOTO STACK at the exact center of
   the Lara wordmark and use the tiny Figma offsets from there.

   This keeps them centered responsively instead of causing
   them to drift toward the top/right on different screens.
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    id: "back",

    src: scatterStreet,

    alt: "Street-style portrait",

    /*
      Figma:
      width: 175.59958036211256
      height: 103.72863095475553
      top: 92.77px
      left: 866.81px
      angle: -19.63°
    */

    width: 175.59958036211256,
    height: 103.72863095475553,

    /*
      Position relative to the centered photo stack.

      The middle image is our visual anchor.
    */
    finalX: -5.39,
    finalY: -26.5,

    /*
      User's Figma convention:
      negative = clockwise.

      CSS uses the opposite visual convention,
      therefore:
      Figma -19.63 → CSS +19.63
    */
    figmaAngle: -19.63,

    zIndex: 1,

    /*
      First photograph:
      comes from below.
    */
    enterDirection: "bottom",
  },

  {
    id: "middle",

    src: scatterBeach,

    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    /*
      Figma:
      width: 175.59957885742188
      height: 103.72863006591797
      top: 119.27px
      left: 860.18px
      angle: 0°
    */

    width: 175.59957885742188,
    height: 103.72863006591797,

    finalX: -12,
    finalY: 0,

    /*
      Figma 0° → CSS 0°
    */
    figmaAngle: 0,

    zIndex: 2,

    /*
      Second photograph:
      comes from the left.
    */
    enterDirection: "left",
  },

  {
    id: "front",

    src: scatterTeal,

    alt: "Lara's Crochet customer wearing a teal crochet dress",

    /*
      Figma:
      width: 175.59957556823136
      height: 103.72862812295645
      top: 114.87px
      left: 866.92px
      angle: +8.21°
    */

    width: 175.59957556823136,
    height: 103.72862812295645,

    finalX: -5.28,
    finalY: -4.4,

    /*
      Figma +8.21° → CSS -8.21°
    */
    figmaAngle: 8.21,

    zIndex: 3,

    /*
      Third photograph:
      comes from the right.
    */
    enterDirection: "right",
  },
];


/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;


/* ============================================================
   PAGE CONTAINER
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

  const holdEnd =
    enterFrac + holdFrac;


  /* ----------------------------------------------------------
     ENTER
     ---------------------------------------------------------- */

  if (local <= enterEnd) {
    const enterT =
      enterFrac > 0
        ? clamp01(local / enterFrac)
        : 1;

    const eased =
      easeOutCubic(enterT);

    return {
      opacity: eased,
      translateY: (1 - eased) * travel,
      enterT,
    };
  }


  /* ----------------------------------------------------------
     HOLD
     ---------------------------------------------------------- */

  if (local <= holdEnd) {
    return {
      opacity: 1,
      translateY: 0,
      enterT: 1,
    };
  }


  /* ----------------------------------------------------------
     EXIT
     ---------------------------------------------------------- */

  const exitT =
    exitFrac > 0
      ? clamp01(
          (local - holdEnd) /
            exitFrac
        )
      : 1;

  const eased =
    easeOutCubic(exitT);

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
   WORD-BY-WORD PARAGRAPH BUILDER
   ============================================================ */

function buildWordParagraphs(paragraphs) {
  let globalIndex = 0;

  const result = paragraphs.map(
    (paragraph) =>
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


  /* ----------------------------------------------------------
     GLOBAL SCROLL STATE
     ---------------------------------------------------------- */

  const [progress, setProgress] = useState(0);

  const [pinState, setPinState] =
    useState("before");


  /* ----------------------------------------------------------
     ACCESSIBILITY
     ---------------------------------------------------------- */

  const [reduceMotion, setReduceMotion] =
    useState(false);


  /* ----------------------------------------------------------
     PHOTO SEQUENCE

     -1 = nothing has entered yet
      0 = back
      1 = middle
      2 = front
     ---------------------------------------------------------- */

  const [photoStep, setPhotoStep] =
    useState(-1);


  /*
    Tracks the last photograph whose entrance has completely
    finished.

    -1 = none finished
     0 = back finished
     1 = middle finished
     2 = front finished
  */

  const [photoCompletedStep, setPhotoCompletedStep] =
    useState(-1);


  const [photoSequenceDone, setPhotoSequenceDone] =
    useState(false);


  /* ----------------------------------------------------------
     PARAGRAPH DATA
     ---------------------------------------------------------- */

  const {
    result: wordParagraphs,
    totalWords,
  } = useMemo(
    () =>
      buildWordParagraphs(PARAGRAPHS),
    []
  );


  /* ==========================================================
     REDUCED MOTION
     ========================================================== */

  useEffect(() => {
    const mq =
      window.matchMedia(
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


    const ro =
      new ResizeObserver(measure);

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


        /* ----------------------------------------------------
           BEFORE PINNING
           ---------------------------------------------------- */

        if (
          rect.top >
          NAVBAR_HEIGHT_PX
        ) {
          nextState = "before";
          next = 0;
        }


        /* ----------------------------------------------------
           AFTER PINNING
           ---------------------------------------------------- */

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


        /* ----------------------------------------------------
           PINNED
           ---------------------------------------------------- */

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


        setPinState(
          (prev) =>
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

  const p =
    reduceMotion
      ? 1
      : progress;


  /* ==========================================================
     LARA WORDMARK SLIDE
     ========================================================== */

  const wordmarkSlide =
    computeSlide(
      p,
      STAGE.wordmark.start,
      STAGE.wordmark.end,
      SLIDE_PHASES
    );


  /* ==========================================================
     PARAGRAPH SLIDE
     ========================================================== */

  const paragraphSlide =
    computeSlide(
      p,
      STAGE.paragraph.start,
      STAGE.paragraph.end,
      {
        enterFrac: 0.62,
        holdFrac: 0.25,
        exitFrac: 0.13,
        travel: 35,
      }
    );


  /* ==========================================================
     TESTIMONIAL SLIDE
     ========================================================== */

  const testimonialsSlide =
    computeSlide(
      p,
      STAGE.testimonials.start,
      STAGE.testimonials.end,
      {
        enterFrac: 0.28,
        holdFrac: 0.58,
        exitFrac: 0.14,
        travel: 30,
      }
    );


  /* ==========================================================
     WORDMARK FADE / SCALE
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


  /*
    Lara starts larger and settles to normal size.
  */

  const wordmarkScale =
    reduceMotion
      ? 1
      : 1.5 -
        0.5 *
          wordmarkFadeT;


  /* ==========================================================
     PHOTO SEQUENCE CONTROLLER
     ==========================================================

     This is the important part.

     We DO NOT create all three animations at once.

     The sequence works like this:

       scroll reaches first point
          ↓
       back photo appears
          ↓
       back animation completes
          ↓
       scroll reaches second point
          ↓
       middle photo appears
          ↓
       middle animation completes
          ↓
       scroll reaches third point
          ↓
       front photo appears

     Even if the user scrolls very quickly, React will not
     activate all three at once.
     ========================================================== */

  useEffect(() => {
    if (reduceMotion) {
      setPhotoStep(2);
      setPhotoCompletedStep(2);
      setPhotoSequenceDone(true);
      return;
    }


    /*
      When the user goes back above the Lara section,
      reset the sequence so it can play again.
    */

    if (
      wordmarkSlide.enterT <= 0.01
    ) {
      setPhotoStep(-1);
      setPhotoCompletedStep(-1);
      setPhotoSequenceDone(false);
      return;
    }


    /*
      Start the first image.
    */

    if (
      photoStep === -1 &&
      wordmarkSlide.enterT >=
        PHOTO_TRIGGER_POINTS[0]
    ) {
      setPhotoStep(0);
      return;
    }


    /*
      Start the NEXT image only if:

      1. The current image has finished.
      2. The user has scrolled far enough to reach the next
         trigger point.
    */

    if (
      photoStep >= 0 &&
      photoStep < 2 &&
      photoCompletedStep >= photoStep &&
      wordmarkSlide.enterT >=
        PHOTO_TRIGGER_POINTS[
          photoStep + 1
        ]
    ) {
      setPhotoStep(
        photoStep + 1
      );

      return;
    }


    /*
      Once the third image has finished, the Lara sequence
      is officially complete.
    */

    if (
      photoStep === 2 &&
      photoCompletedStep === 2
    ) {
      setPhotoSequenceDone(true);
    }
  }, [
    wordmarkSlide.enterT,
    photoStep,
    photoCompletedStep,
    reduceMotion,
  ]);


  /* ==========================================================
     PHOTO ANIMATION COMPLETE
     ========================================================== */

  function handlePhotoAnimationComplete(
    completedIndex
  ) {
    setPhotoCompletedStep(
      completedIndex
    );

    /*
      The third photograph marks the end of the Lara
      photograph sequence.
    */

    if (completedIndex === 2) {
      setPhotoSequenceDone(true);
    }
  }


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
     BASE LAYER STYLE
     ============================================================ */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,

    /*
      Keep the transition subtle. The actual scroll-driven
      animations are handled separately.
    */
    transition:
      "opacity 0.55s ease, transform 0.55s ease",
  };


  /* ============================================================
     CURRENT PHOTO
     ============================================================ */

  const activePhoto =
    photoStep >= 0
      ? SCATTER_PHOTOS[
          photoStep
        ]
      : null;


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


          {/* ======================================================
              STAGE A — LARA WORDMARK + PHOTOS
              ====================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              /*
                Keep Lara visible while the three photographs
                are still completing their sequence.

                This prevents the paragraph from covering the
                Lara section before it has finished.
              */
              opacity:
                reduceMotion ||
                !photoSequenceDone
                  ? 1
                  : wordmarkSlide.opacity,

              transform:
                reduceMotion
                  ? "none"
                  : `translateY(${wordmarkSlide.translateY}px)`,

              pointerEvents:
                wordmarkSlide.opacity >
                0.5
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
                  LARA DECORATIVE ARTWORK

                  No glow behind the Lara wordmark.
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
                  transform: `scale(${wordmarkScale})`,
                  transformOrigin:
                    "50% 50%",
                }}
              />


              {/* ==================================================
                  PHOTO STACK

                  The stack itself is centered directly over
                  the Lara wordmark.

                  This is the important fix for the photos
                  drifting toward the top.
                  ================================================== */}

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
                  width: "100%",
                  height: "100%",
                  transform:
                    "translate(-50%, -50%)",
                }}
              >

                {activePhoto && (
                  <motion.img
                    key={activePhoto.id}
                    src={activePhoto.src}
                    alt={activePhoto.alt}

                    initial={{
                      opacity: 1,
                      scale:
                        PHOTO_ENTER_START_SCALE,

                      /*
                        Start position:
                        below / left / right depending on
                        the photograph.
                      */

                      x:
                        activePhoto.enterDirection ===
                        "left"
                          ? -PHOTO_ENTER_SIDE_DISTANCE_X
                          : activePhoto.enterDirection ===
                            "right"
                          ? PHOTO_ENTER_SIDE_DISTANCE_X
                          : activePhoto.finalX,

                      y:
                        activePhoto.enterDirection ===
                        "bottom"
                          ? PHOTO_ENTER_SIDE_DISTANCE_Y
                          : activePhoto.finalY,

                      /*
                        Start rotation is slightly exaggerated,
                        then settles into the exact Figma angle.
                      */

                      rotate:
                        -activePhoto.figmaAngle +
                        (
                          activePhoto.enterDirection ===
                          "left"
                            ? -10
                            : activePhoto.enterDirection ===
                              "right"
                            ? 10
                            : 8
                        ),
                    }}

                    animate={{
                      opacity: 1,

                      /*
                        This is the main requested animation:
                        BIG → NORMAL.
                      */

                      scale: 1,

                      /*
                        All final positions are relative to the
                        center of the Lara wordmark.
                      */

                      x: activePhoto.finalX,

                      y: activePhoto.finalY,

                      /*
                        Exact Figma angle conversion:
                        Figma +8.21 → CSS -8.21
                        Figma  0    → CSS  0
                        Figma -19.63 → CSS +19.63
                      */

                      rotate:
                        -activePhoto.figmaAngle,
                    }}

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

                    onAnimationComplete={() =>
                      handlePhotoAnimationComplete(
                        photoStep
                      )
                    }

                    style={{
                      position: "absolute",

                      /*
                        Center every image first.
                      */

                      left: "50%",
                      top: "50%",

                      width:
                        `${(activePhoto.width / 1920) * 100}%`,

                      height: "auto",

                      aspectRatio:
                        PHOTO_ASPECT_RATIO,

                      /*
                        Center the actual image itself.
                      */

                      marginLeft:
                        `${-(activePhoto.width / 2)}px`,

                      marginTop:
                        `${-(activePhoto.height / 2)}px`,

                      zIndex:
                        activePhoto.zIndex,

                      /*
                        Absolutely NO white border.
                      */

                      border: "none",
                      outline: "none",
                      borderRadius: 0,
                      boxShadow: "none",

                      /*
                        Do not crop the exported Figma
                        photograph.
                      */

                      objectFit: "contain",

                      transformOrigin:
                        "50% 50%",

                      backfaceVisibility:
                        "hidden",

                      willChange:
                        "transform",
                    }}

                    className="
                      block
                      select-none
                      pointer-events-none
                    "
                  />
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

              /*
                Paragraph cannot appear until Lara and all
                three photos have finished.
              */

              opacity:
                reduceMotion
                  ? 0
                  : photoSequenceDone
                  ? paragraphSlide.opacity
                  : 0,

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

            {/* ==================================================
                IMPORTANT:
                Small/Figma-like paragraph sizing.
                ================================================== */}

            <div
              className="
                mx-auto
                max-w-[760px]
                space-y-5
                text-center
                text-lg
                leading-[1.65]
                text-[var(--ink)]
                md:text-xl
                md:leading-[1.65]
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
                              opacity:
                                wordT,

                              /*
                                Slow individual word
                                transition.
                              */

                              transition:
                                "opacity 0.35s ease",
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

            {/* ==================================================
                COMPACT 3 × 3 REVIEW GRID

                Smaller cards so all 9 fit comfortably on the
                1920px Figma-style layout.
                ================================================== */}

            <div
              className="
                grid
                w-full
                max-w-[1050px]
                grid-cols-1
                gap-4
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

                    initial={{
                      opacity: 0,
                      y: 20,
                    }}

                    animate={{
                      opacity:
                        testimonialsSlide.opacity,
                      y:
                        testimonialsSlide.opacity >
                        0.5
                          ? 0
                          : 20,
                    }}

                    transition={{
                      duration: 1.4,
                      delay:
                        (index % 3) *
                        0.35,
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
                      p-4
                      text-center
                      md:p-5
                      ${
                        index % 3 ===
                        1
                          ? "md:-translate-y-3"
                          : ""
                      }
                    `}
                  >

                    <p
                      className="
                        mb-3
                        text-sm
                        leading-[1.55]
                        text-[var(--ink)]
                        md:text-[15px]
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

                )
              )}

            </div>

          </div>


        </div>
      </div>
    </section>
  );
}