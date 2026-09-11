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

   Two distinct behaviors, on purpose:

   1) PINNED SCRUB (wordmark + 3 scattered photos + paragraph)
      - progress is derived directly from scroll position
      - every visual value (opacity/scale/x/y/rotate/word-reveal)
        is a pure function of that progress, so it can never
        desync from the scrollbar like a wall-clock animation can
      - photos enter ONE AT A TIME, big → small, very slowly
      - once photos are done, Lara fades out and the paragraph
        fades in and reveals word-by-word, then holds

   2) NORMAL-FLOW REVIEWS (after the pin releases)
      - NOT pinned/fixed — this is why they can be taller than
        one screen and still be scrolled through properly
      - each card fades up once via whileInView (viewport once)
      - directly followed by whatever App.jsx renders next
        (the "Go to Shop" CTA / Shop section), no extra gap

   ONE-TIME-ONLY BEHAVIOR:
   - a module-level flag remembers that the pin animation
     finished for this page visit
   - scrolling back up does NOT restart the word-by-word reveal
     (progress stays clamped to 1 once the flag is set)
   - a full page refresh does reset it (module reloads, flag resets)

   IMPORTANT: the scroll-tracking loop (tick()) NEVER stops once
   started (other than reduced-motion / already-completed-on-mount
   cases). It keeps recomputing pinState ("before"/"pinned"/"after")
   forever, in both scroll directions. Only the visual progress `p`
   gets clamped to 1 once the reveal has completed — that's what
   stops the word-by-word animation from replaying, WITHOUT also
   freezing pinState and breaking scroll-up.
   ============================================================ */


/* ============================================================
   GENERAL SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Scroll track for the PIN ONLY (wordmark + photos + paragraph).
  Reviews are no longer inside this track — they're normal page
  content directly below it — so this can stay focused and this
  number controls exactly how slow the pinned sequence feels.
*/
const TRACK_VH = 1200;


/* ============================================================
   PROGRESS MAP (fractions of the pin's 0 → 1 scroll progress)
   ============================================================

   0.00                                                    1.00
   |--fade in--|--photo 1--|--photo 2--|--photo 3--|--hold--|--exit--|-----paragraph words-----|--hold--|
   0        0.03        0.21        0.39        0.57     0.66     0.72                       0.94      1.0
*/

const WORDMARK_FADE_IN_END = 0.03;

const PHOTO_RANGES = [
  { start: 0.03, end: 0.21 }, // back   (comes from bottom)
  { start: 0.21, end: 0.39 }, // middle (comes from left)
  { start: 0.39, end: 0.57 }, // front  (comes from right)
];

const LARA_HOLD_END = 0.66; // finished photo stack stays visible
const LARA_EXIT_END = 0.72; // Lara + photos fade out together

const PARAGRAPH_CONTAINER_FADE_START = 0.7;
const PARAGRAPH_CONTAINER_FADE_END = 0.73;

const PARAGRAPH_WORDS_START = 0.74;
const PARAGRAPH_WORDS_END = 0.94;
// 0.94 → 1.0 is the paragraph's "hold" — words stay fully
// visible while the pin keeps absorbing scroll, which is what
// gives the "waits even while scrolling" feeling.

// TIP: this is a "close enough to 1" threshold, not exactly 1.
// Floating point scroll math (fast scrolls / trackpad inertia)
// can jump past 1 between frames, so checking >= RELEASE_AT
// with a small margin below 1 makes sure we reliably catch the
// "reveal is done" moment instead of risking a skipped frame.
const RELEASE_AT = 0.995;


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

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/*
  Slow-in, slow-out. Used for the photos instead of easeOutCubic:
  easeOutCubic moves FASTEST right at the start and barely moves
  near the end — applied to "big shrinking to normal size" that
  meant it looked like it had basically already arrived seconds
  in, then just sat there. easeInOutCubic lingers large at the
  start (so it's clearly visible big), moves through the middle,
  then settles into place smoothly instead of snapping.
*/
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/*
  Lara wordmark + photo-stack opacity as a pure function of
  overall pin progress. Handles the initial fade-in, the long
  hold while photos animate + settle, and the fade-out right
  before the paragraph takes over.
*/
function sceneOpacity(progress) {
  if (progress <= WORDMARK_FADE_IN_END) {
    return clamp01(progress / WORDMARK_FADE_IN_END);
  }

  if (progress >= LARA_HOLD_END && progress <= LARA_EXIT_END) {
    return (
      1 -
      clamp01(
        (progress - LARA_HOLD_END) / (LARA_EXIT_END - LARA_HOLD_END)
      )
    );
  }

  if (progress > LARA_EXIT_END) {
    return 0;
  }

  return 1;
}

function paragraphContainerOpacity(progress) {
  if (progress < PARAGRAPH_CONTAINER_FADE_START) return 0;

  if (progress < PARAGRAPH_CONTAINER_FADE_END) {
    return clamp01(
      (progress - PARAGRAPH_CONTAINER_FADE_START) /
        (PARAGRAPH_CONTAINER_FADE_END - PARAGRAPH_CONTAINER_FADE_START)
    );
  }

  return 1;
}

/*
  Returns the fully resolved visual state for ONE scattered
  photo at the current pin progress. Pure function — no timers,
  no framer-motion `duration`, so it can never fall out of sync
  with the scrollbar.
*/
function getPhotoState(photo, range, progress) {
  const localT = clamp01((progress - range.start) / (range.end - range.start));
  const eased = easeInOutCubic(localT);

  // Quick fade-in right at the photo's own start so it doesn't
  // hard-pop into existence; stays at 1 for the rest of its life
  // (including after it has finished, so it remains visible while
  // the NEXT photo animates in).
  const hasAppeared = progress >= range.start;
  const fadeIn = clamp01((progress - range.start) / 0.02);
  const opacity = hasAppeared ? fadeIn : 0;

  let startX = 0;
  let startY = 0;

  if (photo.enterDirection === "left") startX = -PHOTO_ENTER_SIDE_DISTANCE;
  if (photo.enterDirection === "right") startX = PHOTO_ENTER_SIDE_DISTANCE;
  if (photo.enterDirection === "bottom") startY = PHOTO_ENTER_SIDE_DISTANCE;

  const x = lerp(startX, photo.finalX, eased);
  const y = lerp(startY, photo.finalY, eased);
  const scale = lerp(PHOTO_ENTER_START_SCALE, 1, eased);

  const spinOffset =
    photo.enterDirection === "left"
      ? -PHOTO_ENTER_SPIN_OFFSET
      : PHOTO_ENTER_SPIN_OFFSET;

  const finalRotate = -photo.figmaAngle; // Figma CCW+ → CSS CW+
  const startRotate = finalRotate + spinOffset;
  const rotate = lerp(startRotate, finalRotate, eased);

  return { opacity, x, y, scale, rotate };
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

  return { result, totalWords: globalIndex };
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
    quote: "The fit was beautiful and the finishing was even better in person.",
    name: "Nora E.",
  },
  {
    quote:
      "I loved being able to choose the colour and get something made specifically for me.",
    name: "Zainab A.",
  },
];


/* ============================================================
   FIGMA PHOTO POSITIONS (unchanged from your spec)
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
   WORDMARK / LAYOUT
   ============================================================ */

const WORDMARK_CONTAINER_WIDTH = "clamp(760px, 56vw, 1080px)";
const PHOTO_WIDTH_PX = 175.6;
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";


/* ============================================================
   ONE-TIME PAGE VISIT STATE
   ============================================================

   Module-level, on purpose: this resets on a real page refresh
   (module reloads) but is NOT affected by scrolling up/down or
   navigating around the site within the same tab.
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
    IMPORTANT DISTINCTION:

    - renderCompactFromStart: true only if the flag was ALREADY
      set when this component mounted (e.g. you finished the
      animation earlier, then navigated back to this page). In
      that case we skip straight to the lightweight static
      markup — no tall scroll track needed at all.

    - liveCompleted: becomes true once scrolling REACHES the end
      of the animation during THIS mount. This does NOT stop the
      scroll-tracking loop and does NOT swap the DOM structure —
      it only clamps `p` (the value passed into every opacity /
      transform calculation) to 1, so the word-by-word reveal and
      photo entrances can't replay. pinState keeps being
      recalculated for as long as the component is mounted, in
      both scroll directions, which is what lets Lara/the
      paragraph correctly reappear when you scroll back up.
  */
  const [renderCompactFromStart] = useState(
    () => showcaseCompletedThisPageVisit
  );

  const [progress, setProgress] = useState(renderCompactFromStart ? 1 : 0);

  const [pinState, setPinState] = useState(
    renderCompactFromStart ? "after" : "before"
  );

  const [liveCompleted, setLiveCompleted] = useState(false);

  const [reduceMotion, setReduceMotion] = useState(false);

  const { result: wordParagraphs, totalWords } = useMemo(
    () => buildWordParagraphs(PARAGRAPHS),
    []
  );

  /* -------------------- reduced motion -------------------- */

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);

    const onChange = (event) => setReduceMotion(event.matches);
    mq.addEventListener?.("change", onChange);

    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  /* -------------------- measure + scroll track -------------------- */

  useEffect(() => {
    // TIP: liveCompleted is intentionally NOT in this condition.
    // We still want to keep tracking scroll position forever after
    // the reveal completes — see the liveCompleted note above for why.
    if (renderCompactFromStart || reduceMotion) return;

    const measure = () => {
      if (contentRef.current) {
        contentHeightRef.current = contentRef.current.offsetHeight;
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);

    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    const tick = () => {
      const wrapper = wrapperRef.current;

      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const contentHeight = contentHeightRef.current;
        const pinnableRange = rect.height - contentHeight;

        let nextState;
        let next;

        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";

          // Soft pre-roll: instead of snapping straight from 0%
          // opacity to pinned, start easing Lara in during the
          // last stretch of normal scroll before the section
          // reaches the navbar — removes the blank-screen gap
          // between the Hero section and Lara appearing.
          const approachWindow = window.innerHeight * 0.8;
          const distanceToEngage = rect.top - NAVBAR_HEIGHT_PX;
          const approachT = clamp01(1 - distanceToEngage / approachWindow);
          next = approachT * WORDMARK_FADE_IN_END;
        } else if (rect.bottom <= NAVBAR_HEIGHT_PX + contentHeight) {
          nextState = "after";
          next = 1;
          afterTopRef.current = Math.max(0, rect.height - contentHeight);
        } else {
          nextState = "pinned";
          next =
            pinnableRange > 0
              ? clamp01((NAVBAR_HEIGHT_PX - rect.top) / pinnableRange)
              : 1;
        }

        // TIP: this ALWAYS runs, every frame, regardless of RELEASE_AT.
        // pinState must keep tracking real scroll position forever so
        // scrolling back up correctly re-pins Lara/the paragraph.
        setPinState((previous) => (previous === nextState ? previous : nextState));
        setProgress(next);

        // This only ever flips false → true, once, and does NOT stop
        // the loop above. It just tells the render below to clamp `p`
        // to 1 so the reveal doesn't replay.
        if (next >= RELEASE_AT && !showcaseCompletedThisPageVisit) {
          showcaseCompletedThisPageVisit = true;
          setLiveCompleted(true);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [renderCompactFromStart, reduceMotion]);

  const p = reduceMotion || renderCompactFromStart || liveCompleted ? 1 : progress;

  const scene = sceneOpacity(p);
  const paragraphContainer = paragraphContainerOpacity(p);

  const paragraphWordsT = clamp01(
    (p - PARAGRAPH_WORDS_START) / (PARAGRAPH_WORDS_END - PARAGRAPH_WORDS_START)
  );

  /* ============================================================
     NORMAL FLOW — pin already finished
     ============================================================ */

  const laraAndParagraphStatic = (
    <div className={`w-full ${PAGE_CONTAINER_PADDING}`}>
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="relative flex items-center justify-center pb-10 pt-16 md:pb-14">
          <div className="relative w-full" style={{ maxWidth: WORDMARK_CONTAINER_WIDTH }}>
            <img
              src={laraDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ width: "100vw" }}
            />

            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="relative z-10 block h-auto w-full select-none"
            />

            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-20"
              style={{
                width: `${PHOTO_WIDTH_PX}px`,
                height: "103.72863006591797px",
                transform: "translate(-50%, -50%)",
              }}
            >
              {SCATTER_PHOTOS.map((photo) => (
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
                    transform: `rotate(${-photo.figmaAngle}deg)`,
                    transformOrigin: "50% 50%",
                    zIndex: photo.zIndex,
                    objectFit: "cover",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center pb-16 pt-6 md:pb-20">
          <div className="mx-auto max-w-2xl text-center text-[16px] leading-[1.7] text-[var(--ink)] md:max-w-3xl">
            {PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className={index === PARAGRAPHS.length - 1 ? "mt-8" : "mb-6"}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ============================================================
     REVIEWS — always normal flow, never pinned
     ============================================================ */

  const reviewsSection = (
    <section className={`w-full bg-[var(--cream)] pb-0 pt-16 md:pt-24 ${PAGE_CONTAINER_PADDING}`}>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <motion.div
            key={`${testimonial.name}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, y: 25 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, delay: (index % 3) * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={`min-h-[190px] border border-[var(--line)] bg-[var(--cream)] p-5 text-center ${
              index % 3 === 1 ? "lg:-translate-y-5" : ""
            }`}
          >
            <p className="mb-5 text-[15px] leading-[1.65] text-[var(--ink)]">
              "{testimonial.quote}"
            </p>

            <p className="flex items-center justify-center gap-1 text-sm font-bold text-[var(--ink)]">
              {testimonial.name}
              <span
                aria-hidden="true"
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-[9px] text-white"
              >
                ✓
              </span>
            </p>

            <p className="mt-1 text-xs text-[var(--muted)]">Verified Customer</p>
          </motion.div>
        ))}
      </div>
    </section>
  );

  /* ============================================================
     ALREADY COMPLETED ON MOUNT — lightweight static markup, no
     tall scroll track needed since there's nothing left to scrub.
     (This is NOT used when completion happens live mid-scroll —
     see the liveCompleted note above.)
     ============================================================ */

  if (renderCompactFromStart || reduceMotion) {
    return (
      <>
        <section className="w-full bg-[var(--cream)]">{laraAndParagraphStatic}</section>
        {reviewsSection}
      </>
    );
  }

  /* ============================================================
     ANIMATED PIN MODE (also covers the moment it finishes live,
     AND every scroll-up/scroll-down after that — the tall wrapper
     and DOM structure stay exactly the same, pinState just keeps
     flipping between "before" / "pinned" / "after" based on real
     scroll position, forever)
     ============================================================ */

  let containerStyle;

  if (pinState === "before") {
    containerStyle = { position: "relative", height: "100vh" };
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

  const layerBaseStyle = { position: "absolute", inset: 0 };

  return (
    <>
      <section
        ref={wrapperRef}
        className="relative w-full bg-[var(--cream)]"
        style={{ height: `${TRACK_VH}vh` }}
      >
        {/* TEMP DEBUG — remove once Lara is confirmed showing correctly */}
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 10,
            zIndex: 999,
            background: "black",
            color: "lime",
            padding: "8px 12px",
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          pinState: {pinState}
          <br />
          progress: {progress.toFixed(3)}
          <br />
          p: {p.toFixed(3)}
          <br />
          scene: {scene.toFixed(3)}
        </div>
        <div ref={contentRef} className="w-full bg-[var(--cream)]" style={containerStyle}>
          <div className="relative h-full w-full">
            {/* ======================= LARA + PHOTOS ======================= */}
            <div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: scene,
                pointerEvents: "none",
              }}
            >
              <div className="relative mx-auto w-full" style={{ maxWidth: WORDMARK_CONTAINER_WIDTH }}>
                <img
                  src={laraDecor}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
                  style={{ width: "100vw" }}
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
                    height: "103.72863006591797px",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {SCATTER_PHOTOS.map((photo, index) => {
                    const state = getPhotoState(photo, PHOTO_RANGES[index], p);

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
                          transformOrigin: "50% 50%",
                          objectFit: "cover",
                          opacity: state.opacity * scene,
                          transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale}) rotate(${state.rotate}deg)`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ======================= PARAGRAPH ======================= */}
            <div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: paragraphContainer,
                pointerEvents: "none",
              }}
            >
              <div className="mx-auto max-w-2xl text-center text-[16px] leading-[1.7] text-[var(--ink)] md:max-w-3xl">
                {wordParagraphs.map((words, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className={paragraphIndex === wordParagraphs.length - 1 ? "mt-8" : "mb-6"}
                  >
                    {words.map(({ word, index }) => {
                      const wordT = clamp01(
                        (paragraphWordsT - index / totalWords) / (1 / totalWords)
                      );

                      return (
                        <span key={index} style={{ opacity: wordT }}>
                          {word}{" "}
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {reviewsSection}
    </>
  );
}