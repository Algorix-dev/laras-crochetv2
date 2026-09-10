import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   DECORATION
   ============================================================ */

const LARA_ARC_OPACITY = 1;
const LARA_ARC_FILTER = "contrast(2.2) saturate(1.6)";

/* ============================================================
   SECTION SETTINGS
   ============================================================ */

/*
  The section is deliberately tall so the user has enough
  scroll distance to actually read the story and reviews.

  The visible content itself remains one viewport tall.
*/
const TRACK_VH = 520;
const NAVBAR_HEIGHT_PX = 66;

/*
  The sequence is divided into:

  1. Photos enter
  2. Story appears
  3. Story fades away
  4. Reviews appear slowly
  5. Everything settles into the final Figma state
*/
const STAGE = {
  photosStart: 0,
  photosEnd: 0.2,

  storyStart: 0.2,
  storyEnd: 0.48,

  reviewsStart: 0.52,
  reviewsEnd: 0.94,

  finish: 1,
};

/* ============================================================
   BRAND STORY
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

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
   SCATTER PHOTOS
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    /*
      Final Figma-inspired position.
    */
    finalX: -13,
    finalY: 8,
    finalRotate: 0,

    /*
      Photos enter BIG from outside the composition.
    */
    fromX: -680,
    fromY: -100,
    fromRotate: -42,
    fromScale: 1.65,

    finalScale: 1,

    start: 0.0,
    end: 0.16,

    zIndex: 3,
  },

  {
    src: scatterStreet,
    alt: "Street-style portrait",

    finalX: 7,
    finalY: -8,
    finalRotate: 19.63,

    fromX: 700,
    fromY: 80,
    fromRotate: 75,
    fromScale: 1.7,

    finalScale: 1,

    start: 0.045,
    end: 0.185,

    zIndex: 2,
  },

  {
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",

    finalX: 23,
    finalY: 10,
    finalRotate: -8.21,

    fromX: 80,
    fromY: 650,
    fromRotate: -65,
    fromScale: 1.65,

    finalScale: 1,

    start: 0.08,
    end: 0.21,

    zIndex: 1,
  },
];

/* ============================================================
   HELPERS
   ============================================================ */

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

/*
  Converts a global scroll progress value into a local 0 -> 1
  value for a particular stage.
*/
function stageProgress(progress, start, end) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;

  return clamp01((progress - start) / (end - start));
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function LaraShowcase({ onActiveChange }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  const progressRef = useRef(0);
  const maxProgressRef = useRef(0);

  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] = useState(false);

  /* ----------------------------------------------------------
     REDUCED MOTION
     ---------------------------------------------------------- */

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    setReduceMotion(mediaQuery.matches);

    const handleChange = (event) => {
      setReduceMotion(event.matches);
    };

    mediaQuery.addEventListener?.("change", handleChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleChange);
    };
  }, []);

  /* ----------------------------------------------------------
     SCROLL ENGINE
     ---------------------------------------------------------- */

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      onActiveChange?.(false);
      return;
    }

    const update = () => {
      const wrapper = wrapperRef.current;

      if (!wrapper) {
        rafRef.current = requestAnimationFrame(update);
        return;
      }

      const rect = wrapper.getBoundingClientRect();

      /*
        The navbar normally occupies 66px.

        Once the Lara section becomes active, App/Navbar can hide
        the navbar visually. The section itself still uses the
        same document geometry, which prevents layout jumping.
      */
      const pinTop = NAVBAR_HEIGHT_PX;

      const contentHeight =
        contentRef.current?.offsetHeight || window.innerHeight;

      const availableRange = Math.max(
        1,
        rect.height - contentHeight
      );

      let rawProgress = 0;
      let nextState = "before";

      if (rect.top > pinTop) {
        nextState = "before";
        rawProgress = 0;
      } else if (rect.bottom <= pinTop + contentHeight) {
        nextState = "after";
        rawProgress = 1;
      } else {
        nextState = "pinned";

        rawProgress = clamp01(
          (pinTop - rect.top) / availableRange
        );
      }

      /*
        IMPORTANT:

        Progress is allowed to move forward only.

        This means if the visitor scrolls back upward, the
        animation does NOT replay backward.

        Once the sequence reaches its final state, it stays there.
      */
      maxProgressRef.current = Math.max(
        maxProgressRef.current,
        rawProgress
      );

      const nextProgress = maxProgressRef.current;

      progressRef.current = nextProgress;

      setProgress(nextProgress);

      setPinState((previous) => {
        if (previous !== nextState) {
          return nextState;
        }

        return previous;
      });

      /*
        Tell the parent that the immersive section is currently
        occupying the viewport.
      */
      onActiveChange?.(nextState === "pinned");

      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
      onActiveChange?.(false);
    };
  }, [reduceMotion, onActiveChange]);

  /* ----------------------------------------------------------
     DISPLAY PROGRESS
     ---------------------------------------------------------- */

  const currentProgress = reduceMotion ? 1 : progress;

  /* ============================================================
     PHOTO ANIMATION
     ============================================================ */

  const getPhotoStyle = (photo) => {
    const local = stageProgress(
      currentProgress,
      photo.start,
      photo.end
    );

    const eased = easeOutCubic(local);

    const x =
      photo.fromX +
      (photo.finalX - photo.fromX) * eased;

    const y =
      photo.fromY +
      (photo.finalY - photo.fromY) * eased;

    const rotate =
      photo.fromRotate +
      (photo.finalRotate - photo.fromRotate) * eased;

    const scale =
      photo.fromScale +
      (photo.finalScale - photo.fromScale) * eased;

    /*
      The image arrives large and then settles smaller.
    */
    const opacity =
      local <= 0
        ? 0
        : easeOutCubic(
            stageProgress(
              currentProgress,
              photo.start,
              photo.start + (photo.end - photo.start) * 0.65
            )
          );

    return {
      position: "absolute",
      inset: 0,

      width: "100%",
      height: "100%",

      zIndex: photo.zIndex,

      opacity,

      transform: `
        translate(${x}px, ${y}px)
        rotate(${rotate}deg)
        scale(${scale})
      `,

      transformOrigin: "center center",

      willChange: "transform, opacity",

      pointerEvents: opacity > 0.1 ? "auto" : "none",
    };
  };

  /* ============================================================
     STORY ANIMATION
     ============================================================ */

  const storyProgress = stageProgress(
    currentProgress,
    STAGE.storyStart,
    STAGE.storyEnd
  );

  /*
    Story enters normally, stays readable, then moves upward
    and fades away.
  */
  let storyOpacity = 0;
  let storyY = 70;

  if (storyProgress <= 0.2) {
    const enter = easeOutCubic(storyProgress / 0.2);

    storyOpacity = enter;
    storyY = 70 - 70 * enter;
  } else if (storyProgress <= 0.72) {
    storyOpacity = 1;
    storyY = 0;
  } else {
    const exit = easeInOutCubic(
      (storyProgress - 0.72) / 0.28
    );

    storyOpacity = 1 - exit;
    storyY = -80 * exit;
  }

  /* ============================================================
     REVIEWS
     ============================================================ */

  const reviewsProgress = stageProgress(
    currentProgress,
    STAGE.reviewsStart,
    STAGE.reviewsEnd
  );

  /*
    Six reviews are split into two groups of three.

    Each group gets a long section of the scroll distance so the
    visitor has enough time to actually read them.
  */
  const reviewGroupCount = 2;

  const reviewGroupProgress =
    reviewsProgress * reviewGroupCount;

  const activeReviewGroup = Math.min(
    reviewGroupCount - 1,
    Math.floor(reviewGroupProgress)
  );

  const localReviewProgress = clamp01(
    reviewGroupProgress - activeReviewGroup
  );

  /*
    Keep the current group visible for most of its section.
    The transition is intentionally slow.
  */
  let reviewOpacity = 0;
  let reviewY = 60;

  if (reviewsProgress > 0) {
    if (localReviewProgress < 0.18) {
      const enter = easeOutCubic(
        localReviewProgress / 0.18
      );

      reviewOpacity = enter;
      reviewY = 60 - 60 * enter;
    } else if (localReviewProgress < 0.82) {
      reviewOpacity = 1;
      reviewY = 0;
    } else {
      const exit = easeInOutCubic(
        (localReviewProgress - 0.82) / 0.18
      );

      reviewOpacity = 1 - exit;
      reviewY = -60 * exit;
    }
  }

  /*
    Once the whole sequence is finished, keep the last review
    group visible instead of allowing it to disappear.
  */
  const finished =
    currentProgress >= STAGE.reviewsEnd;

  const visibleReviewGroup = finished
    ? reviewGroupCount - 1
    : activeReviewGroup;

  const visibleReviews = TESTIMONIALS.slice(
    visibleReviewGroup * 3,
    visibleReviewGroup * 3 + 3
  );

  /* ============================================================
     SECTION POSITION
     ============================================================ */

  let contentStyle;

  if (reduceMotion) {
    contentStyle = {
      position: "relative",
    };
  } else if (pinState === "pinned") {
    contentStyle = {
      position: "fixed",
      top: `${NAVBAR_HEIGHT_PX}px`,
      left: 0,
      right: 0,
    };
  } else if (pinState === "after") {
    contentStyle = {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    };
  } else {
    contentStyle = {
      position: "relative",
    };
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <section
      ref={wrapperRef}
      className="relative w-full bg-[var(--cream)]"
      style={{
        height: reduceMotion
          ? "auto"
          : `${TRACK_VH}vh`,
      }}
    >
      <div
        ref={contentRef}
        className="w-full overflow-hidden bg-[var(--cream)]"
        style={contentStyle}
      >
        <div
          className="
            relative
            flex
            min-h-[calc(100svh-66px)]
            w-full
            flex-col
            items-center
            justify-start
            overflow-hidden
            px-5
            pt-4
            pb-8
            md:min-h-[calc(100svh-66px)]
            md:px-8
            md:pt-5
            md:pb-10
          "
        >
          {/* ==================================================
              WORDMARK + DECORATION + PHOTOS
              ================================================== */}

          <div
            className="
              relative
              z-10
              mx-auto
              mt-0
              flex
              w-full
              max-w-[900px]
              shrink-0
              items-center
              justify-center
            "
          >
            {/* Decorative Lara arc */}

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
                width: "min(110vw, 1200px)",
                opacity: LARA_ARC_OPACITY,
                filter: LARA_ARC_FILTER,
              }}
            />

            {/* Main Lara wordmark */}

            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="
                relative
                z-10
                block
                h-auto
                w-[min(88vw,720px)]
                select-none
                pointer-events-none
              "
            />

            {/* ==================================================
                SCATTER PHOTOS

                The photos start large and fly into their final
                positions.
                ================================================== */}

            <div
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                z-20
                h-[clamp(125px,17vw,190px)]
                w-[clamp(95px,13vw,145px)]
                -translate-x-1/2
                -translate-y-1/2
              "
            >
              {SCATTER_PHOTOS.map((photo) => (
                <img
                  key={photo.alt}
                  src={photo.src}
                  alt={photo.alt}
                  className="
                    rounded-[2px]
                    object-cover
                    shadow-md
                    ring-1
                    ring-[var(--cream)]
                  "
                  style={getPhotoStyle(photo)}
                />
              ))}
            </div>
          </div>

          {/* ==================================================
              STORY + REVIEWS AREA

              This area occupies the SAME visual slot.
              Nothing gets pushed underneath it.
              ================================================== */}

          <div
            className="
              relative
              z-30
              mx-auto
              mt-5
              flex
              min-h-0
              w-full
              max-w-[760px]
              flex-1
              items-center
              justify-center
              overflow-hidden
              md:mt-8
            "
          >
            {/* ==================================================
                BRAND STORY
                ================================================== */}

            <div
              className="
                absolute
                left-0
                right-0
                top-1/2
                mx-auto
                w-full
                max-w-[680px]
                -translate-y-1/2
                text-center
              "
              style={{
                opacity:
                  reduceMotion
                    ? 1
                    : storyOpacity,

                transform:
                  reduceMotion
                    ? "translateY(-50%)"
                    : `translateY(calc(-50% + ${storyY}px))`,

                pointerEvents:
                  storyOpacity > 0.1
                    ? "auto"
                    : "none",

                willChange:
                  "opacity, transform",
              }}
            >
              <div
                className="
                  space-y-4
                  text-sm
                  leading-[1.8]
                  text-[var(--ink)]
                  md:space-y-5
                  md:text-base
                "
              >
                {PARAGRAPHS.map((paragraph, index) => (
                  <p
                    key={`${paragraph}-${index}`}
                    className={
                      index === 1
                        ? "text-base font-semibold md:text-lg"
                        : ""
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* ==================================================
                REVIEWS

                Only THREE cards are displayed at once.
                ================================================== */}

            <div
              className="
                absolute
                left-0
                right-0
                top-1/2
                mx-auto
                w-full
                max-w-[1050px]
                -translate-y-1/2
              "
              style={{
                opacity:
                  reduceMotion
                    ? 1
                    : reviewOpacity,

                transform:
                  reduceMotion
                    ? "translateY(-50%)"
                    : `translateY(calc(-50% + ${reviewY}px))`,

                pointerEvents:
                  reviewOpacity > 0.1
                    ? "auto"
                    : "none",

                willChange:
                  "opacity, transform",
              }}
            >
              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-3
                  md:gap-5
                "
              >
                {visibleReviews.map(
                  (testimonial, index) => (
                    <div
                      key={`${testimonial.name}-${visibleReviewGroup}-${index}`}
                      className={`
                        border
                        border-[var(--line)]
                        bg-[var(--cream)]
                        p-5
                        text-center
                        md:p-6
                        ${
                          index === 1
                            ? "md:-translate-y-5"
                            : ""
                        }
                      `}
                    >
                      <p
                        className="
                          mb-5
                          text-sm
                          leading-[1.75]
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
                          gap-1.5
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
                    </div>
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