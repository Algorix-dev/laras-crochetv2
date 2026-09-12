import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.webp";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.webp";
import laraDecor from "../assets/decor/lara-decor-composite.png";

/* ============================================================
   LARA SHOWCASE
   ============================================================

   ONE continuous pinned scroll-scrub, in order:

     wordmark → 3 scattered photos → paragraph (word-by-word)
     → reviews, shown 3 at a time → pin releases

   - progress is derived directly from scroll position
   - every visual value (opacity/scale/x/y/rotate/word-reveal/
     review-card-reveal) is a pure function of that progress, so
     it can never desync from the scrollbar like a wall-clock
     animation can
   - photos enter ONE AT A TIME, big → small, very slowly
   - once photos are done, Lara fades out and the paragraph
     fades in and reveals word-by-word, then holds
   - the paragraph then cross-fades into the first batch of 3
     reviews (same slow, scroll-scrubbed technique — no
     whileInView, no wall-clock duration); each batch holds,
     then cross-fades into the next batch of 3, all the way
     through every review
   - only once the last batch has faded out does the pin
     release, handing off to normal scroll flow — whatever
     App.jsx renders next (the "Go to Shop" CTA / Shop section)
     picks up immediately, no extra gap

   ONE-TIME-ONLY BEHAVIOR:
   - a module-level flag remembers that the pin animation
     finished for this page visit
   - once the reveal completes LIVE during a mount, the whole
     component permanently swaps to the lightweight static
     markup (see `liveCompleted`) — no more pin, no more fixed
     positioning, no more scroll tracking for this section at all
   - a full page refresh does reset it (module reloads, flag resets)

   SCROLL-POSITION FIX ON LIVE COMPLETION:
   - the instant `liveCompleted` flips true, the tall TRACK_VH
     wrapper collapses into short static markup. That's a huge,
     sudden drop in total document height, and the browser will
     silently clamp scrollY to fit — which used to throw you
     straight past the compact Lara section.
   - `pendingScrollFixRef` captures where the section ITSELF sits
     in the document (window.scrollY + the wrapper's top, right as
     completion is detected inside tick()) — not the user's
     scrollY at that instant. A useLayoutEffect (fires before
     paint) then scrolls to just below that anchor once the swap
     has committed.
   - anchoring to the section's own position, instead of trying to
     preserve the user's exact scroll fraction via a height-delta
     calc, is what makes this robust to a fast/fling scroll: it
     doesn't matter how far past the release point the fling
     carried them, they land in the same sane spot (right at the
     top of the compact section) instead of occasionally overshooting
     clean past Shop and into the footer.
   ============================================================ */


/* ============================================================
   GENERAL SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  Scroll track for the WHOLE pinned sequence — wordmark, photos,
  paragraph, AND now the reviews (shown 3 at a time). Everything
  from Lara fading in to the last review batch fading out lives
  inside this one track. This number controls exactly how slow
  the whole pinned experience feels; bigger = slower.
*/
const TRACK_VH = 2000;


/* ============================================================
   PROGRESS MAP (fractions of the pin's 0 → 1 scroll progress)
   ============================================================

   All the wordmark/photo/paragraph breakpoints below are the
   exact same ABSOLUTE scroll distance as before (they're just
   expressed as smaller fractions now that TRACK_VH is bigger),
   so that part of the sequence still feels exactly as slow as
   it always did. Everything from 0.594 onward is new: the
   paragraph cross-fades into review batch 1, batch 1 holds then
   cross-fades into batch 2, batch 2 holds then cross-fades into
   batch 3, batch 3 holds then fades out — THEN the pin releases.

   0.00                                                                                          1.00
   |fade in|-photo1-|-photo2-|-photo3-|hold|exit|-----words-----|hold|--batch1--|--batch2--|--batch3--|
   0     0.018    0.126    0.234    0.342 .396 .432  .444     .564 .594      .714       .834      .954  .979 1.0
*/

const WORDMARK_FADE_IN_END = 0.018;

const PHOTO_RANGES = [
  { start: 0.018, end: 0.126 }, // back   (comes from bottom)
  { start: 0.126, end: 0.234 }, // middle (comes from left)
  { start: 0.234, end: 0.342 }, // front  (comes from right)
];

const LARA_HOLD_END = 0.396; // finished photo stack stays visible
const LARA_EXIT_END = 0.432; // Lara + photos fade out together

const PARAGRAPH_CONTAINER_FADE_START = 0.42;
const PARAGRAPH_CONTAINER_FADE_END = 0.438;

const PARAGRAPH_WORDS_START = 0.444;
const PARAGRAPH_WORDS_END = 0.564;

// Paragraph stays fully visible until this point, then cross-
// fades into the reviews grid over REVIEWS_CONTAINER_FADE_START →
// REVIEWS_CONTAINER_FADE_END (same start as this, so paragraph-out
// and reviews-in happen in the same window instead of a gap).
const PARAGRAPH_HOLD_END = 0.594;

const REVIEWS_CONTAINER_FADE_START = 0.594;
const REVIEWS_CONTAINER_FADE_END = 0.614;

// Reviews reveal 3 at a time (one grid row per step) — same
// "word by word" technique as the paragraph, just with a row of
// 3 cards standing in for a word. Once a row appears it STAYS
// visible (unlike the old batch version), so by REVEAL_END all 9
// are on screen together.
const REVIEWS_REVEAL_START = 0.62;
const REVIEWS_REVEAL_END = 0.72;

// All 9 reviews hold fully visible here — plenty of time to read
// them before anything moves again.
const REVIEWS_HOLD_END = 0.87;

// The whole grid (all 9, together — not card by card) fades out
// here. This is the "soft exit" before the pin releases: instead
// of the pin just cutting to normal scroll, everything gently
// disappears first, so the handoff to whatever comes next (Shop)
// feels deliberate instead of abrupt.
const REVIEWS_FADE_OUT_END = 0.92;

// 0.92 → 1.0 is a short hold on the empty stage after the fade,
// right before the pin releases into normal scroll flow.

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

  if (progress < PARAGRAPH_HOLD_END) return 1;

  // Cross-fades out exactly as the reviews grid fades in.
  if (progress < REVIEWS_CONTAINER_FADE_END) {
    return (
      1 -
      clamp01(
        (progress - REVIEWS_CONTAINER_FADE_START) /
          (REVIEWS_CONTAINER_FADE_END - REVIEWS_CONTAINER_FADE_START)
      )
    );
  }

  return 0;
}

/*
  Opacity for the reviews grid AS A WHOLE — fades in, holds while
  all 9 cards are visible and being individually revealed (see
  getReviewCardReveal below), then fades OUT as a single group.
  Deliberately one fade for all 9 together (not per-card) — this
  is the "soft exit" right before the pin releases.
*/
function reviewsContainerOpacity(progress) {
  if (progress < REVIEWS_CONTAINER_FADE_START) return 0;

  if (progress < REVIEWS_CONTAINER_FADE_END) {
    return clamp01(
      (progress - REVIEWS_CONTAINER_FADE_START) /
        (REVIEWS_CONTAINER_FADE_END - REVIEWS_CONTAINER_FADE_START)
    );
  }

  if (progress < REVIEWS_HOLD_END) return 1;

  if (progress < REVIEWS_FADE_OUT_END) {
    return (
      1 -
      clamp01((progress - REVIEWS_HOLD_END) / (REVIEWS_FADE_OUT_END - REVIEWS_HOLD_END))
    );
  }

  return 0;
}

const REVIEW_ROWS_COUNT = 3;
const REVIEW_CARD_RISE_PX = 28;

/*
  Reveal state for one ROW of 3 review cards (all 3 in the row
  share the same value — they appear together, "three by three").
  Same technique as the paragraph's word-by-word reveal: divide
  the reveal window into REVIEW_ROWS_COUNT equal steps and
  threshold against this row's own step. Once a row has appeared
  it stays at opacity 1 — rows never fade back out individually,
  only the whole grid does (via reviewsContainerOpacity).
*/
function getReviewRowReveal(rowIndex, progress) {
  const revealT = clamp01(
    (progress - REVIEWS_REVEAL_START) / (REVIEWS_REVEAL_END - REVIEWS_REVEAL_START)
  );
  const rowT = clamp01((revealT - rowIndex / REVIEW_ROWS_COUNT) / (1 / REVIEW_ROWS_COUNT));
  const y = lerp(REVIEW_CARD_RISE_PX, 0, easeInOutCubic(rowT));

  return { opacity: rowT, y };
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

// 9 testimonials → 3 rows of 3, all 3 in a row revealed together
// (see getReviewRowReveal) and all 9 ending up on screen at once.
const REVIEW_ROWS = [
  TESTIMONIALS.slice(0, 3),
  TESTIMONIALS.slice(3, 6),
  TESTIMONIALS.slice(6, 9),
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
  const pendingScrollFixRef = useRef(null);

  /*
    IMPORTANT DISTINCTION:

    - renderCompactFromStart: true only if the flag was ALREADY
      set when this component mounted (e.g. you finished the
      animation earlier, then navigated back to this page). In
      that case we skip straight to the lightweight static
      markup — no tall scroll track needed at all.

    - liveCompleted: becomes true once scrolling REACHES the end
      of the animation during THIS mount. The moment this flips,
      the component permanently swaps to the same lightweight
      static markup — no more pin, no more scroll tracking for
      this section, ever again during this mount. Scrolling back
      up afterward hits plain, non-animated static content.
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

  /* -------------------- scroll-position fix on live completion -------------------- */

  useLayoutEffect(() => {
    if (!liveCompleted || renderCompactFromStart) return;

    const pending = pendingScrollFixRef.current;
    if (!pending) return;

    // Land right at the top of the now-compact section (just below
    // the navbar) — regardless of how deep into the tall pin track
    // a fast/fling scroll had carried the user before this fired.
    // Anchoring to the section's own document position (captured
    // in tick(), below) rather than trying to preserve an exact
    // scroll fraction via a height-delta calc is what keeps a fast
    // scroll from skipping clean past Shop straight to the footer.
    window.scrollTo(0, Math.max(0, pending.wrapperTop - NAVBAR_HEIGHT_PX));

    pendingScrollFixRef.current = null;
  }, [liveCompleted, renderCompactFromStart]);

  /* -------------------- measure + scroll track -------------------- */

  useEffect(() => {
    // Once the reveal has completed live, this section becomes
    // permanent static content — no more pin, no more tracking.
    // Only a real page reload resets liveCompleted (and the
    // module-level flag), which starts a fresh mount with this
    // effect running again from scratch.
    if (renderCompactFromStart || reduceMotion || liveCompleted) return;

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

        setPinState((previous) => (previous === nextState ? previous : nextState));
        setProgress(next);

        if (next >= RELEASE_AT && !showcaseCompletedThisPageVisit) {
          pendingScrollFixRef.current = {
            wrapperTop: window.scrollY + rect.top,
          };
          showcaseCompletedThisPageVisit = true;
          setLiveCompleted(true);
          return; // stop here — the layout effect above takes over
                  // positioning once the compact markup commits
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
  }, [renderCompactFromStart, reduceMotion, liveCompleted]);

  const p = reduceMotion || renderCompactFromStart || liveCompleted ? 1 : progress;

  const scene = sceneOpacity(p);
  const paragraphContainer = paragraphContainerOpacity(p);
  const reviewsContainer = reviewsContainerOpacity(p);

  const paragraphWordsT = clamp01(
    (p - PARAGRAPH_WORDS_START) / (PARAGRAPH_WORDS_END - PARAGRAPH_WORDS_START)
  );

  /* ============================================================
     NORMAL FLOW — pin already finished
     ============================================================ */

  const laraAndParagraphStatic = (
    <div className={`w-full ${PAGE_CONTAINER_PADDING}`}>
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="relative flex items-center justify-center pb-10 pt-8 md:pb-14">
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
     REVIEWS — STATIC fallback only (compact/completed/reduced-
     motion path). While the pin is actually animating, reviews
     render inside the pinned track instead — see the "REVIEWS"
     layer further down, which uses getReviewRowReveal the exact
     same way this component uses opacity/word-reveal elsewhere.
     ============================================================ */

  const reviewsStatic = (
    <section className={`w-full bg-[var(--cream)] pb-0 pt-16 md:pt-24 ${PAGE_CONTAINER_PADDING}`}>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={`${testimonial.name}-${index}`}
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
          </div>
        ))}
      </div>
    </section>
  );

  /* ============================================================
     STATIC MARKUP — used both when already completed on mount
     AND the moment the reveal finishes live mid-scroll (and every
     scroll up/down after that during this mount).
     ============================================================ */

  if (renderCompactFromStart || reduceMotion || liveCompleted) {
    return (
      <>
        <section className="w-full bg-[var(--cream)]">{laraAndParagraphStatic}</section>
        {reviewsStatic}
      </>
    );
  }

  /* ============================================================
     ANIMATED PIN MODE — only runs before first completion
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

            {/* ======================= REVIEWS ======================= */}
            <div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: reviewsContainer,
                pointerEvents: "none",
              }}
            >
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
                {REVIEW_ROWS.map((row, rowIndex) => {
                  const { opacity, y } = getReviewRowReveal(rowIndex, p);

                  return row.map((testimonial, colIndex) => (
                    <div
                      key={testimonial.name}
                      className="min-h-[190px] border border-[var(--line)] bg-[var(--cream)] p-5 text-center"
                      style={{
                        opacity,
                        transform: `translateY(${y}px)`,
                      }}
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
                    </div>
                  ));
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}