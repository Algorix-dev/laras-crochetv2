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

   FIRST PASS:
   - Lara section pins to the screen
   - 3 photos enter one at a time
   - each photo starts VERY BIG
   - each photo comes from a different direction
   - each photo slowly shrinks into its final position
   - photo 1 finishes completely before photo 2 begins
   - photo 2 finishes completely before photo 3 begins
   - paragraph appears afterwards
   - reviews appear last
   - everything has generous scroll time

   AFTER FIRST COMPLETE PASS:
   - animation permanently finishes for this page visit
   - section returns to normal document flow
   - scrolling back up does NOT restart it
   - refreshing the page starts the animation again

   ============================================================ */


/* ============================================================
   GENERAL SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Large scroll track gives the Lara animation plenty of room.

  This is intentionally long because the photos are now sequential:
  Photo 1 → finish → Photo 2 → finish → Photo 3 → finish →
  paragraph → reviews → finish.
*/
const TRACK_VH = 700;


/* ============================================================
   ANIMATION STAGES
   ============================================================ */

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.46,
  },

  paragraph: {
    start: 0.52,
    end: 0.76,
  },

  testimonials: {
    start: 0.82,
    end: 1.0,
  },
};


/* ============================================================
   GENERAL STAGE MOTION
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.55,
  holdFrac: 0.25,
  exitFrac: 0.20,
  travel: 50,
};


/* ============================================================
   PHOTO ENTRANCE
   ============================================================ */

/*
  IMPORTANT:

  The photos do NOT fade in anymore.

  This allows the user to clearly SEE the large image while it
  is travelling toward Lara.

  The sequence is controlled separately below, so only ONE photo
  is visible at a time.
*/

const PHOTO_ENTER_DURATION_S = 3.8;

/*
  Very large starting size.

  The image begins clearly oversized, then slowly settles down
  to its exact normal size.
*/
const PHOTO_ENTER_START_SCALE = 2.45;


/*
  How far outside the visible area the photo begins.

  Large enough that the user sees it travelling in from the
  actual edge rather than appearing beside Lara.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 850;


/*
  Additional rotation while entering.

  This disappears as the photo reaches its final Figma angle.
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
      "Every detail felt intentional. You can really see the care that went into making the piece.",
    name: "Amaka O.",
  },

  {
    quote:
      "The fit was beautiful and the finishing was even better in person.",
    name: "Nora E.",
  },

  {
    quote:
      "I loved being able to choose the colour and get something made specifically for me.",
    name: "Zainab A.",
  },
];


/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================

   Original Figma measurements:

   FRONT
   width: 175.59957556823136
   height: 103.72862812295645
   angle: +8.21°
   left: 866.92
   top: 114.87

   MIDDLE
   width: 175.59957885742188
   height: 103.72863006591797
   angle: 0°
   left: 860.18
   top: 119.27

   BACK
   width: 175.59958036211256
   height: 103.72863095475553
   angle: -19.63°
   left: 866.81
   top: 92.77


   Figma's positive angle = anti-clockwise.
   CSS positive rotate = clockwise.

   Therefore:

   +8.21 Figma → -8.21 CSS
   0 Figma → 0 CSS
   -19.63 Figma → +19.63 CSS
   ============================================================ */


/*
  The three photos share ONE anchor point.

  This is important.

  Previously the photos were being positioned using viewport
  percentages, which caused them to drift away from Lara.

  Now they are positioned relative to the CENTER of the Lara
  wordmark, then given small offsets based on the Figma stack.
*/
const SCATTER_PHOTOS = [
  {
    id: "back",
    src: scatterStreet,
    alt: "Street-style portrait",

    width: 175.59958036211256,
    height: 103.72863095475553,

    figmaAngle: -19.63,

    /*
      Comes from below.
    */
    enterDirection: "bottom",

    /*
      First photo.
    */
    sequence: 0,

    zIndex: 1,

    /*
      Final position relative to Lara's center.
      The back image sits slightly higher.
    */
    finalX: 0,
    finalY: -25,
  },

  {
    id: "middle",
    src: scatterBeach,
    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    width: 175.59957885742188,
    height: 103.72863006591797,

    figmaAngle: 0,

    /*
      Comes from the left.
    */
    enterDirection: "left",

    /*
      Second photo.
    */
    sequence: 1,

    zIndex: 2,

    finalX: -7,
    finalY: 0,
  },

  {
    id: "front",
    src: scatterTeal,
    alt:
      "Lara's Crochet customer wearing a teal crochet dress",

    width: 175.59957556823136,
    height: 103.72862812295645,

    figmaAngle: 8.21,

    /*
      Comes from the right.
    */
    enterDirection: "right",

    /*
      Third photo.
    */
    sequence: 2,

    zIndex: 3,

    finalX: 0,
    finalY: 4,
  },
];


/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.18;


/*
  Container width.

  Kept large enough for the Lara wordmark while still behaving
  well on different screens.
*/
const WORDMARK_CONTAINER_WIDTH =
  "clamp(760px, 56vw, 1080px)";


/*
  The photos themselves remain around the Figma 175.6px size
  when settled.
*/
const PHOTO_WIDTH_PX = 175.6;


/* ============================================================
   PAGE PADDING
   ============================================================ */

const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";


/* ============================================================
   ONE-TIME PAGE VISIT STATE
   ============================================================

   DO NOT use sessionStorage here.

   We specifically want:

   - scroll through once → animation is finished
   - scroll back → normal flow
   - navigate around the site in the same tab → remains finished
   - refresh → animation starts again

   A module-level variable gives us exactly that behaviour.
   A full browser refresh loads this module again and resets it.
*/

let showcaseCompletedThisPageVisit = false;


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
    The animated progress.
  */
  const [progress, setProgress] = useState(
    showcaseCompletedThisPageVisit ? 1 : 0
  );

  /*
    Current pin state.
  */
  const [pinState, setPinState] = useState(
    showcaseCompletedThisPageVisit
      ? "completed"
      : "before"
  );

  /*
    Once true, the component becomes normal flow.
  */
  const [hasCompleted, setHasCompleted] = useState(
    showcaseCompletedThisPageVisit
  );

  /*
    Reduced motion accessibility.
  */
  const [reduceMotion, setReduceMotion] = useState(false);

  /*
    Which photo is currently entering.

    -1 = none
     0 = back
     1 = middle
     2 = front
  */
  const [activePhotoIndex, setActivePhotoIndex] = useState(
    showcaseCompletedThisPageVisit ? 2 : -1
  );

  /*
    Which photos have completely finished.
  */
  const [finishedPhotos, setFinishedPhotos] = useState(
    showcaseCompletedThisPageVisit
      ? {
          back: true,
          middle: true,
          front: true,
        }
      : {}
  );


  /* ============================================================
     WORDS
     ============================================================ */

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

    const onChange = (event) => {
      setReduceMotion(event.matches);
    };

    mq.addEventListener?.("change", onChange);

    return () => {
      mq.removeEventListener?.("change", onChange);
    };
  }, []);


  /* ============================================================
     MEASURE + SCROLL TRACK
     ============================================================ */

  useEffect(() => {
    /*
      Once completed, STOP the animation system completely.

      This is what turns the component into normal flow.
    */
    if (hasCompleted || reduceMotion) {
      return;
    }

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


        /*
          BEFORE ENTERING THE SECTION
        */
        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          next = 0;
        }


        /*
          REACHED THE END OF THE ANIMATED TRACK
        */
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


        /*
          CURRENTLY PINNED
        */
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


        setPinState((previous) =>
          previous === nextState
            ? previous
            : nextState
        );

        setProgress(next);


        /*
          IMPORTANT:

          Only mark the showcase complete once the user has
          actually reached the END of the complete animation.

          This prevents the component from switching to normal
          flow halfway through the sequence.
        */
        if (next >= 0.999) {
          showcaseCompletedThisPageVisit = true;

          setHasCompleted(true);

          setActivePhotoIndex(2);

          setFinishedPhotos({
            back: true,
            middle: true,
            front: true,
          });
        }
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
  }, [hasCompleted, reduceMotion]);


  /* ============================================================
     PROGRESS
     ============================================================ */

  const p =
    reduceMotion || hasCompleted
      ? 1
      : progress;


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


  /* ============================================================
     WORDMARK SCALE
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
    Lara starts slightly larger and settles into normal size.
  */
  const wordmarkScale = reduceMotion
    ? 1
    : 1.5 -
      0.5 * wordmarkFadeT;


  /* ============================================================
     PHOTO SEQUENCE
     ============================================================ */

  useEffect(() => {
    if (reduceMotion || hasCompleted) {
      return;
    }


    /*
      We deliberately divide the Lara stage into THREE
      sequential zones.

      There is NO overlapping entrance.

      Photo 1:
        0 → 1

      Photo 2:
        1 → 2

      Photo 3:
        2 → 3

      Each gets its own full animation duration.
    */

    const photoProgress =
      clamp01(
        (wordmarkSlide.enterT - 0.08) /
          0.82
      );


    /*
      FIRST PHOTO
    */

    if (photoProgress < 0.285) {
      if (activePhotoIndex !== 0) {
        setActivePhotoIndex(0);
      }

      return;
    }


    /*
      SECOND PHOTO
    */

    if (photoProgress < 0.60) {
      if (activePhotoIndex !== 1) {
        setFinishedPhotos((previous) => ({
          ...previous,
          back: true,
        }));

        setActivePhotoIndex(1);
      }

      return;
    }


    /*
      THIRD PHOTO
    */

    if (photoProgress < 0.91) {
      if (activePhotoIndex !== 2) {
        setFinishedPhotos((previous) => ({
          ...previous,
          middle: true,
        }));

        setActivePhotoIndex(2);
      }

      return;
    }


    /*
      Third photo has finished.
    */

    setFinishedPhotos({
      back: true,
      middle: true,
      front: true,
    });

  }, [
    wordmarkSlide.enterT,
    activePhotoIndex,
    reduceMotion,
    hasCompleted,
  ]);


  /* ============================================================
     COMPLETION EFFECT
     ============================================================ */

  useEffect(() => {
    /*
      If the component has reached the end, immediately make
      sure every photo is considered finished.
    */
    if (
      hasCompleted ||
      reduceMotion
    ) {
      setFinishedPhotos({
        back: true,
        middle: true,
        front: true,
      });

      setActivePhotoIndex(2);
    }
  }, [hasCompleted, reduceMotion]);


  /* ============================================================
     NORMAL FLOW MODE
     ============================================================ */

  /*
    Once the animation has completed, we don't want any fixed
    positioning, absolute layers, or scroll calculations.

    Everything simply becomes a normal webpage again.
  */

  if (hasCompleted) {
    return (
      <section
        className="w-full bg-[var(--cream)]"
      >
        <div
          className={`w-full ${PAGE_CONTAINER_PADDING}`}
        >
          <div className="mx-auto w-full max-w-[1080px]">

            {/* ==================================================
                NORMAL LARA WORDMARK
                ================================================== */}

            <div className="relative flex min-h-screen items-center justify-center py-16">
              <div
                className="relative w-full"
                style={{
                  maxWidth:
                    WORDMARK_CONTAINER_WIDTH,
                }}
              >

                <img
                  src={laraDecor}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{
                    width: "100vw",
                  }}
                />

                <img
                  src={laraWordmark}
                  alt="Lara's Crochet"
                  className="relative z-10 block h-auto w-full select-none"
                />


                {/* ==============================================
                    FINISHED PHOTO STACK
                    ============================================== */}

                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20"
                  style={{
                    width: `${PHOTO_WIDTH_PX}px`,
                    height:
                      "103.72863006591797px",
                    transform:
                      "translate(-50%, -50%)",
                  }}
                >

                  {SCATTER_PHOTOS.map(
                    (photo) => {
                      const cssRotation =
                        -photo.figmaAngle;

                      return (
                        <img
                          key={photo.id}
                          src={photo.src}
                          alt={photo.alt}
                          className="absolute block select-none"
                          style={{
                            left: `${photo.finalX}px`,
                            top: `${photo.finalY}px`,
                            width: `${photo.width}px`,
                            height: `${photo.height}px`,

                            transform:
                              `rotate(${cssRotation}deg)`,

                            transformOrigin:
                              "50% 50%",

                            zIndex:
                              photo.zIndex,

                            border: "none",
                            borderRadius: 0,
                            boxShadow: "none",

                            objectFit: "cover",
                          }}
                        />
                      );
                    }
                  )}

                </div>
              </div>
            </div>


            {/* ==================================================
                NORMAL PARAGRAPH
                ================================================== */}

            <div className="flex min-h-screen items-center justify-center py-24">
              <div
                className="
                  mx-auto
                  max-w-2xl
                  text-center
                  text-[16px]
                  leading-[1.7]
                  text-[var(--ink)]
                  md:max-w-3xl
                "
              >

                {PARAGRAPHS.map(
                  (paragraph, index) => (
                    <p
                      key={index}
                      className={
                        index ===
                        PARAGRAPHS.length - 1
                          ? "mt-8"
                          : "mb-6"
                      }
                    >
                      {paragraph}
                    </p>
                  )
                )}

              </div>
            </div>


            {/* ==================================================
                NORMAL REVIEWS
                ================================================== */}

            <div className="pb-32">

              <div className="mx-auto mb-16 max-w-2xl text-center">

                <h2 className="font-['Raleway'] text-[clamp(2rem,3vw,3.5rem)] font-bold tracking-[-0.05em] text-[var(--maroon-dark)]">
                  WHAT THEY SAY
                </h2>

              </div>


              <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {TESTIMONIALS.map(
                  (testimonial, index) => (
                    <div
                      key={`${testimonial.name}-${index}`}
                      className={`
                        min-h-[210px]
                        border
                        border-[var(--line)]
                        bg-[var(--cream)]
                        p-6
                        text-center
                        ${
                          index % 3 === 1
                            ? "lg:-translate-y-5"
                            : ""
                        }
                      `}
                    >

                      <p className="mb-6 text-[15px] leading-[1.65] text-[var(--ink)]">
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


  /* ============================================================
     ANIMATED MODE
     ============================================================ */

  let containerStyle;


  /*
    BEFORE section reaches navbar.
  */

  if (
    reduceMotion ||
    pinState === "before"
  ) {
    containerStyle = {
      position: "relative",
      height: "100vh",
    };
  }


  /*
    PINNED ANIMATION.
  */

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


  /*
    AFTER the animated track.
  */

  else {
    containerStyle = {
      position: "absolute",
      top: afterTopRef.current,
      left: 0,
      right: 0,
      height: "100vh",
    };
  }


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
      className="relative w-full bg-[var(--cream)]"
      style={{
        height: `${TRACK_VH}vh`,
      }}
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
              className="relative mx-auto w-full"
              style={{
                maxWidth:
                  WORDMARK_CONTAINER_WIDTH,

                opacity:
                  wordmarkFadeT,
              }}
            >


              {/* ==============================================
                  LARA DECOR
                  ============================================== */}

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
                  -translate-x-1/2
                  -translate-y-1/2
                  select-none
                "
                style={{
                  width: "100vw",
                }}
              />


              {/* ==============================================
                  LARA WORDMARK
                  ============================================== */}

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


              {/* ==============================================
                  PHOTO STACK
                  ==============================================

                  ONE PHOTO AT A TIME.

                  They are anchored to the CENTER of Lara.

                  This is the important difference from the
                  previous viewport-positioned implementation.
              */}

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
                  width: `${PHOTO_WIDTH_PX}px`,
                  height:
                    "103.72863006591797px",

                  transform:
                    "translate(-50%, -50%)",
                }}
              >

                {SCATTER_PHOTOS.map(
                  (photo, index) => {

                    const isActive =
                      activePhotoIndex ===
                      index;

                    const isFinished =
                      !!finishedPhotos[
                        photo.id
                      ];


                    /*
                      CSS rotation is the opposite of
                      Figma's rotation convention.
                    */

                    const cssFinalRotation =
                      -photo.figmaAngle;


                    /*
                      START POSITION.

                      Each photo comes from a different
                      part of the screen.
                    */

                    let startX = 0;
                    let startY = 0;


                    if (
                      photo.enterDirection ===
                      "left"
                    ) {
                      startX =
                        -PHOTO_ENTER_SIDE_DISTANCE;
                    }

                    if (
                      photo.enterDirection ===
                      "right"
                    ) {
                      startX =
                        PHOTO_ENTER_SIDE_DISTANCE;
                    }

                    if (
                      photo.enterDirection ===
                      "bottom"
                    ) {
                      startY =
                        PHOTO_ENTER_SIDE_DISTANCE;
                    }


                    /*
                      Only the active photo is visible.

                      Finished photos remain in their final
                      positions, but they do not exist visually
                      until their turn is complete.
                    */

                    const shouldShow =
                      isActive ||
                      isFinished;


                    /*
                      Finished photos are already settled.

                      Active photo gets the big → small
                      animation.
                    */

                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}
                        initial={false}

                        animate={
                          shouldShow
                            ? {
                                opacity: 1,

                                scale:
                                  isFinished &&
                                  !isActive
                                    ? 1
                                    : PHOTO_ENTER_START_SCALE,

                                x:
                                  isFinished &&
                                  !isActive
                                    ? photo.finalX
                                    : startX,

                                y:
                                  isFinished &&
                                  !isActive
                                    ? photo.finalY
                                    : startY,

                                rotate:
                                  isFinished &&
                                  !isActive
                                    ? cssFinalRotation
                                    : cssFinalRotation +
                                      (
                                        photo.enterDirection ===
                                        "left"
                                          ? -PHOTO_ENTER_SPIN_OFFSET
                                          : photo.enterDirection ===
                                            "right"
                                            ? PHOTO_ENTER_SPIN_OFFSET
                                            : PHOTO_ENTER_SPIN_OFFSET
                                      ),
                              }
                            : {
                                opacity: 0,
                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                x: startX,
                                y: startY,

                                rotate:
                                  cssFinalRotation +
                                  (
                                    photo.enterDirection ===
                                    "left"
                                      ? -PHOTO_ENTER_SPIN_OFFSET
                                      : photo.enterDirection ===
                                        "right"
                                        ? PHOTO_ENTER_SPIN_OFFSET
                                        : 0
                                  ),
                              }
                        }

                        transition={{
                          duration:
                            isActive
                              ? PHOTO_ENTER_DURATION_S
                              : 0.01,

                          ease:
                            [0.16, 1, 0.3, 1],
                        }}

                        style={{
                          position:
                            "absolute",

                          left:
                            `${photo.finalX}px`,

                          top:
                            `${photo.finalY}px`,

                          width:
                            `${photo.width}px`,

                          height:
                            `${photo.height}px`,

                          zIndex:
                            photo.zIndex,

                          transformOrigin:
                            "50% 50%",

                          border: "none",

                          borderRadius: 0,

                          boxShadow: "none",

                          objectFit: "cover",

                          display:
                            shouldShow
                              ? "block"
                              : "none",
                        }}

                        className="
                          select-none
                          block
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
                max-w-2xl
                text-center
                text-[16px]
                leading-[1.7]
                text-[var(--ink)]
                md:max-w-3xl
              "
            >

              {wordParagraphs.map(
                (words, paragraphIndex) => (

                  <p
                    key={paragraphIndex}
                    className={
                      paragraphIndex ===
                      wordParagraphs.length - 1
                        ? "mt-8"
                        : "mb-6"
                    }
                  >

                    {words.map(
                      ({
                        word,
                        index,
                      }) => {

                        /*
                          Slow word-by-word reveal.

                          16px as requested.
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

            <div className="w-full max-w-5xl">
              <div
                className="
                  grid
                  w-full
                  grid-cols-1
                  gap-5
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >

                {TESTIMONIALS.map(
                  (
                    testimonial,
                    index
                  ) => (

                    <motion.div
                      key={`${testimonial.name}-${index}`}
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}

                      animate={{
                        opacity:
                          testimonialsSlide.opacity,

                        y:
                          testimonialsSlide.opacity > 0
                            ? 0
                            : 25,
                      }}

                      transition={{
                        duration: 1.8,
                        delay:
                          index * 0.18,
                        ease:
                          [0.16, 1, 0.3, 1],
                      }}

                      className={`
                        min-h-[190px]
                        border
                        border-[var(--line)]
                        bg-[var(--cream)]
                        p-5
                        text-center
                        ${
                          index % 3 === 1
                            ? "lg:-translate-y-5"
                            : ""
                        }
                      `}
                    >

                      <p className="mb-5 text-[15px] leading-[1.65] text-[var(--ink)]">
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

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}