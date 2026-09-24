import { Fragment, useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.webp";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.webp";
import laraDecor from "../assets/decor/lara-decor-composite.png";
import { useNavbarVisibility } from "../context/NavbarVisibilityContext";

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

   SEAMLESS HAND-OFF (replaces the old "scroll-position fix"):
   - the pinned track is now sized to END exactly when the last
     review is revealed (TIMELINE_END below). There is no fade-out
     and no empty "hold" stage any more — the reviews simply stay on
     screen and scroll away in normal flow when the pin releases, with
     the next section (Go to Shop / Shop Our Pieces) directly under
     them (see `tailOverlap`).
   - the swap to the light static markup is DELAYED until the whole
     track has scrolled out of sight above the viewport, so the user
     never sees it happen. The document just got shorter above the
     viewport, so we subtract exactly that height difference from
     scrollY (see the useLayoutEffect) — the page underneath doesn't
     move a pixel. No more forced jump to a "sane spot".

   NAVBAR VISIBILITY:
   - while this section is actively pinned and scrubbing
     (pinState === "pinned"), the shared NavbarVisibilityContext
     is told to hide the navbar entirely. Before the section is
     reached, after the pin releases, or once the sequence has
     already completed once (liveCompleted / renderCompactFromStart
     / reduceMotion), the navbar is shown again — see the effect
     below, and Navbar.jsx for how it reacts to this.
   ============================================================ */


/* ============================================================
   GENERAL SETTINGS
   ============================================================ */

const NAVBAR_HEIGHT_PX = 66;

/*
  TIP — svh, NOT vh (mobile fix):
  On phones, 100vh is the height with the browser's address bar HIDDEN, so
  a pinned box sized 100vh is taller than what you can actually see while
  the bar is showing (its bottom - and whatever is centred in it - ends up
  under the toolbar), and it jumps every time the bar slides away. 100svh
  is the always-visible height and never changes while scrolling. Browsers
  too old to know svh fall back to vh.
*/
const VH_UNIT =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("height", "100svh")
    ? "svh"
    : "vh";


/*
  TIP — HOW THE TIMELINE IS MEASURED:
  Every breakpoint below is a fraction of "progress". Progress runs from
  0 (the section starts sliding into view) to TIMELINE_END (the last
  review has been revealed and the pin lets go). One unit of progress
  is worth ~900vh of scrolling, so 0.001 ≈ 0.9vh. To make a stage
  slower, give it a wider range; to make it faster, a narrower one.
  You never have to touch TRACK_VH by hand — it is derived from
  TIMELINE_END so the track always ends exactly when the animation does.
*/

/* ============================================================
   PROGRESS MAP
   ============================================================

   Stages now OVERLAP on purpose (that is what removes the "breaks"):

   0        .05                                                      .70
   |approach |----------------- pinned scrolling ----------------------|
   Lara fades in ▓▓░
   photo 1        ▓▓▓▓▓▓
   photo 2               ▓▓▓▓▓▓▓
   photo 3                      ▓▓▓▓▓▓▓
   Lara+photos                        ─── hold ─── ░░ fade out
   paragraph letters                                 ▓▓▓▓▓▓▓▓▓▓ (starts WHILE Lara fades)
   paragraph out / reviews in                                    ░░░▓▓
   review rows                                                     ▓▓▓▓▓▓
   release ─────────────────────────────────────────────────────────────┘
*/

// Pre-roll: the stretch of NORMAL scrolling (before the section pins)
// that is already part of the animation. Lara fades in and photo 1
// starts flying in during it, so by the time Lara reaches the middle
// the first photo is already mid-flight — the animation "just
// continues" instead of starting from zero at the pin.
const PRE_ROLL_END = 0.05;

const WORDMARK_FADE_IN_START = 0.06;
const WORDMARK_FADE_IN_END = 0.09;

const PHOTO_RANGES = [
  { start: 0.008, end: 0.116 }, // back   (comes from bottom) — starts during the approach
  { start: 0.116, end: 0.224 }, // middle (comes from left)
  { start: 0.224, end: 0.332 }, // front  (comes from right)
];

// Photo stack sits complete for a short beat, then Lara + photos fade.
const LARA_HOLD_END = 0.372;
const LARA_EXIT_END = 0.408;

// TIP: the paragraph now starts at the SAME moment Lara starts to fade
// (LARA_HOLD_END), not after she has finished — the letters begin
// rising while Lara is still dissolving. Push these later for a gap,
// earlier for more overlap.
const PARAGRAPH_CONTAINER_FADE_START = 0.372;
const PARAGRAPH_CONTAINER_FADE_END = 0.392;

const PARAGRAPH_WORDS_START = 0.372;
const PARAGRAPH_WORDS_END = 0.492;

// Paragraph cross-fades into the reviews in the SAME window, and that
// window opens just as the last letters are settling — so there is
// never a moment with nothing on screen.
const PARAGRAPH_HOLD_END = 0.505;

const REVIEWS_CONTAINER_FADE_START = 0.505;
const REVIEWS_CONTAINER_FADE_END = 0.535;

// Review rows rise one row (3 cards) at a time, starting right as they
// fade in. Once a row is up it stays up.
const REVIEWS_REVEAL_START = 0.51;
const REVIEWS_REVEAL_END = 0.62;

// Everything from REVIEWS_REVEAL_END to here is a plain read-time hold
// with all 9 reviews visible. When progress reaches this value the pin
// releases and the reviews scroll away in normal flow. There is NO
// fade-out and NO empty stage after it.
const TIMELINE_END = 0.74;

// PHONES ONLY: the last of the three review rows finishes its turn here
// (rows take turns between REVIEWS_REVEAL_START and this point, and the
// last row then holds until TIMELINE_END). Desktop doesn't use it.
const REVIEWS_HOLD_END = 0.70;

// Scroll track length, derived so the pin releases exactly at
// TIMELINE_END (100vh stage + 900vh-per-unit of progress).
const TRACK_VH = Math.round(100 + 900 * TIMELINE_END);

// PHONES: only ONE row of three reviews is shown (nine cards don't fit a
// phone screen, and Lara only wants three there), so the pinned track ends
// sooner instead of holding an empty stretch. Raise it for a longer read time.
const TIMELINE_END_NARROW = 0.75;
const TRACK_VH_NARROW = Math.round(100 + 900 * TIMELINE_END_NARROW);

// Gap kept between the last review row and whatever comes next.
const TAIL_BREATHING_PX = 56;

// The static swap waits until the whole track is this far above the
// viewport, so it can never be seen.
const COMPLETE_MARGIN_PX = 80;


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
  // TIP — "SHIFTED DOWN" PER FEEDBACK: this used to fade in from
  // progress 0 (the very start of the pre-roll — see PRE_ROLL_END
  // above), finishing at just 0.012, so LARA was already fully
  // visible while the previous section (the Hero models) was likely
  // still on screen. It now stays invisible until
  // WORDMARK_FADE_IN_START (just after the 0.05 pre-roll ends, so
  // it can't appear before the section has actually started
  // pinning), then fades in over a short window to
  // WORDMARK_FADE_IN_END. Push WORDMARK_FADE_IN_START later still if
  // it's still visible too soon; pull it earlier if there's now an
  // awkward empty gap after the models before LARA appears.
  // NOTE: PHOTO_RANGES[0] (the first scattered photo) still starts
  // flying in at 0.008, unchanged — the original design had it
  // already mid-flight by the time LARA finished fading in. Delaying
  // only the wordmark may leave that first photo animating a beat
  // before LARA appears; nudge PHOTO_RANGES[0].start later too if
  // that now looks out of sync.
  if (progress <= WORDMARK_FADE_IN_START) {
    return 0;
  }

  if (progress <= WORDMARK_FADE_IN_END) {
    return clamp01(
      (progress - WORDMARK_FADE_IN_START) /
        (WORDMARK_FADE_IN_END - WORDMARK_FADE_IN_START)
    );
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
  Opacity for the reviews grid AS A WHOLE — fades in while the paragraph
  fades out, then simply STAYS at 1. (It used to fade out again and leave
  an empty stage before the pin released; now the reviews just scroll
  away naturally when the pin lets go.)
*/
function reviewsContainerOpacity(progress) {
  if (progress < REVIEWS_CONTAINER_FADE_START) return 0;

  if (progress < REVIEWS_CONTAINER_FADE_END) {
    return clamp01(
      (progress - REVIEWS_CONTAINER_FADE_START) /
        (REVIEWS_CONTAINER_FADE_END - REVIEWS_CONTAINER_FADE_START)
    );
  }

  return 1;
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
  PHONES (below 640px): nine cards stacked in one column are ~1,900px tall,
  but the pinned stage is only one screen high, so most of them ended up
  off-screen and unreadable. On a narrow screen the reviews are therefore
  shown ONE ROW OF 3 AT A TIME instead: each row fades/rises in, holds, and
  fades out as the next row takes its place (the last row stays until the
  whole grid fades out, like on desktop). Same scroll window as desktop
  (REVIEWS_REVEAL_START -> REVIEWS_HOLD_END), just split into 3 turns.
*/
function getReviewRowRevealNarrow(progress, rowIndex = 0) {
  // TIP: phones show SIX reviews (client request) as TWO turns of 3.
  // Turn 1 rises in, holds, then fades while turn 2 rises in over it;
  // turn 2 then stays until the pin lets go.
  //   turn 1: in  REVIEWS_REVEAL_START -> +0.045, out at PHONE_TURN_AT
  //   turn 2: in  at PHONE_TURN_AT, then stays
  // Change PHONE_TURN_AT to give the first three more/less reading time.
  const fade = 0.045;
  const PHONE_TURN_AT = REVIEWS_REVEAL_START + 0.11;

  if (rowIndex === 0) {
    const inT = clamp01((progress - REVIEWS_REVEAL_START) / fade);
    const outT = clamp01((progress - PHONE_TURN_AT) / fade);
    return {
      opacity: inT * (1 - outT),
      y: lerp(REVIEW_CARD_RISE_PX, 0, easeInOutCubic(inT)) - 10 * outT,
    };
  }

  const inT = clamp01((progress - PHONE_TURN_AT) / fade);
  return { opacity: inT, y: lerp(REVIEW_CARD_RISE_PX, 0, easeInOutCubic(inT)) };
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

// TIP: the paragraph is revealed WORD BY WORD, each word fading in from a
// little below its resting spot. (It was letter-by-letter with every letter
// flying up from the bottom of the screen; that read as a curved strand of
// spaghetti straightening out, so it went back to this calmer version.)
// Every paragraph becomes an array of words, and each word gets one global
// index across ALL four paragraphs so the wave runs continuously from the
// first word of paragraph 1 to the last word of paragraph 4.
function buildWordParagraphs(paragraphs) {
  let globalIndex = 0;

  const result = paragraphs.map((paragraph) =>
    paragraph.split(" ").map((word) => ({ word, globalIndex: globalIndex++ }))
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
   FIGMA PHOTO POSITIONS
   ============================================================

   Matched against the Figma CSS export's Rectangle 51/52/53:

     Rectangle 51 (back,   scatterStreet): rotate: none        → figmaAngle 0
     Rectangle 52 (middle, scatterBeach) : rotate: 19.63deg     → figmaAngle -19.63
     Rectangle 53 (front,  scatterTeal)  : rotate: -8.21deg     → figmaAngle 8.21

   (getPhotoState negates figmaAngle: finalRotate = -figmaAngle,
   since Figma's rotate() is already the CSS-space value, so
   figmaAngle needs to be the negation of the raw deg it shows.)

   finalX/finalY are each rectangle's `left`/`top` converted into
   an offset from the middle photo's own position (the code's
   existing 0,0 baseline), using Figma's left/top px values.
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    id: "back",
    src: scatterStreet,
    alt: "Street-style portrait",
    width: 175.59958036211256,
    height: 103.72863095475553,
    figmaAngle: 0,
    enterDirection: "bottom",
    zIndex: 1,
    finalX: -6.63,
    finalY: 26.5,
  },
  {
    id: "middle",
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",
    width: 175.59957885742188,
    height: 103.72863006591797,
    figmaAngle: -19.63,
    enterDirection: "left",
    zIndex: 2,
    finalX: 0,
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
    finalX: 0.11,
    finalY: 22.1,
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
   MOTION-VALUE PIECES
   ============================================================

   PERFORMANCE NOTE (this is the "it lags when I scroll" fix):

   The old version stored scroll progress in React state and ran
   a requestAnimationFrame loop forever — so EVERY frame it called
   setProgress(), re-rendering this whole component (all ~60 word
   spans, 3 photos, 9 review cards) 60 times a second, even when
   nothing had changed.

   Now progress is a framer-motion MotionValue. Setting it does NOT
   re-render React — each piece below subscribes to it directly and
   writes its own opacity/transform straight to the DOM. React only
   re-renders when the pin state actually changes (a few times per
   visit). Same math, same timings, no per-frame React work.
*/

// Each WORD animates over this fraction of the paragraph's scroll window;
// neighbouring words overlap into a soft wave.
// TIP: lower it (0.08) for a more obvious one-word-at-a-time ripple, raise
// it (0.18) for a softer, more blended wave.
const WORD_WINDOW = 0.12;

// How far below its resting spot each word starts. Small on purpose: the
// words should fade up into place, not travel. Raise it (30) for a bigger
// rise, lower it (10) for almost none.
const WORD_RISE_PX = 18;

function Word({ progress, globalIndex, totalWords, children }) {
  const t = useTransform(progress, (p) => {
    const rangeT = clamp01(
      (p - PARAGRAPH_WORDS_START) / (PARAGRAPH_WORDS_END - PARAGRAPH_WORDS_START)
    );
    const start = (globalIndex / totalWords) * (1 - WORD_WINDOW);
    return clamp01((rangeT - start) / WORD_WINDOW);
  });

  const y = useTransform(t, (v) => (1 - easeOutCubic(v)) * WORD_RISE_PX);

  // TIP: `inline-block`, NOT plain `inline`: CSS transforms (what framer's
  // `y` becomes) are ignored on non-replaced inline elements, so an inline
  // word would fade in but never actually rise.
  return (
    <motion.span className="inline-block" style={{ opacity: t, y }}>
      {children}
    </motion.span>
  );
}

function WordParagraph({ words, progress, totalWords, className }) {
  return (
    <p className={className}>
      {words.map(({ word, globalIndex }) => (
        <Fragment key={globalIndex}>
          <Word progress={progress} globalIndex={globalIndex} totalWords={totalWords}>
            {word}
          </Word>{" "}
        </Fragment>
      ))}
    </p>
  );
}


function ScatterPhoto({ photo, range, progress }) {
  const state = useTransform(progress, (p) => getPhotoState(photo, range, p));

  const opacity = useTransform(
    progress,
    (p) => getPhotoState(photo, range, p).opacity * sceneOpacity(p)
  );
  const x = useTransform(state, (s) => s.x);
  const y = useTransform(state, (s) => s.y);
  const scale = useTransform(state, (s) => s.scale);
  const rotate = useTransform(state, (s) => s.rotate);

  return (
    <motion.img
      src={photo.src}
      alt={photo.alt}
      decoding="async"
      className="absolute block select-none"
      style={{
        left: `${photo.finalX}px`,
        top: `${photo.finalY}px`,
        width: `${photo.width}px`,
        height: `${photo.height}px`,
        zIndex: photo.zIndex,
        transformOrigin: "50% 50%",
        objectFit: "cover",
        willChange: "transform, opacity",
        opacity,
        x,
        y,
        scale,
        rotate,
      }}
    />
  );
}

function ReviewCard({ testimonial, rowIndex, progress }) {
  const reveal = useTransform(progress, (p) => getReviewRowReveal(rowIndex, p));
  const opacity = useTransform(reveal, (r) => r.opacity);
  const y = useTransform(reveal, (r) => r.y);

  return (
    <motion.div
      className="min-h-[190px] border border-[var(--line)] bg-[var(--cream)] p-5 text-center"
      style={{ opacity, y }}
    >
      <ReviewCardBody testimonial={testimonial} />
    </motion.div>
  );
}

function ReviewCardBody({ testimonial, compact = false }) {
  return (
    <>
      <p
        className={`text-[var(--ink)] ${
          compact ? "mb-3 text-[13.5px] leading-[1.55]" : "mb-5 text-[15px] leading-[1.65]"
        }`}
      >
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
    </>
  );
}

// PHONES ONLY: one row of 3 cards, stacked, shown on its own turn (see
// getReviewRowRevealNarrow above). All three rows sit on top of each other
// and cross-fade.
function NarrowReviewRow({ row, rowIndex = 0, progress, innerRef }) {
  const reveal = useTransform(progress, (p) => getReviewRowRevealNarrow(p, rowIndex));
  const opacity = useTransform(reveal, (r) => r.opacity);
  const y = useTransform(reveal, (r) => r.y);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center gap-3"
      style={{ opacity, y }}
    >
      {/* TIP: wrapper only exists so the last row's real height can be
          measured (the row itself is a full-screen flex box). */}
      <div ref={innerRef} className="flex flex-col gap-3">
        {row.map((testimonial) => (
          <div
            key={testimonial.name}
            className="border border-[var(--line)] bg-[var(--cream)] p-4 text-center"
          >
            <ReviewCardBody testimonial={testimonial} compact />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Matches Tailwind's `sm` breakpoint (640px): below it the reviews grid is
// one column.
const NARROW_QUERY = "(max-width: 639px)";

function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const onChange = (event) => setIsNarrow(event.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return isNarrow;
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const contentHeightRef = useRef(0);
  const afterTopRef = useRef(0);
  const pendingScrollFixRef = useRef(null);
  const reviewsGridRef = useRef(null);
  const staticTopRef = useRef(null);
  const staticBottomRef = useRef(null);
  const tailOverlapRef = useRef(0);

  // TIP — NO EMPTY SPACE UNDER THE REVIEWS: the pinned stage is a full
  // screen tall with the reviews centred in it, so when the pin lets go
  // there is a band of empty stage under the last row. tailOverlap is that
  // band minus TAIL_BREATHING_PX, applied as a NEGATIVE bottom margin so
  // the next section slides up into the empty band and follows the
  // reviews directly.
  const [tailOverlap, setTailOverlap] = useState(0);

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

  // Scroll progress lives in a MotionValue, NOT React state — see
  // the MOTION-VALUE PIECES note above.
  const progress = useMotionValue(renderCompactFromStart ? 1 : 0);

  const [pinState, setPinState] = useState(
    renderCompactFromStart ? "after" : "before"
  );

  const [liveCompleted, setLiveCompleted] = useState(false);

  // Read the preference up-front so a reduced-motion visitor never
  // sees one frame of the animated version first.
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const isNarrow = useIsNarrow();
  // where the pinned sequence ends and how tall its scroll track is:
  // shorter on phones (only one row of reviews to show)
  const timelineEnd = isNarrow ? TIMELINE_END_NARROW : TIMELINE_END;
  const trackVh = isNarrow ? TRACK_VH_NARROW : TRACK_VH;

  const { result: wordParagraphs, totalWords } = useMemo(
    () => buildWordParagraphs(PARAGRAPHS),
    []
  );

  const sceneMV = useTransform(progress, sceneOpacity);
  const paragraphMV = useTransform(progress, paragraphContainerOpacity);
  const reviewsMV = useTransform(progress, reviewsContainerOpacity);

  /* -------------------- navbar hide-during-pin -------------------- */

  const { setHidden } = useNavbarVisibility();

  // Hide the navbar ONLY while the pin is actively scrubbing
  // (pinState === "pinned"). Before the section is reached, after
  // it releases, or in any of the "already done" paths
  // (renderCompactFromStart, reduceMotion, liveCompleted), the
  // navbar stays visible — Navbar.jsx reacts to this via the same
  // context.
  useEffect(() => {
    const shouldHide =
      !renderCompactFromStart && !reduceMotion && !liveCompleted && pinState === "pinned";
    setHidden(shouldHide);
  }, [pinState, renderCompactFromStart, reduceMotion, liveCompleted, setHidden]);

  // Safety net: if this unmounts mid-animation (e.g. a fast
  // client-side nav away from "/"), don't leave the navbar
  // permanently hidden.
  useEffect(() => {
    return () => setHidden(false);
  }, [setHidden]);

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

    // TIP: by the time we get here the tall track was ALREADY above the
    // viewport (update() only completes once it is), and it has just been
    // replaced by the much shorter static markup. Everything the user can
    // see sits below that point, so it moved UP by exactly
    // (old height - new height). Scrolling up by the same amount puts it
    // back where it was: no visible jump, and no more "teleport to the top
    // of the section" that used to happen here.
    // TIP - HOW THE HAND-OFF STAYS INVISIBLE: right before the swap,
    // update() remembered where the FOOTER sat on screen. The footer is a
    // good anchor because it is below everything that changes (so it moves
    // by exactly the height difference) and it is never itself animated
    // with a transform. Now that the static markup is in, we scroll by
    // however far the footer moved, which puts it back exactly where it
    // was: whatever the user is looking at doesn't budge, however tall the
    // static block turned out to be (measuring that height directly was
    // ~1500px off on phones, because images weren't laid out yet).
    const footer = document.querySelector("footer");
    if (footer && pending.footerTop != null) {
      window.scrollBy(0, footer.getBoundingClientRect().top - pending.footerTop);
    } else {
      // no footer to anchor to: fall back to comparing block heights
      const top = staticTopRef.current;
      const bottom = staticBottomRef.current;
      const staticHeight =
        top && bottom ? bottom.offsetTop + bottom.offsetHeight - top.offsetTop : 0;
      window.scrollTo(
        0,
        Math.max(0, pending.scrollY - (pending.occupiedHeight - staticHeight))
      );
    }

    // TIP - LATE LAYOUT: images and fonts inside the freshly-mounted static
    // block can still settle a few frames after this point (measured: ~80px
    // on a phone), and that would nudge the page. For the next 700ms we
    // watch the footer's position IN THE DOCUMENT (its on-screen top plus
    // scrollY). Genuine scrolling by the user doesn't change that number;
    // layout growth above it does, so any change is cancelled straight away.
    // Scroll anchoring stays off for that window so the two never fight.
    const holdFooter = document.querySelector("footer");
    const restoreAnchor = () => {
      document.documentElement.style.overflowAnchor = pending.prevAnchor;
    };
    if (holdFooter) {
      let baseDocY = holdFooter.getBoundingClientRect().top + window.scrollY;
      const hold = () => {
        const docY = holdFooter.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(docY - baseDocY) > 1) {
          window.scrollBy(0, docY - baseDocY);
          baseDocY = docY;
        }
      };
      // TIP: a ResizeObserver callback runs AFTER layout but BEFORE paint,
      // so the correction lands in the same frame as the growth: nothing
      // is ever drawn out of place (a requestAnimationFrame loop showed
      // one frame of the ~80px shift first).
      const resizeWatch = new ResizeObserver(hold);
      resizeWatch.observe(document.body);
      window.setTimeout(() => {
        resizeWatch.disconnect();
        restoreAnchor();
      }, 700);
    } else {
      requestAnimationFrame(restoreAnchor);
    }

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

    let rafId = null;
    let done = false;

    const measure = () => {
      if (contentRef.current) {
        contentHeightRef.current = contentRef.current.offsetHeight;
      }

      // How much empty stage is left around the reviews? Half of it (minus
      // the breathing room we want to keep) becomes the negative margin
      // that pulls the next section up under the reviews.
      if (contentHeightRef.current && reviewsGridRef.current) {
        const gridHeight = reviewsGridRef.current.offsetHeight;
        const overlap = Math.max(
          0,
          Math.round((contentHeightRef.current - gridHeight) / 2 - TAIL_BREATHING_PX)
        );
        tailOverlapRef.current = overlap;
        setTailOverlap((previous) => (previous === overlap ? previous : overlap));
      }
    };

    const update = () => {
      rafId = null;
      if (done) return;

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const contentHeight = contentHeightRef.current;
      const pinnableRange = rect.height - contentHeight;

      let nextState;
      let next;

      if (rect.top > NAVBAR_HEIGHT_PX) {
        nextState = "before";

        // PRE-ROLL (normal scrolling, before the pin): progress climbs
        // 0 -> PRE_ROLL_END while the section rises toward the navbar.
        // TIP: the window is sized so progress moves at the SAME speed per
        // pixel here as it does once pinned, which makes the hand-off
        // invisible: there is no change of pace at the moment Lara reaches
        // the middle, and photo 1 is already flying in by then.
        const approachWindow =
          pinnableRange > 0
            ? (PRE_ROLL_END * pinnableRange) / (timelineEnd - PRE_ROLL_END)
            : window.innerHeight * 0.8;
        const distanceToEngage = rect.top - NAVBAR_HEIGHT_PX;
        next = clamp01(1 - distanceToEngage / approachWindow) * PRE_ROLL_END;
      } else if (rect.bottom <= NAVBAR_HEIGHT_PX + contentHeight) {
        nextState = "after";
        next = timelineEnd;
        afterTopRef.current = Math.max(0, rect.height - contentHeight);
      } else {
        nextState = "pinned";
        // TIP: this used to restart from 0 the instant the pin engaged,
        // while the pre-roll had already reached its end, so Lara's
        // opacity dropped to 0 and faded back in (the "break").
        // Continuing from PRE_ROLL_END keeps progress continuous.
        const pinnedT =
          pinnableRange > 0
            ? clamp01((NAVBAR_HEIGHT_PX - rect.top) / pinnableRange)
            : 1;
        next = lerp(PRE_ROLL_END, timelineEnd, pinnedT);
      }

      // Only re-renders React when the pin state really changes.
      setPinState((previous) => (previous === nextState ? previous : nextState));

      // Never re-renders React — every visual subscribes to this.
      progress.set(next);

      // Complete ONLY once the whole track is out of sight above the
      // viewport, so the swap to the static markup can't be seen.
      if (
        nextState === "after" &&
        rect.bottom < -COMPLETE_MARGIN_PX &&
        !showcaseCompletedThisPageVisit
      ) {
        done = true;
        const root = document.documentElement;
        pendingScrollFixRef.current = {
          scrollY: window.scrollY,
          occupiedHeight: rect.height - tailOverlapRef.current,
          prevAnchor: root.style.overflowAnchor,
          footerTop: document.querySelector("footer")?.getBoundingClientRect().top ?? null,
        };
        // stop the browser's own scroll anchoring from also adjusting for
        // the height change; the layout effect does it exactly.
        root.style.overflowAnchor = "none";
        showcaseCompletedThisPageVisit = true;
        setLiveCompleted(true); // the layout effect above takes over
      }
    };

    // Event-driven instead of a forever-running rAF loop: scroll /
    // resize events just schedule ONE update for the next frame
    // (scroll events fire before rAF in the same frame, so this is
    // not a frame behind). Idle = zero work.
    const schedule = () => {
      if (rafId == null) rafId = requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      schedule();
    };

    measure();
    update();

    const ro = new ResizeObserver(onResize);
    if (contentRef.current) ro.observe(contentRef.current);
    if (reviewsGridRef.current) ro.observe(reviewsGridRef.current);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    return () => {
      done = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
    };
  }, [renderCompactFromStart, reduceMotion, liveCompleted, progress, timelineEnd]);

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
              // TIP — MOBILE SIZE, ROUND 2: 1.35x (matching the
              // wordmark's own scale) still read as too small, so this
              // now scales independently — 2.0x — since the decor
              // apparently needs to grow faster than the letters do to
              // look right, not just match them 1:1. This number is a
              // reasonable guess, not measured off a real render — if
              // it's still off, raise/lower the 2.0 here (it doesn't
              // need to match the wordmark's max-sm:scale-[1.75] below
              // anymore).
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none max-sm:scale-[2.0]"
              style={{ width: "100vw" }}
            />

            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="relative z-10 block h-auto w-full select-none max-sm:scale-[1.75]"
            />

            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 [--photo-scale:0.5] sm:[--photo-scale:1]"
              style={{
                width: `${PHOTO_WIDTH_PX}px`,
                height: "103.72863006591797px",
                transform: "translate(-50%, -50%) scale(var(--photo-scale, 1))",
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

        <div className="flex items-center justify-center pb-16 pt-6 md:pb-20 md:pt-10">
          <div className="mx-auto max-w-2xl text-center text-[15px] leading-[1.6] text-[var(--ink)] sm:text-[18px] sm:leading-[1.7] md:max-w-3xl md:text-[20px]">
            {PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className={index === PARAGRAPHS.length - 1 ? "mt-5 sm:mt-8" : "mb-4 sm:mb-6"}>
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
    <section ref={staticBottomRef} className={`w-full bg-[var(--cream)] pb-0 pt-16 md:pt-24 ${PAGE_CONTAINER_PADDING}`}>
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {/* TIP: phones only get the first three reviews (Lara's request); the
            nine-card grid is for tablets and desktops. */}
        {(isNarrow ? TESTIMONIALS.slice(0, 3) : TESTIMONIALS).map((testimonial, index) => (
          <div
            key={`${testimonial.name}-${index}`}
            // TIP: the old `lg:-translate-y-5` lifted the MIDDLE card of each
            // row 20px. The animated version never did that, so the two
            // versions didn't match (Lara flagged it). Removed: every card
            // now sits on the same line in both.
            className="min-h-[190px] border border-[var(--line)] bg-[var(--cream)] p-5 text-center"
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
        {/* TIP: scrollReveal.js skips anything inside #lara-showcase (this
            section is pinned + scroll-scrubbed by its own code), but no
            element actually had that id, so the exclusion matched nothing.
            The id makes it real for the ANIMATED markup below. The static
            markup deliberately uses a DIFFERENT id (lara-showcase-static)
            so the engine no longer skips it: once the pinned sequence is
            done, the compact Lara / paragraph blocks rise like everything
            else instead of just sitting there. */}
        <section ref={staticTopRef} id="lara-showcase-static" className="w-full bg-[var(--cream)]">{laraAndParagraphStatic}</section>
        {reviewsStatic}
      </>
    );
  }

  /* ============================================================
     ANIMATED PIN MODE — only runs before first completion
     ============================================================ */

  let containerStyle;

  // TIP - THE 33px HITCH: the stage used to be 100vh tall before the pin
  // and after it, but 100vh - 66px while pinned. Its contents are
  // vertically centred, so they jumped 33px at both hand-offs. Every state
  // now uses the SAME height, so pinning / unpinning is invisible.
  const STAGE_HEIGHT = `calc(100${VH_UNIT} - ${NAVBAR_HEIGHT_PX}px)`;

  if (pinState === "before") {
    containerStyle = { position: "relative", height: STAGE_HEIGHT };
  } else if (pinState === "pinned") {
    containerStyle = {
      position: "fixed",
      top: NAVBAR_HEIGHT_PX,
      left: 0,
      right: 0,
      height: STAGE_HEIGHT,
      zIndex: 10,
    };
  } else {
    containerStyle = {
      position: "absolute",
      top: afterTopRef.current,
      left: 0,
      right: 0,
      height: STAGE_HEIGHT,
      // TIP: the next section is pulled up UNDER this stage (see
      // tailOverlap), so once released the stage must be see-through and
      // click-through, otherwise its cream background would hide the top
      // of Shop Our Pieces and it would swallow clicks on it.
      background: "transparent",
      pointerEvents: "none",
    };
  }

  const layerBaseStyle = { position: "absolute", inset: 0, willChange: "opacity" };

  return (
    <>
      <section
        id="lara-showcase"
        ref={wrapperRef}
        className="relative w-full overflow-x-clip bg-[var(--cream)]"
        style={{ height: `${trackVh}${VH_UNIT}`, marginBottom: -tailOverlap }}
      >
        <div ref={contentRef} className="w-full bg-[var(--cream)]" style={containerStyle}>
          <div className="relative h-full w-full">
            {/* ======================= LARA + PHOTOS ======================= */}
            <motion.div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: sceneMV,
                pointerEvents: "none",
              }}
            >
              <div className="relative mx-auto w-full" style={{ maxWidth: WORDMARK_CONTAINER_WIDTH }}>
                <img
                  src={laraDecor}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  // TIP: same 2.0x as the static version above — keep
                  // both in sync when tuning.
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 select-none max-sm:scale-[2.0]"
                  style={{ width: "100vw" }}
                />

                <img
                  src={laraWordmark}
                  alt="Lara's Crochet"
                  decoding="async"
                  className="relative z-10 block h-auto w-full select-none pointer-events-none max-sm:scale-[1.75]"
                />

                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 overflow-visible [--photo-scale:0.5] sm:[--photo-scale:1]"
                  style={{
                    width: `${PHOTO_WIDTH_PX}px`,
                    height: "103.72863006591797px",
                    // TIP — PHONES: the photos sit in the CENTRE of the wordmark
                    // (like on desktop) but at 40% size (--photo-scale:0.4), and
                    // the wordmark itself is enlarged (max-sm:scale-[1.75]), so
                    // together they cover far less of the letters. Change 0.4 in
                    // the class above for bigger/smaller phone photos (0.35 is
                    // tiny, 0.6 is chunky).
                    transform: "translate(-50%, -50%) scale(var(--photo-scale, 1))",
                  }}
                >
                  {SCATTER_PHOTOS.map((photo, index) => (
                    <ScatterPhoto
                      key={photo.id}
                      photo={photo}
                      range={PHOTO_RANGES[index]}
                      progress={progress}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ======================= PARAGRAPH ======================= */}
            <motion.div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: paragraphMV,
                pointerEvents: "none",
              }}
            >
              {/* TIP: 15px on phones (it was 20px, which filled the whole screen),
                  18px from sm, 20px from md. Change the first number for phones. */}
              <div className="mx-auto max-w-2xl px-1 text-center text-[15px] leading-[1.6] text-[var(--ink)] sm:text-[18px] sm:leading-[1.7] md:max-w-3xl md:text-[20px]">
                {wordParagraphs.map((words, paragraphIndex) => (
                  <WordParagraph
                    key={paragraphIndex}
                    words={words}
                    progress={progress}
                    totalWords={totalWords}
                    className={
                      paragraphIndex === wordParagraphs.length - 1 ? "mt-5 sm:mt-8" : "mb-4 sm:mb-6"
                    }
                  />
                ))}
              </div>
            </motion.div>

            {/* ======================= REVIEWS ======================= */}
            <motion.div
              className={`flex items-center justify-center ${PAGE_CONTAINER_PADDING}`}
              style={{
                ...layerBaseStyle,
                opacity: reviewsMV,
                pointerEvents: "none",
              }}
            >
              {isNarrow ? (
                // PHONES: one row of 3 at a time, cross-fading in place.
                <div className="relative mx-auto h-full w-full max-w-md">
                  <NarrowReviewRow
                    row={REVIEW_ROWS[0]}
                    rowIndex={0}
                    progress={progress}
                  />
                  <NarrowReviewRow
                    row={REVIEW_ROWS[1]}
                    rowIndex={1}
                    progress={progress}
                    innerRef={reviewsGridRef}
                  />
                </div>
              ) : (
                <div
                  ref={reviewsGridRef}
                  className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3"
                >
                  {REVIEW_ROWS.map((row, rowIndex) =>
                    row.map((testimonial) => (
                      <ReviewCard
                        key={testimonial.name}
                        testimonial={testimonial}
                        rowIndex={rowIndex}
                        progress={progress}
                      />
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}