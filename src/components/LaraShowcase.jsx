import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";

/* ============================================================
   LARA SHOWCASE
   ============================================================

   PHOTO BEHAVIOUR

   There are exactly 3 photos.

   Each photo:
   1. Starts VERY large.
   2. Starts outside the Lara wordmark area.
   3. Moves toward the centre.
   4. Shrinks smoothly to its normal Figma size.
   5. Settles into its exact final position.
   6. Only then does the next photo begin.

   The final positions are centred around the Lara wordmark,
   rather than using the raw 1920px Figma coordinates inside
   a smaller responsive container.

   Figma photo dimensions:
     175.599... × 103.728...

   Figma rotations:
     Front  = +8.21° anti-clockwise
     Middle =  0°
     Back   = -19.63° clockwise
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  This is the total amount of scroll space allocated to the
  showcase. More space = slower, more luxurious animation.
*/
const TRACK_VH = 680;

/*
  The wordmark/photo stage gets most of the scroll time.
  Paragraph and testimonials remain normal-sized and centred.
*/
const STAGE = {
  wordmark: {
    start: 0,
    end: 0.48,
  },

  paragraph: {
    start: 0.53,
    end: 0.75,
  },

  testimonials: {
    start: 0.80,
    end: 1,
  },
};

/* ============================================================
   GENERAL HELPERS
   ============================================================ */

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function computeSlide(
  progress,
  start,
  end,
  {
    enterFrac = 0.55,
    holdFrac = 0.15,
    exitFrac = 0.3,
    travel = 70,
  }
) {
  const span = end - start;

  const local = clamp01(
    span > 0 ? (progress - start) / span : 1
  );

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
   WORDMARK PHOTO CONFIGURATION
   ============================================================

   IMPORTANT:

   These are the EXACT Figma measurements you gave me.

   Figma:
     Front:
       width  = 175.59957556823136
       height = 103.72862812295645
       angle  = +8.21°

     Middle:
       width  = 175.59957885742188
       height = 103.72863006591797
       angle  = 0°

     Back:
       width  = 175.59958036211256
       height = 103.72863095475553
       angle  = -19.63°

   The photos are now anchored around the centre of Lara
   instead of positioning them using 1920px absolute
   coordinates.
   ============================================================ */

const PHOTO_WIDTH = 175.59957556823136;
const PHOTO_HEIGHT = 103.72862812295645;

const PHOTO_ASPECT_RATIO =
  PHOTO_WIDTH / PHOTO_HEIGHT;

/*
  This controls how HUGE the images are when they first
  enter.

  2.8 means the image starts at roughly 2.8 × its final size.
*/
const PHOTO_ENTER_START_SCALE = 2.8;

/*
  How far outside the centre each image starts.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 650;

/*
  Slight extra rotation while entering.

  The FINAL rotations remain exactly the Figma angles.
*/
const PHOTO_ENTER_SPIN_OFFSET = 16;

/*
  Slower animation so the viewer can actually see each image
  come in and settle.
*/
const PHOTO_ENTER_DURATION_S = 2.6;

/*
  The amount of time before the next photo begins.

  Because the next photo has a later scroll trigger, the user
  naturally sees the first one settle before the next one starts.
*/
const PHOTO_TRIGGER_GAP = 0.30;

/*
  Final offsets around the centre.

  These are intentionally tiny because the Figma coordinates
  show that all three photos sit around essentially the same
  centre point.

  They are NOT being positioned with the old:
      left: 866 / 1920
      top: 114 / 1176

  system anymore.
*/
const SCATTER_PHOTOS = [
  {
    id: "front",

    src: scatterTeal,

    alt:
      "Lara's Crochet customer wearing a teal crochet dress",

    /*
      Figma +8.21° = anti-clockwise.

      CSS uses the opposite sign convention, so:
        +8.21 Figma → -8.21 CSS
    */
    figmaAngle: 8.21,

    zIndex: 3,

    /*
      Final location relative to the exact centre of the
      wordmark.
    */
    finalX: 0,
    finalY: 0,

    /*
      First photo enters from the left.
    */
    enterSide: "left",

    /*
      First photo begins earliest.
    */
    enterStart: 0.08,
  },

  {
    id: "middle",

    src: scatterBeach,

    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    figmaAngle: 0,

    zIndex: 2,

    /*
      Slightly behind the front image.
    */
    finalX: -6,
    finalY: 4,

    /*
      Second photo enters from the right.
    */
    enterSide: "right",

    enterStart: 0.38,
  },

  {
    id: "back",

    src: scatterStreet,

    alt:
      "Street-style portrait",

    /*
      Figma -19.63° = clockwise.

      CSS therefore becomes +19.63°.
    */
    figmaAngle: -19.63,

    zIndex: 1,

    finalX: 1,
    finalY: -8,

    /*
      Third photo enters from the left.
    */
    enterSide: "left",

    enterStart: 0.68,
  },
];

/*
  No max-width restriction here.

  The wordmark itself stays centred and the photo stack is
  independently centred over it.
*/
const WORDMARK_MAX_WIDTH =
  "clamp(520px, 48vw, 920px)";

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
    Each photo has its own entered state.

    This prevents all three photos from being mounted as
    visible at the same time.
  */
  const [enteredPhotos, setEnteredPhotos] = useState({});

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

    const onChange = (event) => {
      setReduceMotion(event.matches);
    };

    mq.addEventListener?.("change", onChange);

    return () => {
      mq.removeEventListener?.("change", onChange);
    };
  }, []);

  /* ==========================================================
     MEASURE + SCROLL TRACKING
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

    const resizeObserver = new ResizeObserver(measure);

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
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
          Showcase hasn't reached navbar yet.
        */
        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          nextProgress = 0;
        }

        /*
          Showcase has finished pinning.
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
          Showcase is currently pinned.
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
      cancelAnimationFrame(rafRef.current);

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
     STAGE PROGRESS
     ========================================================== */

  const p = reduceMotion ? 1 : progress;

  const wordmarkSlide = computeSlide(
    p,
    STAGE.wordmark.start,
    STAGE.wordmark.end,
    {
      enterFrac: 0.78,
      holdFrac: 0.22,
      exitFrac: 0,
      travel: 45,
    }
  );

  const paragraphSlide = computeSlide(
    p,
    STAGE.paragraph.start,
    STAGE.paragraph.end,
    {
      enterFrac: 0.45,
      holdFrac: 0.55,
      exitFrac: 0,
      travel: 25,
    }
  );

  const testimonialsSlide = computeSlide(
    p,
    STAGE.testimonials.start,
    STAGE.testimonials.end,
    {
      enterFrac: 0.45,
      holdFrac: 0.55,
      exitFrac: 0,
      travel: 25,
    }
  );

  /* ==========================================================
     WORDMARK
     ==========================================================

     Keep Lara at a controlled size.

     The previous 1.5x → 1x zoom was making the wordmark huge
     enough to push it off the viewport and make the photos
     appear to be in the wrong place.

     We now only give it a very subtle entrance scale.
  */

  const wordmarkFadeT = reduceMotion
    ? 1
    : easeOutCubic(
        clamp01(
          wordmarkSlide.enterT / 0.35
        )
      );

  const wordmarkScale = reduceMotion
    ? 1
    : 1.08 -
      0.08 * wordmarkFadeT;

  /* ==========================================================
     TRIGGER PHOTOS
     ==========================================================

     The three photos are triggered progressively.

     Importantly, the trigger spacing is now much larger:

       Front  → 0.08
       Middle → 0.38
       Back   → 0.68

     So they don't all start together.

     The animation itself is also 2.6 seconds.
  */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      If we return above the showcase, reset the sequence.
    */
    if (wordmarkSlide.enterT <= 0.01) {
      setEnteredPhotos((previous) => {
        if (Object.keys(previous).length === 0) {
          return previous;
        }

        return {};
      });

      return;
    }

    setEnteredPhotos((previous) => {
      let changed = false;
      const next = { ...previous };

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

      return changed ? next : previous;
    });
  }, [
    wordmarkSlide.enterT,
    reduceMotion,
  ]);

  /* ==========================================================
     PINNING
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
              STAGE A — LARA WORDMARK + 3 PHOTOS
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
                wordmarkSlide.opacity > 0.5
                  ? "auto"
                  : "none",
            }}
          >
            {/*
              THIS is the important wrapper.

              The Lara wordmark and the photo stack now have
              exactly the same centre.

              The photo stack is NOT positioned using Figma's
              full-frame left/top coordinates anymore.
            */}
            <div
              className="relative mx-auto w-full"
              style={{
                maxWidth:
                  WORDMARK_MAX_WIDTH,
              }}
            >

              {/* =================================================
                  LARA WORDMARK

                  No glow.
                  No shadow.
                  No white ring.
                  ================================================= */}

              <motion.img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="relative z-10 mx-auto block h-auto w-full select-none pointer-events-none"
                style={{
                  transform:
                    `scale(${wordmarkScale})`,

                  transformOrigin:
                    "50% 50%",

                  opacity:
                    wordmarkFadeT,
                }}
              />

              {/* =================================================
                  PHOTO STACK

                  Exact centre of Lara.

                  Every photo is positioned from this centre,
                  which fixes the "photo is beside Lara"
                  problem.
                  ================================================= */}

              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-20"
                style={{
                  width: `${PHOTO_WIDTH}px`,
                  height: `${PHOTO_HEIGHT}px`,

                  /*
                    The translate here means the PHOTO itself,
                    not its parent, is centred.
                  */
                  marginLeft:
                    `${-PHOTO_WIDTH / 2}px`,

                  marginTop:
                    `${-PHOTO_HEIGHT / 2}px`,
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
                      Figma → CSS rotation.

                      Figma:
                        positive = anti-clockwise
                        negative = clockwise

                      CSS:
                        positive = clockwise
                        negative = anti-clockwise

                      Therefore we reverse the sign.
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;

                    /*
                      During entrance:

                      scale = 2.8
                      x = far outside
                      rotate = final + temporary spin

                      When entered:

                      scale = 1
                      x = exact centre
                      rotate = exact Figma rotation
                    */
                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}
                        draggable={false}
                        initial={false}
                        animate={
                          entered
                            ? {
                                opacity: 1,

                                scale: 1,

                                x: photo.finalX,

                                y: photo.finalY,

                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                opacity: 0,

                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                x:
                                  sideOffset,

                                y:
                                  photo.enterSide ===
                                  "left"
                                    ? 35
                                    : -35,

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
                            This makes the beginning
                            energetic but the final
                            positioning soft.
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

                          left: 0,
                          top: 0,

                          width:
                            `${PHOTO_WIDTH}px`,

                          height:
                            `${PHOTO_HEIGHT}px`,

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            Completely remove the
                            unwanted white border.
                          */
                          border: "none",

                          outline: "none",

                          boxShadow: "none",

                          borderRadius: 0,

                          /*
                            Prevents the browser from
                            creating weird inline-image
                            spacing.
                          */
                          display: "block",

                          objectFit: "cover",

                          transformOrigin:
                            "50% 50%",

                          backfaceVisibility:
                            "hidden",

                          WebkitBackfaceVisibility:
                            "hidden",
                        }}
                        className="select-none"
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

              Normal centred width.
              It does NOT inherit the giant wordmark width.
              ================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity:
                reduceMotion
                  ? 1
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
                max-w-[760px]
                text-center
                text-lg
                leading-relaxed
                text-[var(--ink)]
                md:text-xl
                md:leading-[1.55]
              "
            >
              {wordParagraphs.map(
                (words, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className={
                      paragraphIndex === 0
                        ? "mb-5"
                        : "mb-5"
                    }
                  >
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
              STAGE C — TESTIMONIALS
              ==================================================

              Kept normal-sized and centred.
              ================================================== */}

          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,

              opacity:
                reduceMotion
                  ? 1
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
                        index % 3 === 1
                          ? "md:-translate-y-4"
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