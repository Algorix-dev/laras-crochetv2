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

   SECTION FLOW

   1. LARA WORDMARK
      - Lara enters
      - Photos appear ONE AT A TIME
      - Each photo starts very large
      - Each photo travels in from a different direction
      - Each photo slowly shrinks into its final Figma size
      - Previous photo must finish before next photo starts

   2. HOLD
      - Lara + completed photo composition stays visible

   3. PARAGRAPH
      - Small 16px Figma-style text
      - Slow word-by-word reveal
      - Plenty of time before leaving

   4. REVIEWS
      - 9 reviews
      - Smaller than before
      - 3 × 3 grid
      - Slow fade/reveal
      - Enough time for every review to be seen

   5. FOOTER
      - Everything finishes before the next section/footer
   ============================================================ */


/* ============================================================
   BASIC SECTION SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Large scroll track gives the animations enough breathing room.

  This is intentionally long because the Lara/photo sequence
  should feel slow and premium rather than compressed.
*/
const TRACK_VH = 900;


/* ============================================================
   STAGE TIMING
   ============================================================

   These values are normalized 0 → 1 across the entire section.

   Lara/photos:
   0.00 → 0.62

   Paragraph:
   0.68 → 0.84

   Reviews:
   0.89 → 1.00

   There is deliberately a gap between stages so they don't
   visually pile on top of each other.
*/

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.62,
  },

  paragraph: {
    start: 0.68,
    end: 0.84,
  },

  testimonials: {
    start: 0.89,
    end: 1.0,
  },
};


/* ============================================================
   GENERAL SLIDE SETTINGS
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.30,
  exitFrac: 0.15,
  travel: 35,
};


/* ============================================================
   PHOTO ANIMATION
   ============================================================

   IMPORTANT:

   The photos do NOT use independent scroll-triggered animation
   anymore.

   Instead, we use a sequential timeline.

   Photo 1 finishes
        ↓
   Photo 2 starts
        ↓
   Photo 2 finishes
        ↓
   Photo 3 starts
        ↓
   Photo 3 finishes
        ↓
   Lara composition holds
*/

const PHOTO_ENTER_DURATION_S = 3.2;

/*
  Very large starting size.

  2.15 means the image begins at 215% of its final size.
*/
const PHOTO_ENTER_START_SCALE = 2.15;


/*
  How far outside the composition each photo begins.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 650;


/*
  Additional rotation while entering.

  It settles toward the exact final Figma angle.
*/
const PHOTO_ENTER_SPIN_OFFSET = 18;


/*
  Time each completed photo remains visible before the next
  photo starts.

  This is intentionally generous.
*/
const PHOTO_HOLD_AFTER_ENTRY_S = 0.75;


/* ============================================================
   PHOTO SEQUENCE TIMELINE
   ============================================================

   Each photo gets a dedicated chunk of the Lara animation.

   BACK
   → 0.00

   MIDDLE
   → after BACK is completely finished

   FRONT
   → after MIDDLE is completely finished
*/

const PHOTO_SEQUENCE = {
  back: {
    start: 0.00,
    end: 0.32,
  },

  middle: {
    start: 0.35,
    end: 0.67,
  },

  front: {
    start: 0.70,
    end: 1.00,
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
   PARAGRAPH CONTENT
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
      "The craftsmanship is beautiful and you can feel how much care went into every detail.",
    name: "Amaka O.",
  },

  {
    quote:
      "My custom piece looked even better in person. The finishing was so clean.",
    name: "Zainab A.",
  },

  {
    quote:
      "I loved being able to choose the color and fit. It felt like the piece was actually made for me.",
    name: "Nneka I.",
  },
];


/* ============================================================
   WORDMARK / PHOTO POSITIONING
   ============================================================

   Figma reference:

   Canvas:
   1920 × 1176

   FRONT:
   175.599575 × 103.728628
   left: 866.92
   top: 114.87
   angle: +8.21°

   MIDDLE:
   175.599579 × 103.728630
   left: 860.18
   top: 119.27
   angle: 0°

   BACK:
   175.599580 × 103.728631
   left: 866.81
   top: 92.77
   angle: -19.63°

   IMPORTANT:

   Figma uses:
     + = anti-clockwise
     - = clockwise

   CSS uses the opposite visual direction.

   Therefore:
     +8.21 Figma → -8.21 CSS
      0 Figma → 0 CSS
    -19.63 Figma → +19.63 CSS
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

    figmaAngle: -19.63,

    zIndex: 1,

    /*
      BACK enters from BELOW.
    */
    enterSide: "bottom",

    sequence: PHOTO_SEQUENCE.back,
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

    figmaAngle: 0,

    zIndex: 2,

    /*
      MIDDLE enters from LEFT.
    */
    enterSide: "left",

    sequence: PHOTO_SEQUENCE.middle,
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

    figmaAngle: 8.21,

    zIndex: 3,

    /*
      FRONT enters from RIGHT.
    */
    enterSide: "right",

    sequence: PHOTO_SEQUENCE.front,
  },
];


/* ============================================================
   PHOTO BOX
   ============================================================ */

const PHOTO_BOX_WIDTH =
  "clamp(100px, 9.15vw, 175.6px)";


/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.18;


/*
  Keep Lara at the same visual size.
*/
const WORDMARK_START_SCALE = 1.25;


/* ============================================================
   PAGE CONTAINER
   ============================================================ */

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


  /*
    We no longer use individual scroll-triggered booleans
    for the three photos.

    The entire photo sequence is controlled by progress.

    This guarantees only ONE photo can be entering at a time.
  */


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

    const onChange = (e) =>
      setReduceMotion(e.matches);

    mq.addEventListener?.("change", onChange);

    return () =>
      mq.removeEventListener?.(
        "change",
        onChange
      );
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


  /* ============================================================
     CURRENT PROGRESS
     ============================================================ */

  const p = reduceMotion
    ? 1
    : progress;


  /* ============================================================
     STAGE PROGRESS
     ============================================================ */

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
     WORDMARK FADE
     ============================================================ */

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
    Lara starts slightly larger and settles into normal size.
  */

  const wordmarkScale =
    reduceMotion
      ? 1
      : WORDMARK_START_SCALE -
        (WORDMARK_START_SCALE - 1) *
          wordmarkFadeT;


  /* ============================================================
     PHOTO SEQUENCE
     ============================================================

     This is the important part.

     Each photo gets its own section of the Lara timeline.

     It is impossible for the middle photo to begin while the
     back photo is still entering.

     It is also impossible for the front photo to begin while
     the middle photo is still entering.
  */

  function getPhotoAnimation(photo) {
    const {
      start,
      end,
    } = photo.sequence;


    const local =
      clamp01(
        (
          wordmarkSlide.enterT -
            start
        ) /
          (end - start)
      );


    const finalRotation =
      -photo.figmaAngle;


    let x = 0;

    let y = 0;

    let scale = 1;

    let opacity = 1;

    let rotate =
      finalRotation;


    /*
      BEFORE THIS PHOTO'S TURN
    */

    if (
      wordmarkSlide.enterT <
      start
    ) {
      opacity = 0;

      scale =
        PHOTO_ENTER_START_SCALE;


      if (
        photo.enterSide ===
        "left"
      ) {
        x =
          -PHOTO_ENTER_SIDE_DISTANCE;
      }

      if (
        photo.enterSide ===
        "right"
      ) {
        x =
          PHOTO_ENTER_SIDE_DISTANCE;
      }

      if (
        photo.enterSide ===
        "bottom"
      ) {
        y =
          PHOTO_ENTER_SIDE_DISTANCE;
      }


      rotate =
        finalRotation +
        (
          photo.enterSide ===
          "left"
            ? -PHOTO_ENTER_SPIN_OFFSET
            : photo.enterSide ===
                "right"
              ? PHOTO_ENTER_SPIN_OFFSET
              : 0
        );


      return {
        opacity,
        scale,
        x,
        y,
        rotate,
      };
    }


    /*
      AFTER THIS PHOTO HAS FINISHED
    */

    if (
      wordmarkSlide.enterT >=
      end
    ) {
      return {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotate: finalRotation,
      };
    }


    /*
      CURRENT PHOTO IS ENTERING
    */

    const eased =
      easeInOutCubic(local);


    scale =
      PHOTO_ENTER_START_SCALE -
      (
        PHOTO_ENTER_START_SCALE -
        1
      ) *
        eased;


    if (
      photo.enterSide ===
      "left"
    ) {
      x =
        -PHOTO_ENTER_SIDE_DISTANCE *
        (1 - eased);
    }


    if (
      photo.enterSide ===
      "right"
    ) {
      x =
        PHOTO_ENTER_SIDE_DISTANCE *
        (1 - eased);
    }


    if (
      photo.enterSide ===
      "bottom"
    ) {
      y =
        PHOTO_ENTER_SIDE_DISTANCE *
        (1 - eased);
    }


    /*
      The image is visible immediately.

      This is intentional because you specifically wanted
      to SEE the large image before it shrinks.
    */

    opacity = 1;


    rotate =
      finalRotation +
      (
        photo.enterSide ===
        "left"
          ? -PHOTO_ENTER_SPIN_OFFSET *
            (1 - eased)
          : photo.enterSide ===
              "right"
            ? PHOTO_ENTER_SPIN_OFFSET *
              (1 - eased)
            : 0
      );


    return {
      opacity,
      scale,
      x,
      y,
      rotate,
    };
  }


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
     SHARED LAYER STYLE
     ============================================================ */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
    transition:
      "opacity 0.7s ease, transform 0.7s ease",
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


          {/* ======================================================
              STAGE A — LARA + PHOTOS
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

              {/* ==================================================
                  LARA DECOR
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
                  PHOTO LAYER
                  ================================================== */}

              <div
                className="
                  absolute
                  inset-0
                  z-20
                  overflow-visible
                  pointer-events-none
                "
              >

                {SCATTER_PHOTOS.map(
                  (photo) => {

                    const animation =
                      getPhotoAnimation(
                        photo
                      );


                    /*
                      Exact Figma position as a percentage of
                      the 1920 × 1176 reference frame.

                      Because the photo layer itself is centered
                      over Lara, the final positions remain aligned
                      to the original composition.
                    */

                    const finalLeft =
                      `${(
                        photo.left /
                        1920
                      ) * 100}%`;


                    const finalTop =
                      `${(
                        photo.top /
                        1176
                      ) * 100}%`;


                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}
                        initial={false}

                        animate={{
                          opacity:
                            animation.opacity,

                          scale:
                            animation.scale,

                          x:
                            animation.x,

                          y:
                            animation.y,

                          rotate:
                            animation.rotate,
                        }}

                        transition={{
                          duration: 0.08,
                          ease: "linear",
                        }}

                        style={{
                          position:
                            "absolute",

                          left:
                            finalLeft,

                          top:
                            finalTop,

                          width:
                            `${(
                              photo.width /
                              1920
                            ) * 100}%`,

                          height:
                            "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            NO WHITE BORDER.
                          */
                          border:
                            "none",

                          outline:
                            "none",

                          borderRadius:
                            0,

                          boxShadow:
                            "none",

                          /*
                            Keep the scaling centered.
                          */
                          transformOrigin:
                            "50% 50%",

                          /*
                            Prevent browser interpolation from
                            making the image blurry during the
                            scale animation.
                          */
                          backfaceVisibility:
                            "hidden",

                          WebkitBackfaceVisibility:
                            "hidden",

                          willChange:
                            "transform, opacity",
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
                max-w-[680px]
                space-y-5
                text-center
                text-[16px]
                leading-[1.6]
                text-[var(--ink)]
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
                          Slow word reveal.

                          The entire paragraph gets a long,
                          calm entrance instead of rapidly
                          flashing through.
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
                                    0.8 /
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
                max-w-[980px]
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
                      y: 18,
                    }}

                    animate={{
                      opacity:
                        testimonialsSlide.opacity,
                      y:
                        testimonialsSlide.opacity >
                        0
                          ? 0
                          : 18,
                    }}

                    transition={{
                      duration: 1.4,
                      delay:
                        index * 0.25,
                      ease:
                        [0.16, 1, 0.3, 1],
                    }}

                    className={`
                      h-full
                      min-h-[150px]
                      border
                      border-[var(--line)]
                      bg-[var(--cream)]
                      p-4
                      text-center
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
                        text-[15px]
                        leading-[1.55]
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
                        text-[13px]
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
                        text-[11px]
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