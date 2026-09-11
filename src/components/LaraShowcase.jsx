import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE — FINAL ANIMATION PASS

   WORDMARK
   - Keeps the existing Lara animation.
   - Lara remains centered.
   - Decor remains behind the wordmark.

   PHOTOS
   - Exactly 3 photos.
   - Back enters first from the bottom.
   - Middle enters second from the left.
   - Front enters third from the right.
   - Photos are visible while entering.
   - They start VERY large and shrink into their final Figma size.
   - Each photo has its own scroll section so they do not appear
     simultaneously.
   - Final position stays centered over the Lara wordmark.

   PARAGRAPH
   - Smaller, closer to Figma.
   - Slow word-by-word reveal.
   - Longer hold before it leaves.

   REVIEWS
   - 9 reviews.
   - Smaller cards.
   - 3 × 3 layout.
   - Slow fade/reveal.
   - Longer hold so every review can be seen.
   - Finishes before the section gives way to the footer.
   ============================================================ */


/* ============================================================
   GLOBAL / SCROLL TIMING
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  More height = more physical scrolling distance.

  The previous setup was too compressed, causing the photo
  animations and paragraph/reviews to feel rushed.
*/
const TRACK_VH = 760;


/* ============================================================
   STAGE TIMING
   ============================================================ */

const STAGE = {
  /*
    Lara gets the largest portion of the scroll sequence.
    The three photos are spread across this period.
  */
  wordmark: {
    start: 0.0,
    end: 0.46,
  },

  /*
    Paragraph starts only after Lara has completely finished.
  */
  paragraph: {
    start: 0.53,
    end: 0.72,
  },

  /*
    Reviews wait until the paragraph is finished.
  */
  testimonials: {
    start: 0.79,
    end: 1.0,
  },
};


/* ============================================================
   GENERAL SLIDE SETTINGS
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.38,
  holdFrac: 0.42,
  exitFrac: 0.20,
  travel: 45,
};


/* ============================================================
   PHOTO ANIMATION
   ============================================================ */

/*
  IMPORTANT:

  These are deliberately large.

  The photos are NOT faded in from invisible.

  You should actually see the oversized photo enter the screen,
  then watch it shrink into its Figma-sized destination.
*/
const PHOTO_ENTER_START_SCALE = 2.45;


/*
  How far outside the screen the photos begin.

  Bottom:
    positive Y = below the destination.

  Left:
    negative X = left of destination.

  Right:
    positive X = right of destination.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 850;


/*
  This controls how much extra rotation exists while the photo
  is coming in.

  It settles into the exact Figma angle.
*/
const PHOTO_ENTER_SPIN_OFFSET = 16;


/*
  Each photo receives its own section of the Lara timeline.

  BACK   → first
  MIDDLE → second
  FRONT  → third
*/
const PHOTO_TIMELINE = {
  back: {
    start: 0.02,
    end: 0.17,
  },

  middle: {
    start: 0.18,
    end: 0.33,
  },

  front: {
    start: 0.34,
    end: 0.46,
  },
};


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


/*
  Generic stage animation.

  Returns:
    opacity
    translateY
    enterT
*/
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


/*
  Photo animation.

  The important difference here is that the photo's opacity
  stays at 1.

  Therefore:

      HUGE PHOTO
           ↓
      slides in
           ↓
      shrinks
           ↓
      settles into exact position

  The user can actually SEE the size transition.
*/
function computePhotoAnimation(progress, photo) {
  const timeline = PHOTO_TIMELINE[photo.id];

  const local = clamp01(
    (progress - timeline.start) /
      (timeline.end - timeline.start)
  );

  /*
    Before this photo's turn:
    keep it outside the composition.

    It remains visible, rather than opacity: 0, so the entrance
    can actually be seen when the scroll reaches it.
  */
  if (local <= 0) {
    return {
      opacity: 1,
      scale: PHOTO_ENTER_START_SCALE,
      x: photo.startX,
      y: photo.startY,
      rotate: photo.startRotation,
    };
  }

  /*
    Once the photo reaches the end of its own timeline, it stays
    exactly at the Figma destination.
  */
  if (local >= 1) {
    return {
      opacity: 1,
      scale: 1,
      x: photo.finalX,
      y: photo.finalY,
      rotate: photo.cssFinalRotation,
    };
  }

  /*
    Smooth, slower entrance.
  */
  const t = easeInOutCubic(local);

  return {
    opacity: 1,
    scale:
      PHOTO_ENTER_START_SCALE -
      (PHOTO_ENTER_START_SCALE - 1) * t,

    x:
      photo.startX +
      (photo.finalX - photo.startX) * t,

    y:
      photo.startY +
      (photo.finalY - photo.startY) * t,

    rotate:
      photo.startRotation +
      (photo.cssFinalRotation - photo.startRotation) * t,
  };
}


function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
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
  Build a single continuous word list so the paragraph doesn't
  suddenly reveal each paragraph independently.
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
   REVIEWS — 9 TOTAL
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
      "The quality feels so intentional. You can see the care in every part of the piece.",
    name: "Amara Nwosu",
  },

  {
    quote:
      "My custom piece turned out even better than I imagined. The fit and finishing were beautiful.",
    name: "Damilola A.",
  },

  {
    quote:
      "Lara's Crochet feels completely different from buying something mass-produced. It feels personal.",
    name: "Zainab Bello",
  },
];


/* ============================================================
   WORDMARK PHOTO POSITIONS
   ============================================================ */

const PHOTO_ASPECT_RATIO =
  "175.59957556823136 / 103.72862812295645";


/*
  These are the exact Figma dimensions.

  Figma frame:
    1920 × 1176
*/


const SCATTER_PHOTOS = [
  /* ----------------------------------------------------------
     BACK — FIRST
     Enters from BELOW
     Figma: -19.63°
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
      Bottom entrance.
    */
    startX: -5,
    startY: PHOTO_ENTER_SIDE_DISTANCE,

    enterSide: "bottom",
  },


  /* ----------------------------------------------------------
     MIDDLE — SECOND
     Enters from LEFT
     Figma: 0°
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
      Left entrance.
    */
    startX: -PHOTO_ENTER_SIDE_DISTANCE,
    startY: 0,

    enterSide: "left",
  },


  /* ----------------------------------------------------------
     FRONT — THIRD
     Enters from RIGHT
     Figma: +8.21°
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
      Right entrance.
    */
    startX: PHOTO_ENTER_SIDE_DISTANCE,
    startY: 0,

    enterSide: "right",
  },
];


/* ============================================================
   RESPONSIVE PHOTO SIZE
   ============================================================ */

const PHOTO_BOX_WIDTH =
  "clamp(150px, 9.15vw, 175.6px)";


/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;


/*
  Keep this centered like the Figma composition.
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
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] = useState(false);


  /* ----------------------------------------------------------
     Word data
     ---------------------------------------------------------- */

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
      mq.removeEventListener?.("change", onChange);
  }, []);


  /* ==========================================================
     SCROLL MEASUREMENT
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

        /* ----------------------------------------------------
           Before pinned area
           ---------------------------------------------------- */

        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          next = 0;
        }

        /* ----------------------------------------------------
           Finished pinned area
           ---------------------------------------------------- */

        else if (
          rect.bottom <=
          NAVBAR_HEIGHT_PX + contentHeight
        ) {
          nextState = "after";
          next = 1;

          afterTopRef.current =
            Math.max(
              0,
              rect.height - contentHeight
            );
        }

        /* ----------------------------------------------------
           Currently pinned
           ---------------------------------------------------- */

        else {
          nextState = "pinned";

          next =
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

        setProgress(next);
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


  /* ==========================================================
     CURRENT PROGRESS
     ========================================================== */

  const p =
    reduceMotion
      ? 1
      : progress;


  /* ==========================================================
     STAGE ANIMATIONS
     ========================================================== */

  const wordmarkSlide = computeSlide(
    p,
    STAGE.wordmark.start,
    STAGE.wordmark.end,
    SLIDE_PHASES
  );

  const paragraphSlide = computeSlide(
    p,
    STAGE.paragraph.start,
    STAGE.paragraph.end,
    SLIDE_PHASES
  );

  const testimonialsSlide = computeSlide(
    p,
    STAGE.testimonials.start,
    STAGE.testimonials.end,
    SLIDE_PHASES
  );


  /* ==========================================================
     WORDMARK FADE / SCALE
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
    Keep the Lara animation that was already working.
  */

  const wordmarkScale = reduceMotion
    ? 1
    : 1.5 -
      0.5 * wordmarkFadeT;


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
     BASE LAYER
     ========================================================== */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
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
              STAGE A
              LARA + THREE PHOTOS
              ================================================== */}

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

            {/* ----------------------------------------------
                LARA CONTAINER

                This remains centered.

                max-width gives the Lara wordmark the same
                general scale it already had.
                ---------------------------------------------- */}

            <div
              className="relative mx-auto w-full max-w-[1080px]"
              style={{
                opacity: wordmarkFadeT,
              }}
            >

              {/* --------------------------------------------
                  DECOR BACKGROUND

                  This was accidentally disappearing in one
                  of the previous versions.

                  It is back here.
                  -------------------------------------------- */}

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


              {/* --------------------------------------------
                  LARA WORDMARK
                  -------------------------------------------- */}

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

                  IMPORTANT:
                  The whole photo stage is centered on the Lara
                  composition.

                  We DON'T use the old percentage left/top system
                  here because that was causing the photos to drift
                  away from the center on different widths.
                  ================================================== */}

              <div
                className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-0
                  z-20
                  overflow-visible
                "
                style={{
                  width: PHOTO_BOX_WIDTH,
                  aspectRatio:
                    PHOTO_ASPECT_RATIO,

                  /*
                    The photo group is centered horizontally.
                  */
                  transform:
                    "translateX(-50%)",

                  /*
                    The Figma photo stack sits around the upper
                    center of the Lara wordmark.
                  */
                  marginTop:
                    "clamp(74px, 9.76vw, 115px)",
                }}
              >

                {SCATTER_PHOTOS.map(
                  (photo) => {

                    const animation =
                      reduceMotion
                        ? {
                            opacity: 1,
                            scale: 1,
                            x: photo.finalX,
                            y: photo.finalY,
                            rotate:
                              -photo.figmaAngle,
                          }
                        : computePhotoAnimation(
                            p,
                            {
                              ...photo,

                              /*
                                Final position is based on the
                                actual Figma center.

                                We keep the entire stack centered
                                over Lara rather than using the
                                absolute 866px page coordinate.
                              */

                              finalX:
                                ((photo.left +
                                  photo.width / 2) -
                                  960),

                              finalY:
                                0,

                              cssFinalRotation:
                                -photo.figmaAngle,

                              startRotation:
                                -photo.figmaAngle +
                                (
                                  photo.enterSide ===
                                  "bottom"
                                    ? PHOTO_ENTER_SPIN_OFFSET
                                    : photo.enterSide ===
                                      "left"
                                    ? -PHOTO_ENTER_SPIN_OFFSET
                                    : PHOTO_ENTER_SPIN_OFFSET
                                ),
                            }
                          );


                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}
                        initial={false}
                        animate={animation}

                        transition={{
                          duration: 0.12,
                          ease: "linear",
                        }}

                        style={{
                          position:
                            "absolute",

                          left: "50%",
                          top: 0,

                          width:
                            "100%",

                          height:
                            "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          /*
                            This is the exact Figma size
                            relationship.

                            No white border.
                            No ring.
                            No rounded corners.
                            No shadow.
                          */

                          border: "none",
                          outline: "none",
                          borderRadius: 0,
                          boxShadow: "none",

                          objectFit:
                            "cover",

                          transformOrigin:
                            "50% 50%",

                          zIndex:
                            photo.zIndex,

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
              STAGE B
              PARAGRAPH
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
                paragraphSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="
                mx-auto
                max-w-[620px]
                space-y-5
                text-center
                text-base
                leading-[1.7]
                text-[var(--ink)]
                md:text-xl
                md:leading-[1.65]
              "
            >

              {wordParagraphs.map(
                (words, pIndex) => (

                  <p key={pIndex}>

                    {words.map(
                      ({ word, index }) => {

                        /*
                          Slow reveal.

                          The previous version used the whole
                          paragraph range too aggressively.
                          This gives the words more breathing room.
                        */

                        const wordProgress =
                          reduceMotion
                            ? 1
                            : clamp01(
                                (
                                  paragraphSlide.enterT -
                                  (
                                    index /
                                    totalWords
                                  ) *
                                    0.78
                                ) /
                                  0.22
                              );

                        const wordT =
                          easeOutCubic(
                            wordProgress
                          );

                        return (
                          <span
                            key={index}
                            style={{
                              opacity: wordT,
                              display:
                                "inline",
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
              STAGE C
              REVIEWS
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
                testimonialsSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >

            <div
              className="
                grid
                w-full
                max-w-[900px]
                grid-cols-1
                gap-x-5
                gap-y-5
                sm:grid-cols-2
                md:grid-cols-3
              "
            >

              {TESTIMONIALS.map(
                (testimonial, index) => {

                  /*
                    Slow stagger.

                    Each card has a slightly different delay,
                    but all nine remain visible long enough
                    to actually read.
                  */

                  const reviewProgress =
                    clamp01(
                      (
                        testimonialsSlide.enterT -
                        index * 0.025
                      ) /
                        0.35
                    );

                  const reviewOpacity =
                    reduceMotion
                      ? 1
                      : easeOutCubic(
                          reviewProgress
                        );

                  const reviewY =
                    reduceMotion
                      ? 0
                      : (1 -
                          reviewOpacity) *
                        22;

                  return (
                    <motion.div
                      key={testimonial.name}
                      initial={false}
                      animate={{
                        opacity:
                          reviewOpacity,
                        y: reviewY,
                      }}
                      transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}

                      className={`
                        h-full
                        min-h-[145px]
                        border
                        border-[var(--line)]
                        bg-[var(--cream)]
                        p-4
                        text-center
                        md:p-5
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