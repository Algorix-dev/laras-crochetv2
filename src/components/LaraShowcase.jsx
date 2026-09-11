import { useEffect, useRef, useState } from "react";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   SIMPLIFIED SCROLL SEQUENCE — HOW THIS FILE WORKS (v3)
   ------------------------------------------------------------
   Previous version did a LOT at once: photos flying in from off
   screen at custom angles, word-by-word paragraph reveals, 3
   staggered testimonial groups, and a smoothed/lerped progress
   value. Per feedback: strip that down to one simple idea repeated
   3 times — "a big slide fades in, holds, fades out," like a
   slideshow tied to scroll position — instead of a bunch of
   individual micro-animations:

     STAGE A — wordmark + decor fade in (centered), then the 3
               reference photos drop into place BIG, one after
               another (not all at once).
     STAGE B — the brand-story paragraph fades in, large, filling
               the screen.
     STAGE C — the testimonials fade in together, filling the
               screen.

   Each stage is a full-screen (position: absolute, inset: 0) layer
   stacked on the others; only one is ever meaningfully opaque at a
   time, so it reads as "this leaves, then that arrives," never two
   things overlapping. Once STAGE C finishes, the section un-pins
   and the page just continues scrolling normally into
   "Shop Our Pieces" below — no special exit animation, it simply
   becomes a normal part of the page from that point on.

   The section pins itself (position: fixed, directly under the
   navbar) while its track is being scrolled through, and un-pins
   the instant you scroll past it — that's the only "trick" left
   here. No smoothing/lerp — progress tracks real scroll position
   directly, so nothing can lag behind the scrollbar.

   Respects prefers-reduced-motion: skips the whole pin/scrub and
   renders everything already revealed, in normal document flow.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66; // matches Navbar's h-[66px] sticky header
const TRACK_VH = 260;        // total scroll-track height, in vh — tune to make it feel longer/shorter

// Each stage's slice of the overall 0->1 scroll progress. Gaps
// between them (0.30->0.35, 0.63->0.68) are deliberate — a brief
// beat of empty cream while one stage finishes leaving before the
// next arrives, so they never visually overlap.
const STAGE = {
  wordmark: { start: 0.0, end: 0.3 },
  paragraph: { start: 0.35, end: 0.63 },
  testimonials: { start: 0.68, end: 1.0 },
};

// How a stage divides its own local 0-1 window between entering,
// holding fully visible, and exiting.
const SLIDE_PHASES = { enterFrac: 0.55, holdFrac: 0.15, exitFrac: 0.3, travel: 70 };

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Maps `progress` restricted to [start, end] through enter -> hold
// -> exit and returns the numbers a whole block needs to fade in,
// sit still, then fade out. `enterT` (0->1 across ENTER ONLY, then
// held at 1) is exposed too, so things inside the block — like the
// 3 photos entering one by one — can stagger off the SAME timeline
// instead of running their own separate clock.
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

/* ============================================================
   BRAND STORY (one block — no more word-by-word reveal)
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",
  "We don't keep a stockroom.",
  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",
  "This isn't fast fashion. It's handmade, made with love.",
];

/* ============================================================
   CUSTOMER TESTIMONIALS — all fade in together as one grid now,
   instead of 3 sequential groups of 3.
   ============================================================ */

const TESTIMONIALS = [
  { quote: "I've never had a piece fit this well straight out of the box. Literally made to my measurements. No alterations needed.", name: "Teniola Aladese" },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: "Tolu Coker" },
  { quote: "The bikini set held up through an entire beach trip. No stretching, no losing shape. Genuinely impressed.", name: "Halima Finny" },
  { quote: "The Reina dress is a whole moment. I get stopped every single time I wear it.", name: "Chidinma K." },
  { quote: "Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.", name: "Precious Ehizoge" },
  { quote: "Customer service walked me through sizing so patiently. Made ordering online feel less scary.", name: "Ejiro Okezie" },
];

/* ============================================================
   SCATTER PHOTOS
   ------------------------------------------------------------
   TIP — POSITIONING vs FIGMA: the Figma export (Rectangle 51/52/53,
   inside the "L A R A" lockup group) has all 3 photos clustered very
   close to dead-center horizontally (offsets of roughly -1% to
   -0.5% of the lockup's width) and stacked slightly below center
   vertically, a bit further apart (roughly 12%-24% of the lockup's
   height), at rotations of 0deg / 19.63deg / -8.21deg. The translate
   values below are set to match that clustering (small, centered,
   gently stacked) rather than the old wide scatter — the px numbers
   are tuned against PHOTO_BOX's current size, so if you resize that,
   scale these roughly with it.
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",
    zIndex: 3,
    finalX: -18,
    finalY: 26,
    rotate: 0,
    enterStart: 0.2, // enters first
    enterEnd: 0.55,
  },
  {
    src: scatterStreet,
    alt: "Street-style portrait",
    zIndex: 2,
    finalX: 10,
    finalY: -14,
    rotate: 19.63,
    enterStart: 0.4, // enters second, slightly overlapping the first
    enterEnd: 0.75,
  },
  {
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",
    zIndex: 1,
    finalX: 30,
    finalY: 34,
    rotate: -8.21,
    enterStart: 0.6, // enters last
    enterEnd: 1.0,
  },
];

// The wordmark + decor fade in first, quickly, right at the start of
// STAGE A's enter phase — before any photo starts moving.
const WORDMARK_FADE_ENTER_END = 0.22;

// TIP — SHARED 304px MARGIN: same px-5 md:px-8 lg:px-[15.83%] class
// used in Navbar/Hero/ProductGrid/Footer, so this section's content
// lines up with everything above/below it.
const PAGE_CONTAINER_PADDING = "px-5 md:px-8 lg:px-[15.83%]";

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [pinState, setPinState] = useState("before"); // "before" | "pinned" | "after"
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // The pin/scrub loop — no smoothing/lerp anymore, progress just
  // tracks real scroll position directly each frame. Simpler, and
  // it means a stage can never "lag" behind where the scrollbar
  // actually is.
  useEffect(() => {
    if (reduceMotion) return;

    const measure = () => {
      if (contentRef.current) contentHeightRef.current = contentRef.current.offsetHeight;
    };
    measure();

    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);

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
    };
  }, [reduceMotion]);

  const p = reduceMotion ? 1 : progress;

  const wordmarkSlide = computeSlide(p, STAGE.wordmark.start, STAGE.wordmark.end, SLIDE_PHASES);
  const paragraphSlide = computeSlide(p, STAGE.paragraph.start, STAGE.paragraph.end, SLIDE_PHASES);
  const testimonialsSlide = computeSlide(p, STAGE.testimonials.start, STAGE.testimonials.end, SLIDE_PHASES);

  // Simple fade for the wordmark/decor lockup itself — finishes
  // well before the photos start entering.
  const wordmarkFadeT = reduceMotion
    ? 1
    : easeOutCubic(clamp01(wordmarkSlide.enterT / WORDMARK_FADE_ENTER_END));

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
    };
  } else {
    containerStyle = { position: "absolute", top: afterTopRef.current, left: 0, right: 0, height: "100vh" };
  }

  // Shared props for the 3 full-screen stage layers.
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
              />

              {/* Photos — BIG, entering one at a time. Each photo's own
                  enterStart/enterEnd is a slice of wordmarkSlide.enterT
                  (the stage's own enter timeline), so "one by one"
                  falls naturally out of the numbers rather than a
                  separate animation system. */}
              <div
                className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-visible"
                style={{ width: "clamp(200px, 30vw, 360px)", height: "clamp(145px, 22vw, 260px)" }}
              >
                {SCATTER_PHOTOS.map((photo) => {
                  const localT = reduceMotion
                    ? 1
                    : clamp01((wordmarkSlide.enterT - photo.enterStart) / (photo.enterEnd - photo.enterStart));
                  const eased = easeOutCubic(localT);
                  const dropFrom = -60; // drops down a short distance into place — big and simple, no fly-in from off-screen
                  const style = {
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: photo.zIndex,
                    opacity: eased,
                    transform: `translate(${photo.finalX}px, ${photo.finalY + (1 - eased) * dropFrom}px) rotate(${photo.rotate}deg)`,
                  };
                  return (
                    <img
                      key={photo.alt}
                      src={photo.src}
                      alt={photo.alt}
                      style={style}
                      className="rounded-[4px] object-cover shadow-lg ring-2 ring-[var(--cream)]"
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================================
              STAGE B — PARAGRAPH — big, fills the screen, one block
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
            <div className="mx-auto max-w-3xl space-y-6 text-xl leading-relaxed text-[var(--ink)] md:text-3xl md:leading-[1.5]">
              {PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* ============================================================
              STAGE C — TESTIMONIALS — all fade in together, fills the
              screen, then the section un-pins into normal scroll.
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
