import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   v4 CHANGES

   1. WORDMARK ZOOM-OUT: "Lara" now starts noticeably larger and
      shrinks down to its normal size as it settles in, instead of
      just fading in at one fixed size. Tied to the same
      wordmarkFadeT timeline the opacity already used.

   2. YARN GLOW: a soft pulsing glow sits behind the decor/wordmark
      art — same "alive, futuristic" language as the Hero podium's
      glow, done as an infinite breathing loop rather than a spin
      (nothing here rotates, so a spin didn't make sense — a pulse
      does the same "this is special" signaling).

   3. PHOTOS — BIG → SMALL, WITH SPIN, TIME-BASED: previously each
      photo's opacity/position was directly scrubbed from raw
      scroll position, which meant a fast scroll (or a jump to the
      bottom) could skip most of the animation. Now, once a photo's
      scroll-trigger point is crossed, it flips a one-way `entered`
      flag and animates via a fixed-duration transition instead —
      so once triggered, it always plays out in full over real time,
      no matter how the person continues to scroll. Also now starts
      oversized and rotated further from its final angle, easing
      down to size with a "settling" spin.

   4. PARAGRAPH — WORD BY WORD: replaced the single-block paragraph
      fade with a per-word reveal, each word getting its own small
      slice of the stage's enter timeline — reads like the words are
      "counting in" one after another rather than the whole
      paragraph fading together.

   5. REVIEWS: 6 → 9. The last 3 are placeholders (flagged below) —
      swap for real quotes before shipping.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;
const TRACK_VH = 420; // was 260 — too little scroll distance made the whole sequence (wordmark, paragraph, reviews) fly by too fast; raised so each stage gets more scroll to breathe. Tune further if still too fast/slow.

const STAGE = {
  wordmark: { start: 0.0, end: 0.3 },
  paragraph: { start: 0.35, end: 0.63 },
  testimonials: { start: 0.68, end: 1.0 },
};

const SLIDE_PHASES = { enterFrac: 0.55, holdFrac: 0.15, exitFrac: 0.3, travel: 70 };

// How long a triggered photo's entrance takes to play, in real time
// (ms) — independent of scroll speed once it starts.
const PHOTO_ENTER_DURATION_S = 1.2;
const PHOTO_ENTER_START_SCALE = 1.55; // "big" starting size
const PHOTO_ENTER_SPIN_OFFSET = 26;   // extra degrees added on top of final rotate, settles off as it enters

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function computeSlide(progress, start, end, { enterFrac, holdFrac, exitFrac, travel }) {
  const span = end - start;
  const local = clamp01((progress - start) / span);
  const enterEnd = enterFrac;
  const holdEnd = enterFrac + holdFrac;

  if (local <= enterEnd) {
    const enterT = enterFrac > 0 ? clamp01(local / enterFrac) : 1;
    const eased = easeOutCubic(enterT);
    return { opacity: eased, translateY: (1 - eased) * travel, enterT };
  }
  if (local <= holdEnd) {
    return { opacity: 1, translateY: 0, enterT: 1 };
  }
  const exitT = exitFrac > 0 ? clamp01((local - holdEnd) / exitFrac) : 1;
  const eased = easeOutCubic(exitT);
  return { opacity: 1 - eased, translateY: -eased * travel, enterT: 1 };
}

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",
  "We don't keep a stockroom.",
  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",
  "This isn't fast fashion. It's handmade, made with love.",
];

// Flattened word list with a global index, so reveal timing is
// continuous across all 4 paragraphs rather than resetting per
// paragraph.
function buildWordParagraphs(paragraphs) {
  let globalIndex = 0;
  const result = paragraphs.map((paragraph) =>
    paragraph.split(" ").map((word) => ({ word, index: globalIndex++ }))
  );
  return { result, totalWords: globalIndex };
}

const TESTIMONIALS = [
  { quote: "I've never had a piece fit this well straight out of the box. Literally made to my measurements. No alterations needed.", name: "Teniola Aladese" },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: "Tolu Coker" },
  { quote: "The bikini set held up through an entire beach trip. No stretching, no losing shape. Genuinely impressed.", name: "Halima Finny" },
  { quote: "The Reina dress is a whole moment. I get stopped every single time I wear it.", name: "Chidinma K." },
  { quote: "Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.", name: "Precious Ehizoge" },
  { quote: "Customer service walked me through sizing so patiently. Made ordering online feel less scary.", name: "Ejiro Okezie" },
  // PLACEHOLDER — replace with 3 real testimonials from Lara before shipping
  { quote: "[Placeholder review — swap for a real quote from Lara]", name: "Placeholder Name 1" },
  { quote: "[Placeholder review — swap for a real quote from Lara]", name: "Placeholder Name 2" },
  { quote: "[Placeholder review — swap for a real quote from Lara]", name: "Placeholder Name 3" },
];

const SCATTER_PHOTOS = [
  { id: "beach", src: scatterBeach, alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach", zIndex: 3, finalX: -18, finalY: 26, rotate: 0, enterStart: 0.2, enterEnd: 0.55 },
  { id: "street", src: scatterStreet, alt: "Street-style portrait", zIndex: 2, finalX: 10, finalY: -14, rotate: 19.63, enterStart: 0.4, enterEnd: 0.75 },
  { id: "teal", src: scatterTeal, alt: "Lara's Crochet customer wearing a teal crochet dress", zIndex: 1, finalX: 30, finalY: 34, rotate: -8.21, enterStart: 0.6, enterEnd: 1.0 },
];

const WORDMARK_FADE_ENTER_END = 0.22;
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before");
  const [reduceMotion, setReduceMotion] = useState(false);

  // Which photos have been triggered to enter (one-way per pass —
  // cleared when scrolled back above the stage so re-entering
  // replays it).
  const [enteredPhotos, setEnteredPhotos] = useState({});

  const { result: wordParagraphs, totalWords } = useMemo(
    () => buildWordParagraphs(PARAGRAPHS),
    []
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    const measure = () => {
      if (contentRef.current) contentHeightRef.current = contentRef.current.offsetHeight;
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);
    // Re-measure once images/fonts have actually loaded, in case
    // that shifts contentRef's natural size.
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
          next = 0;
        } else if (rect.bottom <= NAVBAR_HEIGHT_PX + contentHeight) {
          nextState = "after";
          next = 1;
          afterTopRef.current = Math.max(0, rect.height - contentHeight);
        } else {
          nextState = "pinned";
          next = pinnableRange > 0 ? clamp01((NAVBAR_HEIGHT_PX - rect.top) / pinnableRange) : 1;
        }

        setPinState((prev) => (prev === nextState ? prev : nextState));
        setProgress(next);
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
  }, [reduceMotion]);

  const p = reduceMotion ? 1 : progress;

  const wordmarkSlide = computeSlide(p, STAGE.wordmark.start, STAGE.wordmark.end, SLIDE_PHASES);
  const paragraphSlide = computeSlide(p, STAGE.paragraph.start, STAGE.paragraph.end, SLIDE_PHASES);
  const testimonialsSlide = computeSlide(p, STAGE.testimonials.start, STAGE.testimonials.end, SLIDE_PHASES);

  const wordmarkFadeT = reduceMotion
    ? 1
    : easeOutCubic(clamp01(wordmarkSlide.enterT / WORDMARK_FADE_ENTER_END));

  // Zoom-out scale for the wordmark: starts at 1.5x, eases to 1x
  // as wordmarkFadeT goes 0 -> 1.
  const wordmarkScale = reduceMotion ? 1 : 1.5 - 0.5 * wordmarkFadeT;

  // Trigger photo entrances (one-way, reset on scroll-back).
  useEffect(() => {
    if (reduceMotion) return;
    if (wordmarkSlide.enterT <= 0.02) {
      // Scrolled back above the stage — clear so it replays.
      setEnteredPhotos({});
      return;
    }
    setEnteredPhotos((prev) => {
      let changed = false;
      const next = { ...prev };
      SCATTER_PHOTOS.forEach((photo) => {
        if (!next[photo.id] && wordmarkSlide.enterT >= photo.enterStart) {
          next[photo.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [wordmarkSlide.enterT, reduceMotion]);

  let containerStyle;
  if (reduceMotion || pinState === "before") {
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
    containerStyle = { position: "absolute", top: afterTopRef.current, left: 0, right: 0, height: "100vh" };
  }

  const layerBaseStyle = {
    position: "absolute",
    inset: 0,
    transition: "opacity 0.4s ease, transform 0.4s ease",
  };

  return (
    <section
      ref={wrapperRef}
      className="relative w-full bg-[var(--cream)]"
      style={reduceMotion ? undefined : { height: `${TRACK_VH}vh` }}
    >
      <div ref={contentRef} className="w-full bg-[var(--cream)]" style={containerStyle}>
        <div className="relative h-full w-full">
          {/* ============================================================
              STAGE A — WORDMARK + PHOTOS
              ============================================================ */}
          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,
              opacity: reduceMotion ? 1 : wordmarkSlide.opacity,
              transform: reduceMotion ? "none" : `translateY(${wordmarkSlide.translateY}px)`,
              pointerEvents: wordmarkSlide.opacity > 0.5 ? "auto" : "none",
            }}
          >
            <div
              className="relative mx-auto w-full max-w-[720px] md:max-w-[920px]"
              style={{ opacity: wordmarkFadeT }}
            >
              {/* Glow — soft breathing pulse behind the decor/wordmark,
                  same "alive/selected" language as the Hero podium
                  glow, as a pulse instead of a spin since nothing here
                  rotates. */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: "min(60vw, 820px)",
                  aspectRatio: "1 / 1",
                  background:
                    "radial-gradient(circle, rgba(76,5,25,0.35), rgba(76,5,25,0.08) 55%, transparent 75%)",
                  filter: "blur(30px)",
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.5, 0.85, 0.5], scale: [0.94, 1.02, 0.94] }
                }
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              />

              <img
                src={laraDecor}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 z-0 max-w-none select-none -translate-x-1/2 -translate-y-1/2"
                style={{ width: "100vw" }}
              />
              <img
                src={laraWordmark}
                alt="Lara's Crochet"
                className="relative z-10 block h-auto w-full select-none pointer-events-none"
                style={{ transform: `scale(${wordmarkScale})`, transformOrigin: "50% 50%" }}
              />

              <div
                className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-visible"
                style={{ width: "clamp(200px, 30vw, 360px)", height: "clamp(145px, 22vw, 260px)" }}
              >
                {SCATTER_PHOTOS.map((photo) => {
                  const entered = reduceMotion || !!enteredPhotos[photo.id];
                  return (
                    <motion.img
                      key={photo.id}
                      src={photo.src}
                      alt={photo.alt}
                      initial={false}
                      animate={
                        entered
                          ? { opacity: 1, scale: 1, x: photo.finalX, y: photo.finalY, rotate: photo.rotate }
                          : {
                              opacity: 0,
                              scale: PHOTO_ENTER_START_SCALE,
                              x: photo.finalX,
                              y: photo.finalY,
                              rotate: photo.rotate + PHOTO_ENTER_SPIN_OFFSET,
                            }
                      }
                      transition={{ duration: PHOTO_ENTER_DURATION_S, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: photo.zIndex,
                      }}
                      className="rounded-[4px] object-cover shadow-lg ring-2 ring-[var(--cream)]"
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================
              STAGE B — PARAGRAPH — word by word
              ============================================================ */}
          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,
              opacity: reduceMotion ? 0 : paragraphSlide.opacity,
              transform: reduceMotion ? "none" : `translateY(${paragraphSlide.translateY}px)`,
              pointerEvents: paragraphSlide.opacity > 0.5 ? "auto" : "none",
            }}
          >
            <div className="mx-auto max-w-3xl space-y-6 text-center text-xl leading-relaxed text-[var(--ink)] md:text-3xl md:leading-[1.5]">
              {wordParagraphs.map((words, pIndex) => (
                <p key={pIndex}>
                  {words.map(({ word, index }) => {
                    const wordT = reduceMotion
                      ? 1
                      : clamp01(
                          (paragraphSlide.enterT - index / totalWords) / (1 / totalWords)
                        );
                    return (
                      <span
                        key={index}
                        style={{
                          opacity: wordT,
                          transition: "opacity 0.15s linear",
                        }}
                      >
                        {word}{" "}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          </div>

          {/* ============================================================
              STAGE C — TESTIMONIALS
              ============================================================ */}
          <div
            className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
            style={{
              ...layerBaseStyle,
              opacity: reduceMotion ? 0 : testimonialsSlide.opacity,
              transform: reduceMotion ? "none" : `translateY(${testimonialsSlide.translateY}px)`,
              pointerEvents: testimonialsSlide.opacity > 0.5 ? "auto" : "none",
            }}
          >
            <div className="grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {TESTIMONIALS.map((testimonial, index) => (
                <div
                  key={testimonial.name}
                  className={`h-full border border-[var(--line)] bg-[var(--cream)] p-6 text-center ${
                    index % 3 === 1 ? "md:-translate-y-6" : ""
                  }`}
                >
                  <p className="mb-4 text-base leading-relaxed text-[var(--ink)]">"{testimonial.quote}"</p>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}