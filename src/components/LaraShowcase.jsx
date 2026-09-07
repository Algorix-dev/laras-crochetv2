import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   EASY DECORATION CONTROL
   ============================================================ */

const LARA_ARC_OPACITY = 1.0;
const LARA_ARC_FILTER = "contrast(2.2) saturate(1.6)";

/* ============================================================
   SCROLL-SCRUBBED SEQUENCE — HOW THIS FILE WORKS (v2)
   ------------------------------------------------------------
   The whole section is one tall "track" (TRACK_VH viewport-heights
   tall). While scrolling through it, the content pins itself
   directly under the navbar (position: fixed), and a single 0->1
   "progress" value drives, in order:

     1. PHOTOS  — the 3 reference photos fly in from off-screen and
        scatter into place over the wordmark. They stay put for the
        rest of the sequence (no exit — only the STORY SLOT below
        swaps its contents).

     2. STORY SLOT — a single fixed-size region directly under the
        wordmark that TWO things take turns occupying:
          a. the brand-story paragraphs: reveal word by word, hold,
             then slide up + fade out as a whole block
          b. the testimonials: reveal three at a time (row by row),
             hold, then slide up + fade out as a whole block
        Because both live in the same slot (absolutely positioned,
        overlapping) rather than stacked one after another, "the
        paragraphs leave, then the reviews take their place" reads
        as a swap, not as one long scroll past two separate blocks.

   Once progress reaches 1, content un-pins and normal scrolling
   continues into "Shop Our Pieces" below.

   v2 FIXES vs the previous version:
   - The wordmark block no longer sits behind ~64-96px of top
     padding, so it now actually sits flush against the navbar the
     moment it pins (that padding was the "doesn't reach the bottom
     of the navbar" gap).
   - Paragraphs and testimonials each get their own enter -> hold ->
     exit cycle (via computeSlide below) instead of just fading in
     and staying — this is what makes them scroll up + fade away
     in turn, the way a slide deck advances.
   - The track is shorter (TRACK_VH) and the testimonials stage
     starts proportionally earlier, so a normal (non-fast) scroll
     actually reaches them — previously they sat so deep into an
     unnecessarily long track that an ordinary scroll session
     could end (and feel "finished") before ever reaching them.
   - Pin-state transitions now force the displayed progress to
     snap exactly to 0 or 1 the instant the section enters/leaves
     the pinned state, instead of letting the smoothed value trail
     behind — previously, a fast scroll could cause the section to
     physically un-pin (because that's driven by real scroll
     position) while the cosmetic progress was still lagging mid-
     sequence, so the tail end of the story played out AFTER the
     content had already scrolled out of view. This still keeps
     the "smooth catch-up" feel for the fast-scroll case in general
     (see SMOOTHING below) without ever leaving a stage stranded
     off-screen.

   Respects prefers-reduced-motion: skips the whole pin/scrub and
   renders everything already revealed, in normal document flow.
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66; // matches Navbar's h-[66px] sticky header
const TRACK_VH = 340;        // total scroll-track height, in vh — tune to make the story feel longer/shorter
const SMOOTHING = 0.14;      // 0-1: how fast displayed progress chases raw scroll progress each frame

const STAGE = {
  photosStart: 0.0,
  photosEnd: 0.16,
  paraStart: 0.18,
  paraEnd: 0.52,
  testiStart: 0.54,
  testiEnd: 0.92,
};

// How each STORY SLOT occupant divides its own local 0-1 window
// between entering, holding still (fully visible), and exiting.
const PARA_PHASES = { enterFrac: 0.5, holdFrac: 0.15, exitFrac: 0.35, travel: 46 };

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Maps an overall `progress` value, restricted to the [start, end]
// window, through enter -> hold -> exit. Returns:
//   opacity, translateY  — apply to the whole block's wrapper
//   enterT                — 0->1 across ENTER ONLY, then pinned at 1
//                            through hold/exit — feed this into any
//                            per-word/per-row reveal-count logic so
//                            it finishes entering and then just
//                            holds fully-revealed while the block
//                            itself fades/slides away as a unit.
//   exitT                  — 0 until exit begins, then 0->1 across
//                            EXIT ONLY — feed this into per-item
//                            stagger logic (e.g. testimonial rows
//                            leaving a beat apart instead of as one
//                            block) the same way enterT staggers
//                            entrances.
function computeSlide(progress, start, end, { enterFrac, holdFrac, exitFrac, travel }) {
  const span = end - start;
  const local = clamp01((progress - start) / span);
  const enterEnd = enterFrac;
  const holdEnd = enterFrac + holdFrac;

  if (local <= enterEnd) {
    const enterT = enterFrac > 0 ? clamp01(local / enterFrac) : 1;
    const eased = easeOutCubic(enterT);
    return { opacity: eased, translateY: (1 - eased) * travel, enterT, exitT: 0 };
  }
  if (local <= holdEnd) {
    return { opacity: 1, translateY: 0, enterT: 1, exitT: 0 };
  }
  const exitT = exitFrac > 0 ? clamp01((local - holdEnd) / exitFrac) : 1;
  const eased = easeOutCubic(exitT);
  return { opacity: 1 - eased, translateY: -eased * travel, enterT: 1, exitT };
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
  { quote: "I've never had a piece fit this well straight out of the box. Literally made to my measurements. No alterations needed.", name: "Teniola Aladese" },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: "Tolu Coker" },
  { quote: "The bikini set held up through an entire beach trip. No stretching, no losing shape. Genuinely impressed.", name: "Halima Finny" },
  { quote: "The Reina dress is a whole moment. I get stopped every single time I wear it.", name: "Chidinma K." },
  { quote: "Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.", name: "Precious Ehizoge" },
  { quote: "Customer service walked me through sizing so patiently. Made ordering online feel less scary.", name: "Ejiro Okezie" },
  { quote: "Placeholder quote - swap this for a real customer testimonial.", name: "Customer Name" },
  { quote: "Placeholder quote - swap this for a real customer testimonial.", name: "Customer Name" },
  { quote: "Placeholder quote - swap this for a real customer testimonial.", name: "Customer Name" },
];

/* ============================================================
   SCATTER PHOTOS
   ------------------------------------------------------------
   `productSlug`: set this to a real product's id/slug once Lara
   pairs each photo with an actual catalog item, and the photo
   becomes clickable — routes straight to that product's page. Left
   null for now (falls back to a plain, non-clickable image) since
   these are generic reference photos, not necessarily the exact
   garment shown in the seeded Shop products.
   ============================================================ */

const SCATTER_PHOTOS = [
  { src: scatterBeach, alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach", zIndex: 3, finalX: -13, finalY: 8, finalRotate: 0, fromX: -520, fromY: -60, fromRotate: -35, localStart: 0.0, localEnd: 0.11, productSlug: null },
  { src: scatterStreet, alt: "Street-style portrait", zIndex: 2, finalX: 7, finalY: -8, finalRotate: 19.63, fromX: 540, fromY: 40, fromRotate: 70, localStart: 0.02, localEnd: 0.135, productSlug: null },
  { src: scatterTeal, alt: "Lara's Crochet customer wearing a teal crochet dress", zIndex: 1, finalX: 23, finalY: 10, finalRotate: -8.21, fromX: 60, fromY: 480, fromRotate: -60, localStart: 0.045, localEnd: 0.16, productSlug: null },
];

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const paraSlideRef = useRef(null);
  const testiSlideRef = useRef(null);

  const rawProgressRef = useRef(0);
  const smoothedProgressRef = useRef(0);
  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const rafRef = useRef(null);

  const [displayProgress, setDisplayProgress] = useState(0);
  const [pinState, setPinState] = useState("before"); // "before" | "pinned" | "after"
  const [reduceMotion, setReduceMotion] = useState(false);
  const [slotHeight, setSlotHeight] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Measure the taller of paragraph/testimonial blocks so the shared
  // STORY SLOT is sized to whichever one needs more room — neither
  // block is clipped, and there's no dead space either.
  useEffect(() => {
    const paraHeightRef = { current: 0 };
    const testiHeightRef = { current: 0 };
    const recompute = () => {
      const h = Math.max(paraHeightRef.current, testiHeightRef.current);
      setSlotHeight((prev) => (prev == null || Math.abs(prev - h) > 1 ? h : prev));
    };
    const roPara = new ResizeObserver((entries) => {
      paraHeightRef.current = entries[0].contentRect.height;
      recompute();
    });
    const roTesti = new ResizeObserver((entries) => {
      testiHeightRef.current = entries[0].contentRect.height;
      recompute();
    });
    if (paraSlideRef.current) roPara.observe(paraSlideRef.current);
    if (testiSlideRef.current) roTesti.observe(testiSlideRef.current);
    return () => {
      roPara.disconnect();
      roTesti.disconnect();
    };
  }, []);

  // The pin/scrub loop itself.
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
          raw = pinnableRange > 0 ? clamp01((NAVBAR_HEIGHT_PX - rect.top) / pinnableRange) : 1;
        }

        rawProgressRef.current = raw;
        setPinState((prev) => (prev === nextState ? prev : nextState));

        // Snap instantly at the boundaries so a fast scroll can never
        // leave a stage stranded mid-animation just out of view; only
        // smooth (lerp) while actually pinned and mid-sequence.
        if (nextState === "before" || nextState === "after") {
          smoothedProgressRef.current = raw;
        } else {
          const diff = raw - smoothedProgressRef.current;
          smoothedProgressRef.current += Math.abs(diff) < 0.0008 ? diff : diff * SMOOTHING;
        }
        setDisplayProgress(smoothedProgressRef.current);
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

  const progress = reduceMotion ? 1 : displayProgress;

  const paraSlide = computeSlide(progress, STAGE.paraStart, STAGE.paraEnd, PARA_PHASES);
  const wordsRevealed = reduceMotion ? TOTAL_WORDS : Math.floor(paraSlide.enterT * TOTAL_WORDS);

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
        <div className="relative z-10 mx-auto max-w-4xl px-5 pt-4 pb-16 text-center md:pt-6 md:pb-24">
          {/* WORDMARK + SCATTER PHOTOS */}
          <div className="relative mx-auto mb-14 w-full max-w-[560px] md:mb-20 md:max-w-[720px]">
            <img
              src={laraDecor}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 z-0 max-w-none select-none -translate-x-1/2 -translate-y-1/2"
              style={{ width: "100vw", opacity: LARA_ARC_OPACITY, filter: LARA_ARC_FILTER }}
            />
            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="relative z-10 block h-auto w-full select-none pointer-events-none"
            />
            <div
              className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 overflow-visible"
              style={{ width: "clamp(90px, 14vw, 160px)", height: "clamp(65px, 10vw, 115px)" }}
            >
              {SCATTER_PHOTOS.map((photo) => {
                const localT = reduceMotion
                  ? 1
                  : clamp01((progress - photo.localStart) / (photo.localEnd - photo.localStart));
                const eased = easeOutCubic(localT);
                const x = photo.fromX + (photo.finalX - photo.fromX) * eased;
                const y = photo.fromY + (photo.finalY - photo.fromY) * eased;
                const rot = photo.fromRotate + (photo.finalRotate - photo.fromRotate) * eased;
                const photoStyle = {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: photo.zIndex,
                  opacity: eased,
                  transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                };

                // Clickable straight through to the product once Lara
                // pairs this photo with a real catalog item (see the
                // productSlug note above SCATTER_PHOTOS) — otherwise
                // it's just a plain, non-interactive image, same as
                // before.
                if (photo.productSlug) {
                  return (
                    <Link
                      key={photo.alt}
                      to={`/product/${photo.productSlug}`}
                      aria-label={`Shop this look — ${photo.alt}`}
                      style={{ ...photoStyle, display: "block", cursor: "pointer" }}
                      className="rounded-[2px] shadow-md ring-1 ring-[var(--cream)] transition-transform duration-200 hover:scale-[1.04]"
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="h-full w-full rounded-[2px] object-cover"
                      />
                    </Link>
                  );
                }

                return (
                  <img
                    key={photo.alt}
                    src={photo.src}
                    alt={photo.alt}
                    style={photoStyle}
                    className="rounded-[2px] object-cover shadow-md ring-1 ring-[var(--cream)]"
                  />
                );
              })}
            </div>
          </div>

          {/* PROGRESS INDICATOR — subtle cue that there's more coming
              after the paragraphs, so people don't stop scrolling
              early thinking the sequence is done (which is exactly
              what was happening before this was added). */}
          {!reduceMotion && (
            <div
              className="mb-8 flex items-center justify-center gap-2"
              aria-hidden="true"
            >
              {[
                { key: "photos", active: progress < STAGE.paraStart },
                { key: "story", active: progress >= STAGE.paraStart && progress < STAGE.testiStart },
                { key: "reviews", active: progress >= STAGE.testiStart },
              ].map((stage) => (
                <span
                  key={stage.key}
                  style={{
                    width: stage.active ? 18 : 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: "var(--maroon)",
                    opacity: stage.active ? 1 : 0.25,
                    transition: "width 0.3s ease, opacity 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* STORY SLOT — paragraphs and testimonials take turns
              occupying this exact same region. Both render at all
              times (so both can be measured for slotHeight and so
              neither pops in without a transition), but only one is
              ever meaningfully visible/opaque at a given progress. */}
          <div
            className="relative mx-auto"
            style={{ height: slotHeight != null ? `${slotHeight}px` : "auto", maxWidth: "42rem" }}
          >
            {/* PARAGRAPHS */}
            <div
              ref={paraSlideRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                opacity: reduceMotion ? 1 : paraSlide.opacity,
                transform: reduceMotion ? "none" : `translateY(${paraSlide.translateY}px)`,
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
              className="mx-auto max-w-lg space-y-5 text-sm leading-[1.8] text-[var(--ink)] md:text-base"
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

            {/* TESTIMONIALS — split into 3 sequential groups of 3,
                each getting its own dedicated slice of the REVIEWS
                stage (no more inter-row overlap/stagger — simpler,
                and it means only ONE group of 3 cards is EVER
                actually in the DOM at a time (see the opacity<0.02
                bail-out below), not all 9 sitting invisible in
                layout. That was the real cause of the mobile
                ballooning: with all 9 always mounted, a 1-column
                mobile layout was secretly reserving vertical space
                for all 9 stacked cards even though only 3 were ever
                meant to be visible, which both wasted a lot of
                blank space AND made the "only three" request not
                actually true underneath. */}
            <div ref={testiSlideRef} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
              {[0, 1, 2].map((groupIndex) => {
                const groupSpan = (STAGE.testiEnd - STAGE.testiStart) / 3;
                const groupStart = STAGE.testiStart + groupIndex * groupSpan;
                const groupEnd = groupStart + groupSpan;
                const groupSlide = reduceMotion
                  ? { opacity: 1, translateY: 0 }
                  : computeSlide(progress, groupStart, groupEnd, {
                      enterFrac: 0.4,
                      holdFrac: 0.25,
                      exitFrac: 0.35,
                      travel: 40,
                    });

                if (!reduceMotion && groupSlide.opacity < 0.02) return null;

                const group = TESTIMONIALS.slice(groupIndex * 3, groupIndex * 3 + 3);

                return (
                  <div
                    key={groupIndex}
                    style={{
                      opacity: groupSlide.opacity,
                      transform: `translateY(${groupSlide.translateY}px)`,
                      transition: "opacity 0.35s ease, transform 0.35s ease",
                    }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3"
                  >
                    {group.map((testimonial, i) => (
                      <div key={testimonial.name} className={i === 1 ? "md:-translate-y-6" : ""}>
                        <div className="h-full border border-[var(--line)] bg-[var(--cream)] p-5 text-center">
                          <p className="mb-4 text-sm leading-relaxed text-[var(--ink)]">"{testimonial.quote}"</p>
                          <p className="flex items-center justify-center gap-1 text-xs font-bold text-[var(--ink)]">
                            {testimonial.name}
                            <span
                              aria-hidden="true"
                              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-[9px] text-white"
                            >
                              ✓
                            </span>
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--muted)]">Verified Customer</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}