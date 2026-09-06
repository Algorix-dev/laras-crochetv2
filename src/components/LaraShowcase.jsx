import { useEffect, useRef, useState } from "react";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   EASY DECORATION CONTROL
   ============================================================ */

const LARA_ARC_OPACITY = 1.0;

// This IS the real asset (no separate bold version exists) — so
// unlike last time, we do need the stronger contrast/saturate
// treatment to make the faint line art actually read.
const LARA_ARC_FILTER = "contrast(2.2) saturate(1.6)";

/* ============================================================
   SCROLL-SCRUBBED SEQUENCE — HOW THIS FILE WORKS
   ------------------------------------------------------------
   The whole section below is one tall "track" (TRACK_VH viewport-
   heights tall — see the constant). While the user is scrolling
   through that track, the actual visible content pins itself
   directly under the navbar (position: fixed) instead of scrolling
   normally, and a single 0→1 "progress" value — driven by how far
   through the track the user has scrolled — drives three
   sub-animations in sequence:

     1. PHOTOS  (progress 0.00-0.20): the 3 reference photos fly in
        from off-screen edges and scatter into place over the
        wordmark.
     2. STORY   (progress 0.24-0.66): the 4 brand-story paragraphs
        reveal word by word.
     3. REVIEWS (progress 0.70-1.00): the 9 testimonials fade in
        three at a time - first row, second row, last row.

   Once progress reaches 1, the content un-pins and the page
   continues scrolling normally into "Shop Our Pieces" below. This
   is done with the classic "tall spacer + position:fixed" pin
   technique: the section itself supplies the scroll distance, and
   a plain requestAnimationFrame loop (not scroll-event handlers,
   which fire inconsistently across browsers/devices) measures the
   section's position every frame to decide whether the content
   should render in normal flow (before pinning), fixed (while
   pinned), or detached back into normal flow at the bottom of the
   track (after pinning ends) - so it hands off to ordinary page
   scroll seamlessly on both ends.

   FAST SCROLLERS: raw scroll progress is smoothed (lerped a little
   toward its target every animation frame) rather than applied
   instantly, so a fast flick plays the sequence back at a quick but
   still-smooth pace instead of jump-cutting between stages. The
   track is also kept generously tall so there's real scroll
   distance for that smoothing to catch up in. This is a smoothing
   pass, not a hard scroll-lock - a genuinely violent flick can still
   outrun it, in which case it just snaps to wherever it should be.
   Actually locking scroll (capturing wheel/touch input so the page
   physically can't advance) would guarantee the sequence always
   plays in full, but breaks trackpad momentum, mobile scroll, and
   accessibility in ways that cost more goodwill than a fast section
   does, so it's intentionally not done here.

   Respects prefers-reduced-motion: if the user has that on, the
   whole pin/scrub is skipped and everything just renders fully
   revealed, in normal document flow.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66; // matches Navbar's h-[66px] sticky header
const TRACK_VH = 480;        // total scroll-track height, in vh - tune to make the story feel longer/shorter
const SMOOTHING = 0.12;      // 0-1: how fast displayed progress chases raw scroll progress each frame (lower = smoother but laggier)

const STAGE = {
  photosStart: 0.0,
  photosEnd: 0.2,
  paraStart: 0.24,
  paraEnd: 0.66,
  testiStart: 0.7,
  testiEnd: 1.0,
};

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ============================================================
   BRAND STORY
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

// Flattened word list, in reading order, with a running global index -
// used to compute how many words should be visible at a given progress.
let _wordCounter = 0;
const WORD_TOKENS = PARAGRAPHS.flatMap((paragraph, paraIndex) =>
  paragraph.split(" ").map((word) => ({
    word,
    paraIndex,
    globalIndex: _wordCounter++,
  }))
);
const TOTAL_WORDS = WORD_TOKENS.length;

/* ============================================================
   CUSTOMER TESTIMONIALS
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
      "Placeholder quote - swap this for a real customer testimonial.",
    name: "Customer Name",
  },
  {
    quote:
      "Placeholder quote - swap this for a real customer testimonial.",
    name: "Customer Name",
  },
  {
    quote:
      "Placeholder quote - swap this for a real customer testimonial.",
    name: "Customer Name",
  },
];

/* ============================================================
   SCATTER PHOTOS - final resting spot (matches the old static
   layout exactly) + where each one flies in from. final* values
   are in px, at the small overlay box's own scale. localStart/
   localEnd stagger each photo within the PHOTOS stage so they
   don't all arrive in lockstep.
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",
    zIndex: 3,
    finalX: -13,
    finalY: 8,
    finalRotate: 0,
    fromX: -520,
    fromY: -60,
    fromRotate: -35,
    localStart: 0.0,
    localEnd: 0.65,
  },
  {
    src: scatterStreet,
    alt: "Street-style portrait",
    zIndex: 2,
    finalX: 7,
    finalY: -8,
    finalRotate: 19.63,
    fromX: 540,
    fromY: 40,
    fromRotate: 70,
    localStart: 0.12,
    localEnd: 0.77,
  },
  {
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",
    zIndex: 1,
    finalX: 23,
    finalY: 10,
    finalRotate: -8.21,
    fromX: 60,
    fromY: 480,
    fromRotate: -60,
    localStart: 0.24,
    localEnd: 0.9,
  },
];

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const rawProgressRef = useRef(0);
  const smoothedProgressRef = useRef(0);
  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [pinState, setPinState] = useState("before"); // "before" | "pinned" | "after"
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // The pin/scrub loop itself.
  useEffect(() => {
    if (reduceMotion) return; // skip entirely - content just renders fully revealed, in flow

    const measure = () => {
      if (contentRef.current) {
        contentHeightRef.current = contentRef.current.offsetHeight;
      }
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
        let raw;

        if (rect.top > NAVBAR_HEIGHT_PX) {
          nextState = "before";
          raw = 0;
        } else if (rect.bottom <= NAVBAR_HEIGHT_PX + contentHeight) {
          nextState = "after";
          raw = 1;
          afterTopRef.current = Math.max(0, rect.height - contentHeight);
        } else {
          nextState = "pinned";
          raw =
            pinnableRange > 0
              ? clamp01((NAVBAR_HEIGHT_PX - rect.top) / pinnableRange)
              : 1;
        }

        rawProgressRef.current = raw;
        setPinState((prev) => (prev === nextState ? prev : nextState));
      }

      // Lerp the displayed progress toward the raw scroll-driven target -
      // this is the "fast scroller" smoothing described up top.
      const diff = rawProgressRef.current - smoothedProgressRef.current;
      if (Math.abs(diff) < 0.0008) {
        smoothedProgressRef.current = rawProgressRef.current;
      } else {
        smoothedProgressRef.current += diff * SMOOTHING;
      }
      setDisplayProgress(smoothedProgressRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reduceMotion]);

  const progress = reduceMotion ? 1 : displayProgress;

  const wordsRevealed = Math.floor(
    clamp01((progress - STAGE.paraStart) / (STAGE.paraEnd - STAGE.paraStart)) *
      TOTAL_WORDS
  );

  const testiLocal = clamp01(
    (progress - STAGE.testiStart) / (STAGE.testiEnd - STAGE.testiStart)
  );

  let containerStyle;
  if (reduceMotion || pinState === "before") {
    containerStyle = { position: "relative" };
  } else if (pinState === "pinned") {
    containerStyle = { position: "fixed", top: NAVBAR_HEIGHT_PX, left: 0, right: 0 };
  } else {
    containerStyle = { position: "absolute", top: afterTopRef.current, left: 0, right: 0 };
  }

  return (
    <section
      ref={wrapperRef}
      className="relative w-full bg-[var(--cream)]"
      style={reduceMotion ? undefined : { height: `${TRACK_VH}vh` }}
    >
      <div ref={contentRef} className="w-full bg-[var(--cream)]" style={containerStyle}>
        <div className="relative z-10 mx-auto max-w-4xl px-5 py-16 text-center md:py-24">
          {/* WORDMARK + SCATTER PHOTOS */}
          <div
            className="
              relative
              mx-auto
              mb-14
              w-full
              max-w-[560px]
              md:mb-20
              md:max-w-[720px]
            "
          >
            {/* Decoration - ONE full-bleed image, centered on this
                wrapper's center point via the left:50% + translate
                trick, so it stretches edge-to-edge across the whole
                viewport while still lining up on the wordmark. */}
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
                opacity: LARA_ARC_OPACITY,
                filter: LARA_ARC_FILTER,
              }}
            />

            {/* Wordmark - above the decoration */}
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
            />

            {/* SCATTER PHOTOS - fly in from off-screen and settle
                into place as progress advances through the PHOTOS
                stage. */}
            <div
              className="
                absolute
                left-1/2
                top-1/2
                z-20
                -translate-x-1/2
                -translate-y-1/2
                overflow-visible
              "
              style={{
                width: "clamp(90px, 14vw, 160px)",
                height: "clamp(65px, 10vw, 115px)",
              }}
            >
              {SCATTER_PHOTOS.map((photo) => {
                const localT = reduceMotion
                  ? 1
                  : clamp01(
                      (progress - photo.localStart) /
                        (photo.localEnd - photo.localStart)
                    );
                const eased = easeOutCubic(localT);
                const x = photo.fromX + (photo.finalX - photo.fromX) * eased;
                const y = photo.fromY + (photo.finalY - photo.fromY) * eased;
                const rot =
                  photo.fromRotate + (photo.finalRotate - photo.fromRotate) * eased;

                return (
                  <img
                    key={photo.alt}
                    src={photo.src}
                    alt={photo.alt}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: photo.zIndex,
                      opacity: eased,
                      transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                    }}
                    className="
                      rounded-[2px]
                      object-cover
                      shadow-md
                      ring-1
                      ring-[var(--cream)]
                    "
                  />
                );
              })}
            </div>
          </div>

          {/* BRAND STORY - reveals word by word as progress moves
              through the STORY stage. Each word is its own span so
              only the wording that "should" be visible at this
              progress fades in; the CSS transition on each span is
              what keeps a fast scroll's sudden jump in revealed-word-
              count from looking like a hard pop. */}
          <div
            className="
              relative
              mx-auto
              max-w-lg
              space-y-5
              text-sm
              leading-[1.8]
              text-[var(--ink)]
              md:text-base
            "
          >
            {PARAGRAPHS.map((paragraph, paraIndex) => {
              const tokens = WORD_TOKENS.filter((t) => t.paraIndex === paraIndex);
              return (
                <p key={paragraph}>
                  {tokens.map((token, i) => {
                    const visible = reduceMotion || token.globalIndex < wordsRevealed;
                    return (
                      <span
                        key={token.globalIndex}
                        style={{
                          opacity: visible ? 1 : 0,
                          transform: visible ? "translateY(0)" : "translateY(6px)",
                          transition: "opacity 0.35s ease, transform 0.35s ease",
                          display: "inline-block",
                        }}
                      >
                        {token.word}
                        {i < tokens.length - 1 ? "\u00A0" : ""}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>

          {/* TESTIMONIALS - reveal three at a time (first row, second
              row, last row) as progress moves through the REVIEWS
              stage. The zigzag offset on the middle column lives on
              an outer wrapper so it composes with, rather than gets
              overwritten by, the per-card reveal transform below. */}
          <div
            className="
              relative
              mt-16
              grid
              grid-cols-1
              gap-5
              sm:grid-cols-2
              md:mt-20
              md:grid-cols-3
            "
          >
            {TESTIMONIALS.map((testimonial, index) => {
              const row = Math.floor(index / 3);
              const rowLocalT = clamp01((testiLocal - row / 3) / (1 / 3));
              const eased = reduceMotion ? 1 : easeOutCubic(rowLocalT);

              return (
                <div
                  key={`${testimonial.name}-${index}`}
                  className={index % 3 === 1 ? "md:-translate-y-6" : ""}
                >
                  <div
                    style={{
                      opacity: eased,
                      transform: `translateY(${(1 - eased) * 18}px)`,
                      transition: "opacity 0.4s ease, transform 0.4s ease",
                    }}
                    className="
                      h-full
                      border
                      border-[var(--line)]
                      bg-[var(--cream)]
                      p-5
                      text-center
                    "
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}