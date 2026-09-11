import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA'S CROCHET — SHOWCASE SECTION
   ============================================================ */

/*
  The important rule here is:

  LARA
    ↓
  3 PHOTOS
    ↓
  PARAGRAPH
    ↓
  9 REVIEWS
    ↓
  SECTION ENDS
    ↓
  FOOTER

  Nothing from the later stages is allowed to overlap the stage
  before it.
*/

/* ============================================================
   GENERAL TIMING
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Long enough that the Lara/photo sequence doesn't fly past
  before the user can see each photo.

  This is intentionally kept generous because the photos are
  individually triggered and have their own real-time animation.
*/
const TRACK_VH = 700;

/* ============================================================
   STAGE TIMELINE
   ============================================================ */

const STAGE = {
  /*
    Lara + photos occupy the beginning of the scroll.

    The three photos enter progressively during this stage.
  */
  wordmark: {
    start: 0.0,
    end: 0.48,
  },

  /*
    Paragraph begins only after the Lara stage has finished.
  */
  paragraph: {
    start: 0.53,
    end: 0.75,
  },

  /*
    Reviews begin after the paragraph has finished.
  */
  testimonials: {
    start: 0.80,
    end: 1.0,
  },
};

/* ============================================================
   GENERAL SLIDE BEHAVIOUR
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.58,
  holdFrac: 0.22,
  exitFrac: 0.20,
  travel: 70,
};

/* ============================================================
   PHOTO ENTRANCE
   ============================================================ */

/*
  IMPORTANT:

  These values control the "BIG → NORMAL" effect.

  The photos start VERY large, come in from their respective
  sides, then settle down to their exact final size.

  Because the animation is triggered once and then runs for
  this duration, fast scrolling won't make them instantly
  appear at their final size.
*/

const PHOTO_ENTER_DURATION_S = 2.8;

const PHOTO_ENTER_START_SCALE = 2.35;

const PHOTO_ENTER_SIDE_DISTANCE = 560;

const PHOTO_ENTER_SPIN_OFFSET = 14;

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

  const local = clamp01((progress - start) / span);

  const enterEnd = enterFrac;
  const holdEnd = enterFrac + holdFrac;

  if (local <= enterEnd) {
    const enterT =
      enterFrac > 0 ? clamp01(local / enterFrac) : 1;

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

/*
  Keep the word-by-word paragraph behaviour.
*/
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
      "The craftsmanship is beautiful and the piece feels completely personal.",
    name: "Amaka Nwosu",
  },

  {
    quote:
      "I loved being able to choose the colour and fit. It felt like the piece was made specifically for me.",
    name: "Zainab Bello",
  },

  {
    quote:
      "The attention to detail is incredible. You can immediately tell how much care went into making it.",
    name: "Dami Adebayo",
  },
];

/* ============================================================
   WORDMARK PHOTO STACK
   ============================================================ */

/*
  Figma reference:

  Frame:
  1920 × 1176

  Front:
    175.59957556823136 × 103.72862812295645
    left: 866.92
    top: 114.87
    angle: +8.21°

  Middle:
    175.59957885742188 × 103.72863006591797
    left: 860.18
    top: 119.27
    angle: 0°

  Back:
    175.59958036211256 × 103.72863095475553
    left: 866.81
    top: 92.77
    angle: -19.63°
*/

/*
  The photos are now positioned relative to the CENTER of Lara,
  rather than using the 1920px page coordinates directly.

  This is important.

  Previously, using:

      left: 866 / 1920

  inside a smaller wordmark container caused the photos to
  drift toward the top/right.

  Instead, the entire stack is centered and these are only the
  tiny offsets from that center.
*/

const PHOTO_ASPECT_RATIO =
  "175.59957556823136 / 103.72862812295645";

/*
  Final display width.

  This is the normal size when the photo has finished entering.
*/
const PHOTO_WIDTH = "clamp(150px, 9.15vw, 175.6px)";

/*
  Final offsets calculated from the Figma stack.

  These are intentionally tiny because the stack itself is
  centered on Lara.
*/

const SCATTER_PHOTOS = [
  {
    id: "front",
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",

    /*
      Front image — Figma +8.21° anti-clockwise.
      CSS needs -8.21° to reproduce that visual direction.
    */
    figmaAngle: 8.21,

    /*
      Front image sits just slightly left and above the center.
    */
    finalX: -5,
    finalY: -4,

    zIndex: 3,

    /*
      First photo.
    */
    enterSide: "left",
    enterStart: 0.14,
  },

  {
    id: "middle",
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    /*
      Middle image — Figma 0°.
    */
    figmaAngle: 0,

    finalX: 0,
    finalY: 0,

    zIndex: 2,

    /*
      Second photo.
    */
    enterSide: "right",
    enterStart: 0.39,
  },

  {
    id: "back",
    src: scatterStreet,
    alt: "Street-style portrait",

    /*
      Back image — Figma -19.63° clockwise.
      CSS becomes +19.63°.
    */
    figmaAngle: -19.63,

    /*
      Back image is above the middle image.
    */
    finalX: -5,
    finalY: -26,

    zIndex: 1,

    /*
      Third photo.
    */
    enterSide: "left",
    enterStart: 0.64,
  },
];

/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.22;

/*
  Keep the same page margins that were already being used.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";

/* ============================================================
   MAIN COMPONENT
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
    Tracks which photo has been triggered.
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

    return () =>
      mq.removeEventListener?.("change", onChange);
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
        const rect = wrapper.getBoundingClientRect();

        const contentHeight =
          contentHeightRef.current;

        const pinnableRange =
          rect.height - contentHeight;

        let nextState;
        let next;

        /*
          Before the section reaches the navbar.
        */
        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          next = 0;
        }

        /*
          The section has reached the end.
        */
        else if (
          rect.bottom <=
          NAVBAR_HEIGHT_PX + contentHeight
        ) {
          nextState = "after";
          next = 1;

          afterTopRef.current = Math.max(
            0,
            rect.height - contentHeight
          );
        }

        /*
          Keep the showcase pinned while the user scrolls
          through its long animation track.
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

        setPinState((prev) =>
          prev === nextState ? prev : nextState
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

  /* ============================================================
     PROGRESS
     ============================================================ */

  const p = reduceMotion ? 1 : progress;

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
     LARA WORDMARK FADE / SCALE
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
    Lara starts large and settles into its normal size.
  */
  const wordmarkScale = reduceMotion
    ? 1
    : 1.5 - 0.5 * wordmarkFadeT;

  /* ============================================================
     PHOTO TRIGGERS
     ============================================================ */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      If we scroll back above the Lara stage,
      reset the photos so they can replay.
    */
    if (wordmarkSlide.enterT <= 0.02) {
      setEnteredPhotos({});
      return;
    }

    setEnteredPhotos((prev) => {
      let changed = false;

      const next = { ...prev };

      SCATTER_PHOTOS.forEach((photo) => {
        if (
          !next[photo.id] &&
          wordmarkSlide.enterT >=
            photo.enterStart
        ) {
          next[photo.id] = true;
          changed = true;
        }
      });

      return changed ? next : prev;
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
    /*
      Once the animation track finishes, release the fixed
      container naturally so the next content/footer can
      continue underneath it.
    */
    containerStyle = {
      position: "absolute",
      top: afterTopRef.current,
      left: 0,
      right: 0,
      height: "100vh",
    };
  }

  /* ============================================================
     COMMON LAYER STYLE
     ============================================================ */

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
    transition:
      "opacity 0.6s ease, transform 0.6s ease",
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
              STAGE A
              LARA WORDMARK + 3 PHOTOS
              ====================================================== */}

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
                  LARA DECOR

                  Kept behind Lara.
                  No glow.
                  No extra blur.
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

                  The entire stack is CENTERED on Lara.

                  This is the important correction:
                  the photos no longer use the old Figma page
                  coordinates as their absolute position.

                  Instead:
                    left: 50%
                    top: 50%

                  Then tiny x/y offsets reproduce the Figma
                  relationship between the three photos.
                  ================================================== */}

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
                  width: PHOTO_WIDTH,
                  aspectRatio:
                    PHOTO_ASPECT_RATIO,
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
                      Figma's angle convention:

                      +8.21 = anti-clockwise
                      0      = straight
                      -19.63 = clockwise

                      CSS uses the opposite visual
                      direction, therefore:

                      CSS = -Figma
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

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
                        initial={false}
                        animate={
                          entered
                            ? {
                                /*
                                  Final state:
                                  normal size,
                                  centered,
                                  exact rotation.
                                */
                                opacity: 1,
                                scale: 1,
                                x: photo.finalX,
                                y: photo.finalY,
                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                /*
                                  Entrance state:

                                  VERY BIG
                                  + off-screen side
                                  + extra rotation
                                  + invisible

                                  Then Framer Motion settles
                                  it into the final position.
                                */
                                opacity: 0,
                                scale:
                                  PHOTO_ENTER_START_SCALE,
                                x:
                                  photo.finalX +
                                  sideOffset,
                                y:
                                  photo.finalY,
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
                            Smooth "comes in quickly,
                            then gently settles" curve.
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
                            Every photo is centered on
                            the exact same stack origin.
                          */
                          left: "50%",
                          top: "50%",

                          width: "100%",
                          height: "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          /*
                            Remove the white outlines.
                          */
                          border: "none",
                          borderRadius: 0,
                          boxShadow: "none",

                          /*
                            Critical:
                            the transform origin is the
                            center so the big → small
                            animation stays centered.
                          */
                          transformOrigin:
                            "50% 50%",

                          zIndex:
                            photo.zIndex,

                          /*
                            The CSS left/top are the stack
                            origin, while Framer handles the
                            actual x/y movement.
                          */
                          marginLeft:
                            "-50%",
                          marginTop:
                            "-50%",
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
              STAGE B
              PARAGRAPHS

              This stage cannot begin until Stage A has finished.
              ====================================================== */}

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

          {/* ======================================================
              STAGE C
              9 REVIEWS

              3 columns × 3 rows.

              Smaller cards so all nine fit into the review
              section without making the page feel enormous.
              ====================================================== */}

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
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity:
                        testimonialsSlide.opacity,
                      y: 0,
                    }}
                    transition={{
                      duration: 1.1,
                      delay:
                        index * 0.08,
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
                      px-4
                      py-4
                      text-center
                      md:px-5
                      md:py-5
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
                        text-xs
                        leading-relaxed
                        text-[var(--ink)]
                        md:text-sm
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
                          h-3
                          w-3
                          items-center
                          justify-center
                          rounded-full
                          bg-[var(--maroon)]
                          text-[7px]
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