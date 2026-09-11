import { useEffect, useMemo, useRef, useState } from "react";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE
   ============================================================

   ONE CONTINUOUS PINNED SEQUENCE:

   1. Lara wordmark appears
   2. Photos enter one at a time, slowly
   3. Lara + photos hold
   4. Lara + photos fade away
   5. Paragraph fades in
   6. Paragraph reveals word-by-word
   7. Paragraph holds
   8. Reviews fade/slide in, 3 columns x 3 rows
   9. Reviews hold
   10. ONLY THEN does the pinned section release

   The important difference from the previous version:

   REVIEWS ARE INSIDE THE PINNED TRACK.

   The page therefore cannot fall into normal document flow
   immediately after the paragraph finishes.

   SHOP OUR PIECES / the next App.jsx section only begins after
   the entire Lara + paragraph + reviews sequence has completed.
   ============================================================ */


/* ============================================================
   GENERAL SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  This is the amount of page scroll available to scrub through
  the complete Lara → paragraph → reviews sequence.

  The old 1200vh was already giving the Lara animation a long
  feel. Reviews are now included, so we give the complete
  sequence a little more room.
*/
const TRACK_VH = 1500;


/* ============================================================
   COMPLETE PROGRESS MAP
   ============================================================

   0.00
      ↓
      Lara fades in
   0.03

      ↓
      Photo 1
   0.18

      ↓
      Photo 2
   0.35

      ↓
      Photo 3
   0.52

      ↓
      Lara + photos hold
   0.64

      ↓
      Lara + photos exit
   0.70

      ↓
      Paragraph fades in
   0.73

      ↓
      Paragraph word reveal
   0.86

      ↓
      Paragraph holds
   0.89

      ↓
      Reviews enter
   0.94

      ↓
      Review rows animate
   0.985

      ↓
      Reviews hold
   0.999

      ↓
      RELEASE
   1.00

   Only after 1.00 does the pinned section release.
*/


const WORDMARK_FADE_IN_END = 0.03;

const PHOTO_RANGES = [
  { start: 0.03, end: 0.18 },
  { start: 0.18, end: 0.35 },
  { start: 0.35, end: 0.52 },
];

const LARA_HOLD_END = 0.64;
const LARA_EXIT_END = 0.70;

const PARAGRAPH_CONTAINER_FADE_START = 0.69;
const PARAGRAPH_CONTAINER_FADE_END = 0.73;

const PARAGRAPH_WORDS_START = 0.73;
const PARAGRAPH_WORDS_END = 0.86;

const PARAGRAPH_HOLD_END = 0.89;

/*
  Reviews begin AFTER the paragraph has finished revealing.

  They are still inside the pinned scene.
*/
const REVIEWS_FADE_START = 0.87;
const REVIEWS_FADE_END = 0.92;

const REVIEWS_ANIMATION_START = 0.89;
const REVIEWS_ANIMATION_END = 0.985;

/*
  Do not release the pin until essentially the entire review
  sequence has completed.
*/
const RELEASE_AT = 0.999;


/* ============================================================
   PHOTO ENTRANCE TUNING
   ============================================================ */

const PHOTO_ENTER_START_SCALE = 3.6;
const PHOTO_ENTER_SIDE_DISTANCE = 850;
const PHOTO_ENTER_SPIN_OFFSET = 12;


/* ============================================================
   HELPERS
   ============================================================ */

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}


/* ============================================================
   LARA / PHOTO OPACITY
   ============================================================ */

function sceneOpacity(progress) {
  if (progress <= WORDMARK_FADE_IN_END) {
    return clamp01(progress / WORDMARK_FADE_IN_END);
  }

  if (
    progress >= LARA_HOLD_END &&
    progress <= LARA_EXIT_END
  ) {
    return (
      1 -
      clamp01(
        (progress - LARA_HOLD_END) /
          (LARA_EXIT_END - LARA_HOLD_END)
      )
    );
  }

  if (progress > LARA_EXIT_END) {
    return 0;
  }

  return 1;
}


/* ============================================================
   PARAGRAPH OPACITY
   ============================================================ */

function paragraphContainerOpacity(progress) {
  if (progress < PARAGRAPH_CONTAINER_FADE_START) {
    return 0;
  }

  if (progress < PARAGRAPH_CONTAINER_FADE_END) {
    return clamp01(
      (progress - PARAGRAPH_CONTAINER_FADE_START) /
        (PARAGRAPH_CONTAINER_FADE_END -
          PARAGRAPH_CONTAINER_FADE_START)
    );
  }

  return 1;
}


/* ============================================================
   PHOTO STATE
   ============================================================ */

function getPhotoState(photo, range, progress) {
  const localT = clamp01(
    (progress - range.start) /
      (range.end - range.start)
  );

  const eased = easeInOutCubic(localT);

  const hasAppeared = progress >= range.start;

  const fadeIn = clamp01(
    (progress - range.start) / 0.025
  );

  const opacity = hasAppeared ? fadeIn : 0;

  let startX = 0;
  let startY = 0;

  if (photo.enterDirection === "left") {
    startX = -PHOTO_ENTER_SIDE_DISTANCE;
  }

  if (photo.enterDirection === "right") {
    startX = PHOTO_ENTER_SIDE_DISTANCE;
  }

  if (photo.enterDirection === "bottom") {
    startY = PHOTO_ENTER_SIDE_DISTANCE;
  }

  const x = lerp(startX, photo.finalX, eased);
  const y = lerp(startY, photo.finalY, eased);

  const scale = lerp(
    PHOTO_ENTER_START_SCALE,
    1,
    eased
  );

  const spinOffset =
    photo.enterDirection === "left"
      ? -PHOTO_ENTER_SPIN_OFFSET
      : PHOTO_ENTER_SPIN_OFFSET;

  const finalRotate = -photo.figmaAngle;

  const startRotate =
    finalRotate + spinOffset;

  const rotate = lerp(
    startRotate,
    finalRotate,
    eased
  );

  return {
    opacity,
    x,
    y,
    scale,
    rotate,
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
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    id: "back",
    src: scatterStreet,
    alt: "Street-style portrait",
    width: 175.59958036211256,
    height: 103.72863095475553,
    figmaAngle: -19.63,
    enterDirection: "bottom",
    zIndex: 1,
    finalX: 0,
    finalY: -25,
  },

  {
    id: "middle",
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",
    width: 175.59957885742188,
    height: 103.72863006591797,
    figmaAngle: 0,
    enterDirection: "left",
    zIndex: 2,
    finalX: -7,
    finalY: 0,
  },

  {
    id: "front",
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",
    width: 175.59957556823136,
    height: 103.72862812295645,
    figmaAngle: 8.21,
    enterDirection: "right",
    zIndex: 3,
    finalX: 0,
    finalY: 4,
  },
];


/* ============================================================
   LAYOUT
   ============================================================ */

const WORDMARK_CONTAINER_WIDTH =
  "clamp(760px, 56vw, 1080px)";

const PHOTO_WIDTH_PX = 175.6;

const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[15.83%]";


/* ============================================================
   COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const contentHeightRef = useRef(0);
  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] = useState(false);

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
     MEASURE + SCROLL TRACK
     ========================================================== */

  useEffect(() => {
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

        /*
          How much scrolling exists inside the tall
          wrapper while the visual content remains pinned.
        */
        const pinnableRange = Math.max(
          1,
          rect.height - contentHeight
        );

        let nextState;
        let nextProgress;

        /*
          BEFORE

          The wrapper has not reached the navbar yet.
          We give Lara a small soft pre-roll so there is
          no sudden blank transition after Hero.
        */
        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";

          const approachWindow =
            window.innerHeight * 0.8;

          const distanceToEngage =
            rect.top - NAVBAR_HEIGHT_PX;

          const approachT = clamp01(
            1 -
              distanceToEngage /
                approachWindow
          );

          nextProgress =
            approachT *
            WORDMARK_FADE_IN_END;
        }

        /*
          AFTER

          The entire 1500vh track has been consumed.
          At this point the browser can naturally continue
          into Shop Our Pieces.

          IMPORTANT:
          We do NOT collapse the wrapper or replace it
          with static markup here.
        */
        else if (
          rect.bottom <=
          NAVBAR_HEIGHT_PX + contentHeight
        ) {
          nextState = "after";
          nextProgress = 1;
        }

        /*
          PINNED

          Everything from Lara through the reviews is
          controlled by this same progress value.
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
  }, []);


  /* ==========================================================
     MASTER PROGRESS
     ========================================================== */

  const p = reduceMotion ? 1 : progress;

  const scene = sceneOpacity(p);

  const paragraphContainer =
    paragraphContainerOpacity(p);

  const paragraphWordsT = clamp01(
    (p - PARAGRAPH_WORDS_START) /
      (PARAGRAPH_WORDS_END -
        PARAGRAPH_WORDS_START)
  );


  /* ==========================================================
     REVIEWS MASTER OPACITY
     ========================================================== */

  const reviewsOpacity =
    p < REVIEWS_FADE_START
      ? 0
      : p < REVIEWS_FADE_END
      ? clamp01(
          (p - REVIEWS_FADE_START) /
            (REVIEWS_FADE_END -
              REVIEWS_FADE_START)
        )
      : 1;


  /* ==========================================================
     REVIEW ANIMATION
     ========================================================== */

  const reviewAnimationT = clamp01(
    (p - REVIEWS_ANIMATION_START) /
      (REVIEWS_ANIMATION_END -
        REVIEWS_ANIMATION_START)
  );

  /*
    Three rows.

    Row 1 enters first.
    Row 2 follows.
    Row 3 follows.

    This gives you the "three three" review layout while
    keeping the entire review block inside the pinned scene.
  */

  const getReviewState = (index) => {
    const row = Math.floor(index / 3);

    const rowStart = row * 0.28;

    const localT = clamp01(
      (reviewAnimationT - rowStart) /
        0.45
    );

    const eased = easeInOutCubic(localT);

    return {
      opacity: eased,
      y: lerp(35, 0, eased),
    };
  };


  /* ==========================================================
     PINNED CONTENT POSITION
     ========================================================== */

  let containerStyle;

  if (pinState === "before") {
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
      Once the track has genuinely finished, the visual
      content sits at the bottom of its original track and
      the document continues normally.

      We intentionally do NOT collapse the 1500vh wrapper.
    */
    containerStyle = {
      position: "absolute",
      top: `${Math.max(
        0,
        (contentHeightRef.current || 0)
      )}px`,
      left: 0,
      right: 0,
      height: "100vh",
    };
  }

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
  };


  /* ==========================================================
     LARA + PHOTOS
     ========================================================== */

  const laraScene = (
    <div
      className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
      style={{
        ...layerBaseStyle,
        opacity: scene,
        pointerEvents: "none",
      }}
    >
      <div
        className="relative mx-auto w-full"
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
          className="relative z-10 block h-auto w-full select-none pointer-events-none"
        />

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 overflow-visible"
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
              const state =
                getPhotoState(
                  photo,
                  PHOTO_RANGES[index],
                  p
                );

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
                    zIndex: photo.zIndex,
                    transformOrigin:
                      "50% 50%",
                    objectFit: "cover",
                    opacity:
                      state.opacity *
                      scene,
                    transform:
                      `translate(${state.x}px, ${state.y}px) ` +
                      `scale(${state.scale}) ` +
                      `rotate(${state.rotate}deg)`,
                  }}
                />
              );
            }
          )}
        </div>
      </div>
    </div>
  );


  /* ==========================================================
     PARAGRAPH
     ========================================================== */

  const paragraphScene = (
    <div
      className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
      style={{
        ...layerBaseStyle,
        opacity:
          paragraphContainer,
        pointerEvents: "none",
      }}
    >
      <div className="mx-auto max-w-2xl text-center text-[16px] leading-[1.7] text-[var(--ink)] md:max-w-3xl">
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
                ({ word, index }) => {
                  const wordT =
                    clamp01(
                      (paragraphWordsT -
                        index /
                          totalWords) /
                        (1 /
                          totalWords)
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
  );


  /* ==========================================================
     REVIEWS
     ========================================================== */

  const reviewsScene = (
    <div
      className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
      style={{
        ...layerBaseStyle,
        opacity: reviewsOpacity,
        pointerEvents: "none",
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col justify-center">
        {/* Optional section label / spacing area */}
        <div className="mb-8 text-center">
          <p className="text-[14px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
            What our customers say
          </p>
        </div>

        {/* 3 x 3 REVIEW GRID */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map(
            (testimonial, index) => {
              const state =
                getReviewState(index);

              return (
                <div
                  key={`${testimonial.name}-${index}`}
                  className={`border border-[var(--line)] bg-[var(--cream)] p-5 text-center ${
                    index % 3 === 1
                      ? "lg:-translate-y-3"
                      : ""
                  }`}
                  style={{
                    opacity:
                      state.opacity,
                    transform:
                      `translateY(${state.y}px)`,
                  }}
                >
                  <p className="mb-4 text-[14px] leading-[1.55] text-[var(--ink)]">
                    "{testimonial.quote}"
                  </p>

                  <p className="flex items-center justify-center gap-1 text-[14px] font-bold text-[var(--ink)]">
                    {testimonial.name}

                    <span
                      aria-hidden="true"
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-[9px] text-white"
                    >
                      ✓
                    </span>
                  </p>

                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    Verified Customer
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );


  /* ==========================================================
     FINAL RENDER
     ========================================================== */

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
        <div className="relative h-full w-full overflow-hidden">
          {/* ================================================
              1. LARA + PHOTOS
              ================================================ */}

          {laraScene}


          {/* ================================================
              2. PARAGRAPH

              This is still the exact same pinned viewport.
              It simply becomes visible after Lara exits.
              ================================================ */}

          {paragraphScene}


          {/* ================================================
              3. REVIEWS

              IMPORTANT:
              Reviews are INSIDE the pinned scene.

              They do not exist outside the track anymore.
              ================================================ */}

          {reviewsScene}
        </div>
      </div>
    </section>
  );
}
