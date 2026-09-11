import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA'S CROCHET SHOWCASE

   PHOTO ANIMATION:
   - Exactly 3 supporting photos
   - Each enters one at a time
   - Starts VERY large
   - Slides in from the side
   - Shrinks down into its Figma size
   - Settles into the centre composition
   - Exact Figma rotation is preserved
   - No white borders / shadows / rounded corners

   CONTENT:
   - Lara wordmark stays visually dominant
   - Paragraph remains centered and relatively compact
   - Reviews remain centered and compact
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  More scroll room gives each image enough time to be clearly seen
  while it enters.

  The previous 620vh was still making the photo sequence feel rushed
  because the photo triggers were compressed into the beginning of
  the wordmark stage.

  The wordmark stage below now has a much larger portion of the
  overall scroll track.
*/
const TRACK_VH = 700;

const STAGE = {
  wordmark: {
    start: 0.0,
    end: 0.50,
  },

  paragraph: {
    start: 0.54,
    end: 0.75,
  },

  testimonials: {
    start: 0.79,
    end: 1.0,
  },
};

/* ============================================================
   GENERAL STAGE MOTION
   ============================================================ */

const SLIDE_PHASES = {
  enterFrac: 0.58,
  holdFrac: 0.17,
  exitFrac: 0.25,
  travel: 45,
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
];

/* ============================================================
   FIGMA PHOTO POSITIONS
   ============================================================

   Figma frame:
   1920 × 1176

   These are the exact dimensions supplied.

   IMPORTANT:
   We keep the 175.599... × 103.728... Figma relationship,
   but position the whole group around the CENTER of the Lara
   composition instead of treating the Figma coordinates as
   viewport coordinates.

   That prevents the photos from drifting/scattering when the
   responsive container changes size.
   ============================================================ */

const PHOTO_ASPECT_RATIO =
  "175.59957556823136 / 103.72862812295645";

/*
  The final photo width.

  On a 1920px Figma canvas this resolves to approximately
  175.6px.

  On smaller screens it scales down naturally.
*/
const PHOTO_BOX_WIDTH =
  "clamp(120px, 9.1458vw, 175.6px)";

/* ============================================================
   PHOTO ENTRANCE SETTINGS
   ============================================================ */

/*
  BIG starting size.

  2.35 means the image begins at 235% of its final size.

  So:
      BIG → BIG → BIG → gradually smaller → exact Figma size
*/
const PHOTO_ENTER_START_SCALE = 2.35;

/*
  This is how far from the side the image begins.
*/
const PHOTO_ENTER_SIDE_DISTANCE = 560;

/*
  Slow enough to actually see the image coming in.
*/
const PHOTO_ENTER_DURATION_S = 3.1;

/*
  Additional rotation while entering.

  The image settles into its exact Figma angle at the end.
*/
const PHOTO_ENTER_SPIN_OFFSET = 22;

/*
  Three clearly separated scroll trigger points.

  These are deliberately much further apart than before.

  Photo 1
      ↓
  Photo 2
      ↓
  Photo 3
*/
const PHOTO_SEQUENCE = {
  first: 0.08,
  second: 0.30,
  third: 0.52,
};

/* ============================================================
   THREE PHOTOS
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    id: "front",

    src: scatterTeal,

    alt: "Lara's Crochet customer wearing a teal crochet dress",

    /*
      Exact Figma size
    */
    width: 175.59957556823136,
    height: 103.72862812295645,

    /*
      Exact Figma position retained as reference.
    */
    left: 866.92,
    top: 114.87,

    /*
      Figma:
      +8.21° = anti-clockwise
    */
    figmaAngle: 8.21,

    zIndex: 3,

    /*
      First image enters from the left.
    */
    enterSide: "left",

    /*
      First image begins first.
    */
    enterStart: PHOTO_SEQUENCE.first,
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
      Figma:
      0°
    */
    figmaAngle: 0,

    zIndex: 2,

    /*
      Second image enters from the right.
    */
    enterSide: "right",

    enterStart: PHOTO_SEQUENCE.second,
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
      Figma:
      -19.63° = clockwise
    */
    figmaAngle: -19.63,

    zIndex: 1,

    /*
      Third image enters from the left.
    */
    enterSide: "left",

    enterStart: PHOTO_SEQUENCE.third,
  },
];

/* ============================================================
   WORDMARK
   ============================================================ */

const WORDMARK_FADE_ENTER_END = 0.30;

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
    Tracks which of the three photos have started their entrance.

    Once a photo is triggered it continues its animation even if
    the user scrolls quickly.
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

    const onChange = (event) => {
      setReduceMotion(event.matches);
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
        const rect =
          wrapper.getBoundingClientRect();

        const contentHeight =
          contentHeightRef.current;

        const pinnableRange =
          rect.height - contentHeight;

        let nextState;
        let next;

        /*
          Before the showcase reaches the navbar.
        */
        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          next = 0;
        }

        /*
          Showcase has reached the end of its scroll track.
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
          Showcase is pinned underneath navbar.
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

  /* ============================================================
     STAGE PROGRESS
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
     WORDMARK ANIMATION
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
    Lara itself starts somewhat larger and settles down.

    This is deliberately less extreme than the photos because
    the Lara wordmark should remain the main visual anchor.
  */
  const wordmarkScale = reduceMotion
    ? 1
    : 1.18 -
      0.18 * wordmarkFadeT;

  /* ============================================================
     TRIGGER THREE PHOTOS ONE AT A TIME
     ============================================================ */

  useEffect(() => {
    if (reduceMotion) return;

    /*
      Reset only when the user has genuinely returned above
      the wordmark sequence.
    */
    if (wordmarkSlide.enterT <= 0.015) {
      setEnteredPhotos({});
      return;
    }

    setEnteredPhotos((previous) => {
      let changed = false;

      const next = {
        ...previous,
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

      return changed ? next : previous;
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
    transition:
      "opacity 0.4s ease, transform 0.4s ease",
  };

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

          {/* ========================================================
              STAGE A — LARA WORDMARK + THREE PHOTOS
              ======================================================== */}

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
              IMPORTANT:

              This wrapper is now a fixed composition area.

              The photo group is positioned against the CENTER
              of this area rather than using viewport-style
              absolute coordinates.

              That is what keeps the three images together with
              Lara instead of scattering them across the page.
            */}
            <div
              className="relative mx-auto w-full"
              style={{
                maxWidth: "1080px",

                /*
                  The actual Lara composition gets a controlled
                  height instead of inheriting strange proportions.
                */
                height: "min(62vh, 650px)",

                opacity: wordmarkFadeT,
              }}
            >
              {/* ==================================================
                  LARA DECOR

                  No glow.
                  No extra effect.
                  The original decorative image remains.
                  ================================================== */}

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  width: "100vw",
                }}
              />

              {/* ==================================================
                  LARA WORDMARK

                  This remains the visual centre of the section.
                  ================================================== */}

              <img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 block h-auto w-full -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  transform: `translate(-50%, -50%) scale(${wordmarkScale})`,

                  transformOrigin:
                    "50% 50%",
                }}
              />

              {/* ==================================================
                  PHOTO GROUP

                  ALL THREE PHOTOS SHARE THIS SAME CENTRE.

                  This is important.

                  We are NOT putting them at unrelated viewport
                  coordinates anymore.

                  Their final locations are small offsets around
                  the centre of Lara.
                  ================================================== */}

              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-20"
                style={{
                  width: PHOTO_BOX_WIDTH,
                  aspectRatio:
                    PHOTO_ASPECT_RATIO,

                  /*
                    This is the centre anchor.

                    Every photo starts and finishes relative to
                    this exact same point.
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
                      Figma angles need the opposite sign in
                      CSS transform because of the coordinate/
                      rotation convention.

                      +8.21 Figma
                        -> -8.21 CSS

                      0 Figma
                        -> 0 CSS

                      -19.63 Figma
                        -> +19.63 CSS
                    */
                    const cssFinalRotation =
                      -photo.figmaAngle;

                    /*
                      Big starting position.

                      The image comes from outside the centre
                      area and simultaneously shrinks.
                    */
                    const sideOffset =
                      photo.enterSide ===
                      "left"
                        ? -PHOTO_ENTER_SIDE_DISTANCE
                        : PHOTO_ENTER_SIDE_DISTANCE;

                    /*
                      Very important:

                      These offsets are intentionally tiny.

                      They preserve the three-photo stack around
                      the centre instead of sending them away
                      from Lara.
                    */
                    const finalX =
                      photo.id === "front"
                        ? 7
                        : photo.id === "middle"
                        ? 0
                        : 7;

                    const finalY =
                      photo.id === "front"
                        ? -4
                        : photo.id === "middle"
                        ? 0
                        : -27;

                    return (
                      <motion.img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt}
                        initial={false}
                        animate={
                          entered
                            ? {
                                opacity: 1,

                                /*
                                  Final Figma size.
                                */
                                scale: 1,

                                /*
                                  Final position is only a
                                  few pixels from the centre.
                                */
                                x: finalX,
                                y: finalY,

                                /*
                                  Exact final Figma angle.
                                */
                                rotate:
                                  cssFinalRotation,
                              }
                            : {
                                /*
                                  Start invisible and HUGE.
                                */
                                opacity: 0,
                                scale:
                                  PHOTO_ENTER_START_SCALE,

                                /*
                                  Come from the side.
                                */
                                x:
                                  finalX +
                                  sideOffset,

                                y: finalY,

                                /*
                                  Start slightly more rotated,
                                  then settle into the exact
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
                            This is intentionally slow.
                            Each image gets over 3 seconds.
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

                          left: 0,
                          top: 0,

                          /*
                            EXACT proportional Figma
                            width.
                          */
                          width: "100%",

                          /*
                            Don't force a height that can
                            distort the source image.
                          */
                          height: "auto",

                          aspectRatio:
                            PHOTO_ASPECT_RATIO,

                          zIndex:
                            photo.zIndex,

                          /*
                            NO WHITE BORDER
                          */
                          border: "none",

                          /*
                            NO ROUNDED CORNERS
                          */
                          borderRadius: 0,

                          /*
                            NO SHADOW
                          */
                          boxShadow:
                            "none",

                          /*
                            Prevent browser interpolation
                            from making the movement feel
                            blurry.
                          */
                          backfaceVisibility:
                            "hidden",

                          transformOrigin:
                            "50% 50%",
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
              ======================================================== */}

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
            {/*
              Much smaller than the previous max-w-3xl / text-3xl
              version.

              The paragraph is supposed to feel like part of the
              Lara composition, not become another giant hero.
            */}
            <div
              className="
                mx-auto
                w-full
                max-w-[620px]
                space-y-5
                text-center
                text-[15px]
                leading-[1.65]
                text-[var(--ink)]
                md:text-[17px]
                md:leading-[1.7]
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
                                  (1 /
                                    totalWords)
                              );

                        return (
                          <span
                            key={index}
                            style={{
                              opacity: wordT,
                              transition:
                                "opacity 0.15s linear",
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
              STAGE C — TESTIMONIALS
              ======================================================== */}

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
            {/*
              The reviews are now a compact centred group instead
              of a huge max-w-5xl section.
            */}
            <div
              className="
                grid
                w-full
                max-w-[760px]
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
                  <div
                    key={
                      testimonial.name
                    }
                    className={`
                      h-full
                      border
                      border-[var(--line)]
                      bg-[var(--cream)]
                      p-4
                      text-center
                      ${
                        index % 3 ===
                        1
                          ? "md:-translate-y-4"
                          : ""
                      }
                    `}
                  >
                    <p
                      className="
                        mb-3
                        text-[12px]
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
                        text-[11px]
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
                        text-[9px]
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