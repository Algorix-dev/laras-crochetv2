import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronUp, ShoppingBag } from "lucide-react";

const isSampleModel = (model) => String(model.id).startsWith("fallback-");
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

/* ============================================================
   HERO TUNING
   ============================================================ */

const SPIN_DURATION_SECONDS = 6;
const SIDE_TILT_DEGREES = 18;

/*
  Supporting models need to feel substantial like the Figma,
  but they must NOT be stretched vertically.
*/
const SUPPORT_SCALE_X = 1.12;
const SUPPORT_SCALE_Y = 1.0;

/*
  The selected model is intentionally larger.
*/
const SELECTED_SCALE_X = 1.0;
const SELECTED_SCALE_Y = 1.0;

// TIP — MOBILE CENTER MODEL SIZE: used for BOTH scaleX and scaleY on phones
// so the model grows bigger while staying proportional (never stretched).
// KEEP THIS MODEST — the dvh-based row (see IMAGE_HEIGHT_SELECTED below)
// already fills nearly the entire screen height, so this scale stacks ON
// TOP of an already-tall image. Anything much above ~1.2 pushes the
// model's top edge (the head) above the visible viewport — it renders
// behind the fixed navbar and behind the name text (which sits at a
// lower z-index than the model), so both the head and the name
// effectively disappear. If Lara wants it bigger, it's safer to grow
// NAME_NAVBAR_GAP_PX below (gives the head more room to rise into the
// text before it reaches the navbar) than to push this much higher.
const SELECTED_SCALE_PHONE = 1.1;

// TIP — HEAD-THROUGH-TEXT OVERLAP (mobile): the model is pinned to the
// row's bottom edge and grows UPWARD as SELECTED_SCALE_PHONE increases
// (transformOrigin is 50% 100%), so a bigger scale = the head reaches
// higher above the row. The row's top edge sits this many px below the
// navbar; the name text starts NAME_TOP_OFFSET_PX into that gap. Both
// exist so the head has room to rise into the middle of the text
// without reaching all the way up into the navbar's own space (the
// navbar is z-50, above the model, so anything that pokes up that far
// hides behind it instead of overlapping the text).
//   NAME_NAVBAR_GAP_PX  — total gap between navbar bottom and row top.
//   NAME_TOP_OFFSET_PX  — how far into that gap the text itself starts
//                         (smaller = text sits higher / closer to navbar).
// These two are a starting estimate, not a measured value — check
// against Lara's real photos and nudge them (and SELECTED_SCALE_PHONE)
// together: raise NAME_NAVBAR_GAP_PX and/or SELECTED_SCALE_PHONE for
// more overlap, lower them for less.
const NAME_NAVBAR_GAP_PX = 60;
const NAME_TOP_OFFSET_PX = 16;

// TIP — WHY THE PRICE ROW KEPT DISAPPEARING (mobile): it's the space
// reserved below the model row for the podium + price block to exist
// in. Too small an estimate here is exactly what caused the price row
// to render below the visible screen (needing a scroll) even though
// the earlier fix reserved SOME space — the real rendered content was
// taller than that estimate. This is deliberately generous (with room
// to spare, not a tight fit) so it's visible with a bit of margin
// above the actual screen edge rather than being right on the edge or
// still slightly short. If it still doesn't fit on a real device,
// raise this further — a bigger row is worth trading for a price row
// that's reliably on screen.
const MOBILE_BOTTOM_RESERVE_PX = 170;

/*
  TIP — WHY THERE IS NO "UNSELECTED HEIGHT" ANY MORE:
  Every model image is now rendered at the SELECTED height and the
  supporting ones are simply scaled down to this fraction of it. The old
  code swapped a CSS height class when a model was selected, which can't
  be animated (it snapped, and framer's `layout` had to fake the
  transition). A scale CAN be animated, so a model now grows/shrinks
  smoothly as it travels between slots.
  0.88 = the old 22rem/25rem (and 37rem/42rem) ratio between the two
  heights. Lower it to make the side models smaller.
*/
const SUPPORT_HEIGHT_RATIO = 0.88;
// TIP — PHONES: Lara's mobile design has the two side models clearly smaller
// than the middle one (about 70%), so the middle model reads as big. Raise
// this to make the phone side models bigger again.
const SUPPORT_HEIGHT_RATIO_PHONE = 0.5;
const supportRatio = () =>
  typeof window !== "undefined" && window.innerWidth < 640
    ? SUPPORT_HEIGHT_RATIO_PHONE
    : SUPPORT_HEIGHT_RATIO;

/*
  Side models: 3D glassy depth-of-field blur & opacity, matching the
  client's luxury reference image (SSENSE/Gucci sneakers showcase).
  Center active model stays crisp and sharp (blur: 0px, opacity: 1),
  while supporting models have soft blur and lower opacity so the
  eye naturally locks onto the center product.
*/
const SIDE_MODEL_OPACITY = 0.50;
const SIDE_MODEL_BLUR_PX = 4.5;

/*
  TIP — HOW CLOSE THE MODELS SIT (replaces the old MODEL_OVERLAP margin):
  1 = the five models are spaced exactly one fifth of the row apart.
  Below 1 pulls them closer together (0.9 = 10% tighter), above 1
  spreads them out. Only the spacing changes, not the sizes.
*/
const SLOT_SPACING = 1.2;

/*
  Keep the hero from becoming too wide on very large screens.
*/
const PAGE_CONTAINER_PADDING =
  "px-5 md:px-8 lg:px-[10%]";

/* ============================================================
   ANIMATION
   ============================================================ */

// How a model glides from one slot to another.
const SELECT_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 28,
};

// A model that has to leave one edge and reappear at the other (the
// loop-around when there are exactly 5 models) uses a timed path instead:
// it slides out with the row while fading away, then FADES IN WHERE IT
// BELONGS. It never travels across (or in from the side of) the screen.
const WRAP_DURATION_SECONDS = 0.95;
// Fraction of that path spent leaving; the rest is spent fading back in.
const WRAP_EXIT_FRACTION = 0.4;

// How long a model takes to swap between its side-facing photo and its
// front-facing photo as it arrives in / leaves the middle slot.
const FACE_FADE_SECONDS = 0.5;

// SWIPE (touch screens): a horizontal drag at least this many pixels long,
// and clearly more sideways than up/down, counts as a swipe. Lower
// SWIPE_MIN_PX to make it more sensitive, raise it to need a longer drag.
const SWIPE_MIN_PX = 40;
// "clearly more sideways": the sideways distance must be at least this
// many times the up/down distance, so scrolling the page never triggers it.
const SWIPE_SIDEWAYS_RATIO = 1.4;

// Name + price: fade OUT as the clicked model starts moving, then fade IN
// after a short delay so it appears while the model is still settling into
// the middle — never before it has started to arrive.
// TIP: these were 0.16 / 0.35 / 0.14 — slowed down on purpose. Raise them
// for an even calmer swap, lower them to speed it back up.
const TEXT_OUT_SECONDS = 0.3;
const TEXT_IN_SECONDS = 0.75;
const TEXT_IN_DELAY_SECONDS = 0.2;

// Podium ripple: the client wants this running constantly (like the
// comet spin), not just after a click. Two rings, the second slightly
// behind the first, looping forever with a short pause between pulses.
const RIPPLE_DURATION_SECONDS = 1.1;
const RIPPLE_END_SCALE = 1.9;
const RIPPLE_PEAK_OPACITY = 0.55;
// TIP: gap of silence between one ripple finishing and the next starting.
// Lower it for a busier podium, raise it for a calmer one.
const RIPPLE_REPEAT_GAP_SECONDS = 1.2;
const COMET_PEAK_OPACITY = 0.55;
/* ============================================================
   MODELS — now DATA, not hardcoded
   ============================================================

   Hero receives its models as a prop (see HomePage in App.jsx): every
   piece Lara marks "Hero" in the admin page, in the shape

     { id, name, price, views: { front, left, right } }

   TIP — HOW MANY MODELS:
   The carousel adapts to however many there are. Five (or three on a
   narrow screen) are shown at once; any beyond that wait invisibly at
   the edges and slide in as you click toward them. Use an ODD count
   where you can (3, 5, 7…) so the middle is always a single model — with
   only one or two pieces on the hero, just one or two models are shown.
*/

/* ============================================================
   RESPONSIVE MODEL COUNT
   ============================================================

   >= 1440px CSS width : all FIVE models (the Figma layout)
   <  1440px CSS width : only THREE models — the selected one plus
                         one on each side, with the exact same
                         tilt + slightly-transparent side effect.

   NOTE: this is CSS pixels, not screen resolution. A laptop set
   to 1920x1080 with Windows display scaling at 125% is really
   ~1536px wide to the browser (150% = ~1280px), which is why it
   can look different from a 1920px responsive-viewer preview.

   The initial value is read synchronously (not in an effect) so
   the page never flashes 5 models and then drops to 3 on load.
*/
const WIDE_QUERY = "(min-width: 1440px)";

function useIsWide() {
  const [isWide, setIsWide] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia(WIDE_QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const onChange = (event) => setIsWide(event.matches);

    setIsWide(mq.matches);
    mq.addEventListener("change", onChange);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isWide;
}

/* ============================================================
   IMAGE SIZE
   ============================================================

   The row is exactly as tall as the SELECTED model, and every model
   image uses this same height (supporting ones are scaled down, see
   SUPPORT_HEIGHT_RATIO).

   At 1920px: selected ≈ 650px tall, supporting ≈ 570px.

   TIP — MOBILE HEIGHT IS NOW DYNAMIC (dvh, not a fixed rem number):
   the old `max-sm:h-[27rem]` left a leftover gap at the bottom on
   phones where 27rem didn't happen to fill the screen. Instead the
   row now claims 100% of the *dynamic* viewport height (dvh accounts
   for the mobile browser's address bar, unlike plain vh) minus the
   navbar-and-gap above it (--hero-navbar-offset + NAME_NAVBAR_GAP_PX)
   and MOBILE_BOTTOM_RESERVE_PX below it — so there is never dead
   space, and the price row has real room to actually be visible.

   --hero-navbar-offset is set once in index.css's :root (Navbar's
   h-[66px] + 1px border = 67px) since it's shared with the section's
   own padding-top below. NAME_NAVBAR_GAP_PX and
   MOBILE_BOTTOM_RESERVE_PX are defined above — keep all three in sync
   with the section's max-sm:pt/pb if you change any of them.
*/
const IMAGE_HEIGHT_SELECTED =
  `h-[clamp(25rem,34vw,42rem)] max-sm:h-[calc(100dvh-var(--hero-navbar-offset,67px)-${NAME_NAVBAR_GAP_PX}px-${MOBILE_BOTTOM_RESERVE_PX}px)]`;

/* ============================================================
   CAROUSEL MATH
   ============================================================

   Every model has an OFFSET from the middle:
     0 = the selected one, -1 / +1 = its neighbours, -2 / +2 = the edges…
   Offsets wrap around like a loop of models, so with 5 models they are
   always -2..2 and with 7 they are -3..3.

   wrapOffset() maps any whole number back into that loop's range.
*/
function wrapOffset(value, count) {
  const lowest = -Math.floor(count / 2);
  return ((((value - lowest) % count) + count) % count) + lowest;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/*
  What a model looks like at a given offset. `half` is how many slots
  sit on each side of the middle that are actually SHOWN (2 wide, 1
  narrow). One slot further out than that is the invisible "waiting"
  slot — same tilt/blur, opacity 0 — so a model fades in as it slides
  into view instead of popping.
*/
function getSlotLook(offset, half) {
  const isCenter = offset === 0;
  const isShown = Math.abs(offset) <= half;
  const isPhone =
    typeof window !== "undefined" && window.innerWidth < 640;

  return {
    opacity: isCenter ? 1 : isShown ? SIDE_MODEL_OPACITY : 0,

    rotateY: isCenter
      ? 0
      : Math.sign(offset) * SIDE_TILT_DEGREES,

    // Center model bigger on mobile — same factor on X and Y so it
    // scales up proportionally instead of stretching.
    scaleX: isCenter
      ? (isPhone ? SELECTED_SCALE_PHONE : SELECTED_SCALE_X)
      : SUPPORT_SCALE_X * supportRatio(),

    scaleY: isCenter
      ? (isPhone ? SELECTED_SCALE_PHONE : SELECTED_SCALE_Y)
      : SUPPORT_SCALE_Y * supportRatio(),

    // ONLY the side models move upward on mobile
    y: !isCenter && isPhone ? -80 : 0,

    filter: isCenter
      ? "blur(0px) brightness(1)"
      : `blur(${SIDE_MODEL_BLUR_PX}px) brightness(0.95)`,
  };
}

/* ============================================================
   PODIUM
   ============================================================ */

const PODIUM_VIEWBOX = "0 0 243.81 116.05";

const PODIUM_RINGS = [
  {
    cx: 121.9,
    cy: 59.94,
    rx: 121.9,
    ry: 56.11,
  },
  {
    cx: 121.9,
    cy: 59.99,
    rx: 110.45,
    ry: 50.83,
  },
  {
    cx: 124.34,
    cy: 50.83,
    rx: 110.45,
    ry: 50.83,
  },
];

const PODIUM_STROKE_WIDTH = 2.5;
const PODIUM_DASH_LENGTH = 4;
const PODIUM_DASH_GAP = 3;
const PODIUM_DASH =
  `${PODIUM_DASH_LENGTH} ${PODIUM_DASH_GAP}`;

const BASE_RING_OPACITY = 0.45;

const COMET_STROKE_WIDTH = 4.5;
const COMET_GLOW_BLUR = 2.2;

const COMET_BAND_WIDTH = 55;

const COMET_STOPS = [
  {
    offset: "0%",
    opacity: 0,
  },
  {
    offset: `${50 - COMET_BAND_WIDTH / 2}%`,
    opacity: 0,
  },
  {
    offset: "50%",
    opacity: COMET_PEAK_OPACITY,
  },
  {
    offset: `${50 + COMET_BAND_WIDTH / 2}%`,
    opacity: 0,
  },
  {
    offset: "100%",
    opacity: 0,
  },
];

const PODIUM_SPIN_START =
  typeof performance !== "undefined"
    ? performance.now()
    : 0;

function getPodiumAnimationDelay() {
  const now =
    typeof performance !== "undefined"
      ? performance.now()
      : 0;

  const elapsedSeconds =
    (now - PODIUM_SPIN_START) / 1000;

  const phase =
    elapsedSeconds % SPIN_DURATION_SECONDS;

  return `-${phase.toFixed(3)}s`;
}

function formatNaira(amount) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/*
  Which photo(s) does this model show at this offset?
  Returns { front, side, mirror }.
*/
function getViews(model, offset) {
  const { front, left, right } = model.views;
  const native = left ?? right ?? front;

  if (offset === 0) return { front: front ?? native, side: native, mirror: false };

  const want = offset < 0 ? left : right;
  const other = offset < 0 ? right : left;

  if (want) return { front: front ?? want, side: want, mirror: false };
  if (other) return { front: front ?? other, side: other, mirror: true };
  return { front, side: front, mirror: false };
}

/* ============================================================
   FEET ALIGNMENT
   ============================================================

   TIP — WHY THE PODIUM DIDN'T MATCH EVERY MODEL: every photo is centred
   on the podium by the CENTRE OF THE IMAGE. That is only right if the
   model's FEET happen to be in the middle of her photo, and they usually
   aren't (an arm held out, a wide stance and the middle of the picture
   is no longer between the feet). Reina's photo was cropped so that they
   line up; the others weren't.

   So instead of trusting the crop, we measure it: draw the photo small,
   look at the bottom few percent (where the feet are), find the middle of
   the leftmost and rightmost foot pixel, and shift the photo sideways by
   exactly that much so those feet land on the podium. It works for every
   photo, including the ones Lara uploads later, with no editing.
   (If a photo can't be read, e.g. the image host doesn't allow it, it just
   stays centred like before.)
*/
const feetCache = new Map(); // photo url -> 0..1 across the photo, or null

function measureFeetCenter(image) {
  const width = 160;
  const height = Math.max(
    1,
    Math.round((image.naturalHeight * width) / image.naturalWidth)
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);

  const bandTop = Math.floor(height * 0.94); // the bottom 6% = the feet
  const { data } = context.getImageData(0, bandTop, width, height - bandTop);

  let leftmost = width;
  let rightmost = -1;
  for (let row = 0; row < height - bandTop; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (data[(row * width + col) * 4 + 3] > 40) {
        if (col < leftmost) leftmost = col;
        if (col > rightmost) rightmost = col;
      }
    }
  }
  return rightmost < 0 ? null : (leftmost + rightmost) / 2 / width;
}

function useFeetCenter(src) {
  const [feet, setFeet] = useState(() => (src ? feetCache.get(src) ?? null : null));

  useEffect(() => {
    if (!src) return undefined;
    if (feetCache.has(src)) {
      setFeet(feetCache.get(src));
      return undefined;
    }

    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous"; // lets us read the pixels of a hosted photo
    image.onload = () => {
      let measured = null;
      try {
        measured = measureFeetCenter(image);
      } catch {
        measured = null; // the host didn't allow reading it: stay centred
      }
      feetCache.set(src, measured);
      if (!cancelled) setFeet(measured);
    };
    image.onerror = () => feetCache.set(src, null);
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return feet;
}

/* ============================================================
   ONE MODEL IN THE ROW
   ============================================================ */

function HeroModel({
  model,
  offset,
  prevOffset,
  shift,
  moveId,
  half,
  slotWidth,
  reduceMotion,
  onSelect,
}) {
  const navigate = useNavigate();
  const frontImageRef = useRef(null);
  const [frontImageWidth, setFrontImageWidth] = useState(0);
  const isSelected = offset === 0;
  const isShown = Math.abs(offset) <= half;
  const edge = half + 1; // the invisible waiting slot

  const hasFront = Boolean(model.views.front);
  // where the front photo's feet are, across its width (0.5 = dead centre)
  const frontFeet = useFeetCenter(hasFront ? model.views.front : null);

  // Is this model being carried off one end of the row to reappear at the
  // other (the loop-around)? Same test the animation below uses.
  const isLooped = moveId > 0 && prevOffset + shift !== offset;

  /*
    TIP — DON'T LET THE PHOTO FLIP WHILE YOU CAN SEE IT (loop-around):
    a model that wraps from one edge to the other has to change from its
    "facing left" photo to its "facing right" one (or the reverse). It used
    to change the instant the click happened, while the model was still
    half visible and only just starting to fade out, so you saw it turn
    around. Now it keeps its OLD photo until it has faded out completely
    (the same moment its tilt / size / blur are switched, see switchDelay
    below), and only then takes the new one.
  */
  const [swappedFor, setSwappedFor] = useState(0); // moveId whose photo swap is done
  useEffect(() => {
    if (!isLooped || reduceMotion) return undefined;
    const timer = window.setTimeout(
      () => setSwappedFor(moveId),
      // +30ms so we are safely past the fade-out (it ends at this moment)
      WRAP_DURATION_SECONDS * WRAP_EXIT_FRACTION * 1000 + 30
    );
    return () => window.clearTimeout(timer);
  }, [isLooped, moveId, reduceMotion]);
  const viewOffset =
    isLooped && !reduceMotion && swappedFor !== moveId ? prevOffset : offset;

  // With a front photo, the side photo fades out at the middle, so let it
  // keep the direction it arrived with. Without one, it must stay as-is.
  const view = getViews(model, hasFront ? viewOffset || prevOffset : viewOffset);
  useLayoutEffect(() => {
    const image = frontImageRef.current;
    if (!image) return;

    const measure = () => {
      setFrontImageWidth(image.getBoundingClientRect().width);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(image);

    return () => observer.disconnect();
  }, [view?.front, isSelected]);

  const feetCorrection =
    isSelected && frontFeet !== null && frontImageWidth > 0
      ? -(frontFeet - 0.5) * frontImageWidth
      : 0;
      
  const fade = {
    duration: reduceMotion ? 0 : FACE_FADE_SECONDS,
    ease: "easeInOut",
  };
  // TIP: a looped model swaps its photo while it is INVISIBLE, so the new
  // photo must simply be there (no fade of its own; the row animation is
  // already fading the whole model in). But that must NOT make the normal
  // front <-> side fade instant: a model that loops away from the middle
  // (only happens with two models) is still on screen while its front photo
  // fades out and its side photo fades in.
  const swapInstantly = isLooped || reduceMotion;

  const { animate, transition } = useMemo(() => {
    const look = getSlotLook(offset, half);

    // Horizontal position of a slot, capped at the waiting slot so
    // nothing is ever parked far off screen.
    const xFor = (slot) =>
      clamp(slot, -edge, edge) * slotWidth * SLOT_SPACING;

    if (reduceMotion) {
      return {
        animate: { ...look, x: xFor(offset) },
        transition: { duration: 0 },
      };
    }

    // Where this model WOULD be if the row were an endless belt.
    const beltOffset = prevOffset + shift;
    const looped = moveId > 0 && beltOffset !== offset;

    // Was this model parked in the invisible waiting slot (only happens
    // with more than 5 models) and is now coming into view?
    const arriving =
      moveId > 0 && Math.abs(prevOffset) > half && isShown;

    /*
      TIP — FADE IN PLACE (not slide in):
      A model that has to (re)appear in the row does NOT glide in from the
      side any more. It is placed straight into its final slot and only its
      opacity animates, after the rest of the row has started to settle.
      The tilt / size / blur are set at the same moment (duration 0) so
      nothing visibly changes shape while it fades. Before this, clicking
      two spots to the right made the two models that wrapped around run in
      from the right-hand edge.
    */
    if (arriving && !looped) {
      const settleDelay = 0.25;
      return {
        animate: { ...look, x: xFor(offset) },
        transition: {
          default: { duration: 0, delay: settleDelay },
          x: { duration: 0 },
          opacity: {
            duration: 0.6,
            delay: settleDelay,
            ease: "easeOut",
          },
        },
      };
    }

    if (!looped) {
      return {
        animate: { ...look, x: xFor(offset) },
        transition: SELECT_SPRING,
      };
    }

    /*
      TIP — THE LOOP-AROUND (only happens with a small model count):
      this model is being carried off one end of the row and has to
      reappear at the other. 3-stop path:
        1. from where it is now …
        2. … on to the edge it was leaving, fading out
        3. instantly (unseen, it is at opacity 0) to its FINAL slot, where
           it fades in — no sliding in from the other side
      The "instant" step is 0.1% of the path (see the times array).
      Tilt / size / blur switch at the same unseen moment (duration 0 with a
      delay), so the model reappears already in its new shape.
    */
    const times = [0, WRAP_EXIT_FRACTION, WRAP_EXIT_FRACTION + 0.001, 1];
    const switchDelay = WRAP_DURATION_SECONDS * WRAP_EXIT_FRACTION;
    const instantAtSwitch = { duration: 0, delay: switchDelay };

    return {
      animate: {
        ...look,
        x: [null, xFor(beltOffset), xFor(offset), xFor(offset)],
        opacity: [null, 0, 0, look.opacity],
      },
      transition: {
        default: SELECT_SPRING,
        x: {
          duration: WRAP_DURATION_SECONDS,
          times,
          ease: ["easeIn", "linear", "linear"],
        },
        opacity: {
          duration: WRAP_DURATION_SECONDS,
          times,
          ease: "linear",
        },
        rotateY: instantAtSwitch,
        scaleX: instantAtSwitch,
        scaleY: instantAtSwitch,
        filter: instantAtSwitch,
      },
    };
  }, [offset, prevOffset, shift, moveId, half, edge, slotWidth, reduceMotion]);

  const initial = useMemo(
    () => ({
      ...getSlotLook(offset, half),
      x: clamp(offset, -edge, edge) * slotWidth * SLOT_SPACING,
    }),
    // first render only — later changes go through `animate`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <motion.button
      type="button"
      onClick={() => {
        // TIP — CENTRED MODEL OPENS ITS PRODUCT PAGE: clicking a side
        // model brings it to the middle; clicking the one already in the
        // middle takes the shopper to that piece's own product-details page.
        //
        // The sample models shown while NO piece is marked "Hero" in the
        // admin page (ids start with "fallback-") used to do nothing when
        // clicked, which looked like a broken link. Now:
        //   - if App.jsx found a real piece with the same name, it set
        //     `productId` on the model and we open that piece;
        //   - otherwise the shopper goes to the Shop instead of nowhere.
        if (isSelected) {
          const isSample = String(model.id).startsWith("fallback-");
          if (model.productId) navigate(`/product/${model.productId}`);
          else if (isSample) navigate("/shop");
          else navigate(`/product/${model.id}`);
          return;
        }
        onSelect(model.id);
      }}
      aria-label={isSelected ? `View ${model.name}` : `Show ${model.name}`}
      aria-pressed={isSelected}
      aria-hidden={!isShown}
      tabIndex={isShown ? 0 : -1}
      initial={initial}
      animate={animate}
      transition={transition}
      style={{
        width: slotWidth,
        marginLeft: -slotWidth / 2,
        // the middle model sits in front of its overlapping neighbours
        zIndex: isSelected ? 12 : 10,
        // TIP — WHY TAPS STOPPED WORKING ON PHONES: the model in the middle
        // used to catch every tap over its own slot AND its hidden side photo
        // (invisible, but far wider than the slot), so once a model with a
        // side photo was in the middle, taps aimed at its neighbours landed
        // on it and did nothing. That's still avoided (only the model's own
        // slot is clickable, never its hidden wide side photo), but the
        // middle slot itself is now clickable too, since it opens the
        // product page instead of doing nothing.
        pointerEvents: isShown ? "auto" : "none",
        transformOrigin: "50% 100%",
      }}
      className="
        absolute
        bottom-0
        max-sm:bottom-[1%]
        left-1/2
        flex
        items-end
        justify-center
        border-0
        bg-transparent
        p-0
        overflow-visible
      "
    >
      <div className={`relative w-full ${IMAGE_HEIGHT_SELECTED}`}>
        {/* TIP — CROSS-FADE WHEN A VISIBLE MODEL CHANGES DIRECTION:
            keyed by the photo (+ whether it is mirrored), so when the photo
            changes React keeps the old <img> around while it fades out and
            fades the new one in on top, instead of swapping them in one
            frame. This is what a model does when a click carries it ACROSS
            the middle (e.g. from the right side to the left side). */}
        <AnimatePresence initial={false}>
          <motion.img
            key={`${view.side}|${view.mirror}`}
            src={view.side}
            decoding="async"
            draggable={false}
            alt=""
            initial={{
              opacity: swapInstantly ? (isSelected && hasFront ? 0 : 1) : 0,
            }}
            animate={{
              opacity: isSelected && hasFront ? 0 : 1,
              transition: fade,
            }}
            exit={{
              opacity: 0,
              transition: swapInstantly ? { duration: 0 } : fade,
            }}
            style={{ pointerEvents: "none" }}
            className={`absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain ${
              view.mirror ? "-scale-x-100" : ""
            }`}
          />
        </AnimatePresence>

        {hasFront && (
          <motion.img
            ref={frontImageRef}
            src={view.front}
            decoding="async"
            draggable={false}
            alt={isSelected ? model.name : ""}
            initial={false}
            animate={{ opacity: isSelected ? 1 : 0 }}
            transition={fade}
            // `translate` (a percentage of the photo's OWN width) slides the
            // photo left by "feet position" so the feet, not the picture's
            // middle, sit on the podium. 0.5 = the old centred behaviour.
            style={{
              translate: `calc(-50% + ${feetCorrection}px) 0`,
              pointerEvents: "none",
            }}
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none select-none object-contain"
          />
        )}
      </div>
    </motion.button>
  );
}

/* ============================================================
   HERO
   ============================================================ */

function HeroCarousel({ models }) {
  const isWide = useIsWide();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const rowRef = useRef(null);

  const count = models.length;

  // Five slots wide, three narrow — but never more than the models we
  // have, and always odd so there is one true middle.
  const wantedVisible = isWide ? 5 : 3;
  const cappedVisible = Math.min(wantedVisible, count);
  // TIP: an even count is trimmed to the odd number below it so there is
  // one true middle model, EXCEPT with exactly two models, where trimming
  // would leave just one on screen and the other could never be reached.
  const visibleCount =
    cappedVisible % 2 === 0 && count > 2 ? cappedVisible - 1 : cappedVisible;
  const half = Math.floor(visibleCount / 2);

  /*
    PERFORMANCE: the podium's comet is an SVG (SMIL) animation with
    a blur filter that repaints every frame. That's fine while the
    hero is on screen, but it kept burning frames while the user
    scrolled through the rest of the page — a real contributor to
    the "laggy when I scroll" feel. Pause it whenever the hero is
    off screen, resume when it's back.
  */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(([entry]) => {
      el.querySelectorAll("svg").forEach((svg) => {
        if (entry.isIntersecting) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      });
    });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* -------------------- measure the row -------------------- */

  // Slots are spaced by the row's width, so we need it in pixels.
  // useLayoutEffect measures BEFORE the first paint, and the models
  // aren't rendered until we have a number, so nothing ever flashes
  // stacked in the middle.
  const [rowWidth, setRowWidth] = useState(0);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const measure = () => setRowWidth(el.clientWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slotWidth = rowWidth / visibleCount;

  /* -------------------- carousel state -------------------- */

  /*
    active     : index (into models) of the model in the middle
    prevActive : the one that was in the middle before the last click
    move       : how many slots the clicked model travelled (its old offset)
    moveId     : goes up by one per click — used to restart the text/ripple
    Together prevActive + move let every model work out where it was
    and how far the belt moved, which is what makes multi-slot clicks
    (e.g. the far-right model) glide as ONE continuous motion.
  */
  // the middle model on first load: the middle of the list
  const [nav, setNav] = useState(() => ({
    active: Math.floor(count / 2),
    prevActive: Math.floor(count / 2),
    move: 0,
    moveId: 0,
  }));

  function handleSelect(id) {
    setNav((state) => {
      const clickedIndex = models.findIndex((model) => model.id === id);
      const clickedOffset = wrapOffset(clickedIndex - state.active, count);

      // already in the middle, or not one of the shown slots
      if (clickedOffset === 0 || Math.abs(clickedOffset) > half) {
        return state;
      }

      return {
        // keep `active` a plain 0…count-1 index into models
        active: (((state.active + clickedOffset) % count) + count) % count,
        prevActive: state.active,
        move: clickedOffset,
        moveId: state.moveId + 1,
      };
    });
  }

  /* -------------------- swipe + arrow keys -------------------- */

  /*
    TIP — HOW SWIPING WORKS: it doesn't move anything by itself. A swipe
    just works out which model is next door and "clicks" it, so it uses the
    exact same glide, text swap and podium ripple as tapping that model.
      swipe LEFT  (finger moves left)  -> the model on the RIGHT comes in
      swipe RIGHT (finger moves right) -> the model on the LEFT comes in
    The row has `touch-action: pan-y` (see below), which tells the browser
    "you handle up/down scrolling, I'll handle sideways drags". Without it
    the browser would cancel the gesture the moment a finger drifted, and
    the page would try to pan sideways.
  */
  const swipeStart = useRef(null);
  const justSwiped = useRef(false);

  function goToNeighbour(direction) {
    // direction: +1 = the model on the right, -1 = the one on the left
    const at = (d) =>
      models.find((_, index) => wrapOffset(index - nav.active, count) === d);
    // with exactly two models the other one only exists on one side, so
    // a swipe either way should bring it in
    const target = at(direction) ?? (count === 2 ? at(-direction) : undefined);
    if (target) handleSelect(target.id);
  }

  const swipeHandlers = {
    onPointerDown: (event) => {
      // touch / pen only: with a mouse, clicking a model already works and
      // dragging would fight with selecting text
      if (event.pointerType === "mouse" || !event.isPrimary) return;
      swipeStart.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      if (!start) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) < SWIPE_MIN_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_SIDEWAYS_RATIO) return;

      // a swipe that starts and ends on the same model would ALSO fire a
      // click on it, moving the carousel twice; swallow that next click
      justSwiped.current = true;
      window.setTimeout(() => {
        justSwiped.current = false;
      }, 350);

      goToNeighbour(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      swipeStart.current = null;
    },
    onClickCapture: (event) => {
      if (justSwiped.current) {
        event.preventDefault();
        event.stopPropagation();
        justSwiped.current = false;
      }
    },
    // keyboard users: left / right arrows while a model is focused
    onKeyDown: (event) => {
      if (event.key === "ArrowRight") goToNeighbour(1);
      else if (event.key === "ArrowLeft") goToNeighbour(-1);
    },
  };

  // Once a move has finished, forget it — otherwise a later window
  // resize would replay the loop-around path for models that wrapped.
  useEffect(() => {
    if (nav.moveId === 0) return undefined;

    const timer = setTimeout(() => {
      setNav((state) =>
        state.moveId === nav.moveId
          ? { ...state, prevActive: state.active, move: 0 }
          : state
      );
    }, WRAP_DURATION_SECONDS * 1000 + 150);

    return () => clearTimeout(timer);
  }, [nav.moveId]);

  const activeModel = models[nav.active];

  // The podium's spin phase is fixed once so re-renders don't restart it.
  const [podiumDelay] = useState(getPodiumAnimationDelay);

  return (
    <section
      ref={sectionRef}
      id="hero"
      data-hero="true"
      data-no-rise="true"
      className={`
        overflow-x-clip
        pt-16
        md:pt-20
        lg:pt-24
        max-sm:pt-[calc(var(--hero-navbar-offset,67px)+${NAME_NAVBAR_GAP_PX}px)]
        pb-24
        md:pb-32
        max-sm:pb-[${MOBILE_BOTTOM_RESERVE_PX}px]
        text-center
      `}
      /* TIP — MOBILE TOP OFFSET: on desktop, pt-16/20/24 does double
         duty — it's what pushes content below the fixed Navbar
         (position: fixed, so nothing pushes it out of the way
         automatically) AND sets the gap above the content. Mobile
         needs the same: Navbar height (--hero-navbar-offset, 67px)
         PLUS the ~34px gap to the name text — not just the 34px
         alone. Reads the same CSS variable as IMAGE_HEIGHT_SELECTED's
         calc above, so both stay in sync automatically if
         --hero-navbar-offset is ever updated in index.css.

         TIP — MOBILE BOTTOM PADDING (max-sm:pb): the podium and price
         row are position: absolute, so they do NOT add to this
         section's own box height — normal document flow ends right at
         the row's bottom edge regardless of them. Without real pb
         here to reserve that space, whatever section comes after Hero
         renders directly on top of the row's bottom edge, painting
         over (hiding) the podium/price completely, even though
         they're still technically "there". This pb must be at least
         --hero-price-offset so they have room to actually be seen —
         it is NOT a leftover gap to trim; it's required space. (The
         old fixed-height mobile gap complaint is instead fixed by the
         dvh-based row height above, which now hugs the screen with no
         slack of its own.) */
      style={{
        perspective: "1800px",
      }}
    >
      <div
        className={`
          relative
          mx-auto
          ${PAGE_CONTAINER_PADDING}
        `}
      >

        {/* ==================================================
            MODEL ROW — five models at >= 1440px, three below.
            TIP: this row is a fixed-height stage. The models,
            name, podium and price are all positioned inside it,
            so the name/podium/price stay put while the models
            slide past them.
            ================================================== */}

        <div
          ref={rowRef}
          className={`relative w-full ${IMAGE_HEIGHT_SELECTED}`}
          // TIP: pan-y = vertical page scrolling stays with the browser,
          // sideways drags come to us (see the swipe notes above)
          style={{ touchAction: "pan-y" }}
          {...swipeHandlers}
        >
          {/* ==============================================
              MODEL NAME — fades out, then the new one fades in

              TIP — PHONES: the name is anchored near the row's TOP edge
              (`max-sm:top-[${NAME_TOP_OFFSET_PX}px]`, a small drop into
              the NAME_NAVBAR_GAP_PX gap under the navbar) rather than
              the row's bottom, so its position stays stable regardless
              of the row's dvh-based height. The model is pinned to the
              row's bottom edge and grows UPWARD as SELECTED_SCALE_PHONE
              increases, so the head rises into this same gap — that's
              the overlap that puts the head through the text. All
              three (SELECTED_SCALE_PHONE, NAME_NAVBAR_GAP_PX,
              NAME_TOP_OFFSET_PX, defined near the top of this file)
              are a starting estimate — check against Lara's real
              photos and nudge them together; there's no way to know
              exactly where a given photo's head sits without seeing it
              rendered.
              ============================================== */}

          <div
            className={`
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              bottom-[87.9%]
              max-sm:bottom-auto
              max-sm:top-[${NAME_TOP_OFFSET_PX}px]
              z-20
              max-sm:z-20
            `}
          >
            {/* TIP: model images are z-10 (z-12 for the selected one) —
                bumped to z-20 on mobile so the name always paints on top
                of the model instead of being covered by it if the model
                ever runs taller than expected (see the head-crop /
                hidden-name bug this fixed). */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={activeModel.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: TEXT_IN_SECONDS,
                        delay: TEXT_IN_DELAY_SECONDS,
                        ease: [0.22, 1, 0.36, 1],
                      },
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  transition: {
                    duration: reduceMotion ? 0 : TEXT_OUT_SECONDS,
                  },
                }}
                className="
                  font-['Raleway']
                  font-bold

                  tracking-[-0.07em]

                  text-[clamp(3rem,5vw,6rem)]
                  leading-[1.05]

                  text-[var(--maroon-dark)]

                  select-none
                  whitespace-nowrap
                "
              >
                {activeModel.name.toUpperCase()}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* ==============================================
              PODIUM — stays put; a ripple leaves it whenever
              a new model lands
              ============================================== */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2 sm:mb-4
                
              bottom-[-7.2%]

              z-0

              w-[clamp(8rem,12.7vw,15.24rem)]
              max-sm:w-[47vw]

              aspect-[243.81/116.05]
            "
          >

            {/* Soft floor glow — TIP: the dark shadow under the podium.
                Peak strength is the first alpha (0.14; it was 0.35).
                Lower it for an even lighter shadow, raise it for darker. */}
            <div
              className="
                absolute
                inset-0
                -z-10
              "
              style={{
                background:
                  "radial-gradient(ellipse 70% 65% at 50% 45%, rgba(76,5,25,0.05), rgba(76,5,25,0.03) 60%, transparent 80%)",
                filter: "blur(6px)",
              }}
            />

            {/* Base podium */}
            <svg
              viewBox={PODIUM_VIEWBOX}
              className="
                absolute
                inset-0
                h-full
                w-full
              "
              style={{
                opacity:
                  BASE_RING_OPACITY,
              }}
              fill="none"
            >
              {PODIUM_RINGS.map(
                (ring, i) => (
                  <ellipse
                    key={i}
                    cx={ring.cx}
                    cy={ring.cy}
                    rx={ring.rx}
                    ry={ring.ry}
                    stroke="var(--maroon-dark)"
                    strokeWidth={
                      PODIUM_STROKE_WIDTH
                    }
                    strokeDasharray={
                      PODIUM_DASH
                    }
                    strokeLinecap="round"
                  />
                )
              )}
            </svg>

            {/* Animated comet */}
            <svg
              viewBox={PODIUM_VIEWBOX}
              className="
                absolute
                inset-0
                h-full
                w-full
                overflow-visible
              "
              fill="none"
            >
              <defs>

                <linearGradient
                  id="podium-comet"
                  gradientUnits="userSpaceOnUse"
                  x1={
                    PODIUM_RINGS[0].cx -
                    PODIUM_RINGS[0].rx * 1.4
                  }
                  y1={
                    PODIUM_RINGS[0].cy
                  }
                  x2={
                    PODIUM_RINGS[0].cx +
                    PODIUM_RINGS[0].rx * 1.4
                  }
                  y2={
                    PODIUM_RINGS[0].cy
                  }
                >
                  {COMET_STOPS.map(
                    (stop, i) => (
                      <stop
                        key={i}
                        offset={
                          stop.offset
                        }
                        stopColor="var(--maroon-dark)"
                        stopOpacity={
                          stop.opacity
                        }
                      />
                    )
                  )}

                  <animateTransform
                    attributeName="gradientTransform"
                    type="rotate"
                    from={`0 ${PODIUM_RINGS[0].cx} ${PODIUM_RINGS[0].cy}`}
                    to={`360 ${PODIUM_RINGS[0].cx} ${PODIUM_RINGS[0].cy}`}
                    dur={`${SPIN_DURATION_SECONDS}s`}
                    begin={podiumDelay}
                    repeatCount="indefinite"
                  />
                </linearGradient>

                <filter
                  id="podium-glow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur
                    stdDeviation={
                      COMET_GLOW_BLUR
                    }
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

              </defs>

              {PODIUM_RINGS.map(
                (ring, i) => (
                  <ellipse
                    key={i}
                    cx={ring.cx}
                    cy={ring.cy}
                    rx={ring.rx}
                    ry={ring.ry}
                    stroke="url(#podium-comet)"
                    strokeWidth={
                      COMET_STROKE_WIDTH
                    }
                    strokeDasharray={
                      PODIUM_DASH
                    }
                    strokeLinecap="round"
                    filter="url(#podium-glow)"
                  />
                )
              )}
            </svg>

            {/*
              RIPPLE — now an always-on idle loop instead of a one-shot
              triggered by clicks. `repeat: Infinity` + `repeatDelay`
              makes each ring fade up, grow, fade out, pause, then do it
              again forever, so the podium never sits still. Each ring
              starts invisible at the outer podium's size, fades up
              quickly, then grows and fades out.
              vectorEffect="non-scaling-stroke" keeps the line a constant
              thin width while the ring scales. To make it subtler lower
              RIPPLE_PEAK_OPACITY or RIPPLE_END_SCALE; for a wider spread
              raise RIPPLE_END_SCALE; for a busier/calmer rhythm adjust
              RIPPLE_REPEAT_GAP_SECONDS.
            */}
            {!reduceMotion && [0, 1].map((ring) => (
              <motion.svg
                key={`idle-ripple-${ring}`}
                viewBox={PODIUM_VIEWBOX}
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  overflow-visible
                "
                fill="none"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{
                  scale: [0.92, RIPPLE_END_SCALE],
                  opacity: [0, RIPPLE_PEAK_OPACITY - ring * 0.2, 0],
                }}
                transition={{
                  // opacity: 0 → peak (quickly) → 0; scale: just grows;
                  // both loop forever with a short pause in between.
                  opacity: {
                    duration: RIPPLE_DURATION_SECONDS,
                    delay: ring * 0.14,
                    repeat: Infinity,
                    repeatDelay: RIPPLE_REPEAT_GAP_SECONDS,
                    times: [0, 0.18, 1],
                    ease: "easeOut",
                  },
                  scale: {
                    duration: RIPPLE_DURATION_SECONDS,
                    delay: ring * 0.14,
                    repeat: Infinity,
                    repeatDelay: RIPPLE_REPEAT_GAP_SECONDS,
                    ease: "easeOut",
                  },
                }}
                style={{ transformOrigin: "50% 50%" }}
              >
                <ellipse
                  cx={PODIUM_RINGS[0].cx}
                  cy={PODIUM_RINGS[0].cy}
                  rx={PODIUM_RINGS[0].rx}
                  ry={PODIUM_RINGS[0].ry}
                  stroke="var(--maroon-dark)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </motion.svg>
            ))}
          </div>

          {/* ==============================================
              THE MODELS — each one is placed by its offset
              from the middle and glides between slots
              ============================================== */}

          {slotWidth > 0 &&
            models.map((model, index) => (
              <HeroModel
                key={model.id}
                model={model}
                offset={wrapOffset(index - nav.active, count)}
                prevOffset={wrapOffset(index - nav.prevActive, count)}
                shift={-nav.move}
                moveId={nav.moveId}
                half={half}
                slotWidth={slotWidth}
                reduceMotion={reduceMotion}
                onSelect={handleSelect}
              />
            ))}

          {/* ==============================================
              PRICE ROW — same fade-out / fade-in as the name

              TIP — MOBILE: pushed further down (max-sm:mt-24, was
              max-sm:mt-12) so it sits clear of the podium instead of
              crowding it, now that the row above it is taller. This is
              also the block --hero-price-offset (in IMAGE_HEIGHT_SELECTED
              above) needs to roughly match, so the row height calc stays
              accurate.
              ============================================== */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              -translate-x-1/2
              top-full
              z-10

              mt-16 md:mt-18
              max-sm:mt-24

              w-[clamp(11rem,18.75vw,22.5rem)]
              max-sm:w-full
              max-sm:px-1
            "
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeModel.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: TEXT_IN_SECONDS,
                        delay: TEXT_IN_DELAY_SECONDS + 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      },
                }}
                exit={{
                  opacity: 0,
                  y: -4,
                  transition: {
                    duration: reduceMotion ? 0 : TEXT_OUT_SECONDS,
                  },
                }}
                className="grid grid-cols-3 items-center text-xl max-sm:grid-cols-[1fr_auto_1fr] sm:flex sm:justify-between"
              >
                {/* TIP — PHONES (Figma): the name is already the big word
                    behind the model, so the row is price on the left, a
                    little chevron stack in the middle and a bag button on
                    the right. From sm up it is the original name + price. */}
                <span
                  className="
                    uppercase
                    tracking-wide
                    max-sm:hidden
                  "
                >
                  {activeModel.name}
                </span>

                <span
                  className="
                    font-bold
                    tracking-[-0.04em]
                    max-sm:justify-self-start
                  "
                >
                  {formatNaira(
                    activeModel.price
                  )}
                </span>

                <span aria-hidden="true" className="sm:hidden -space-y-2.5 flex flex-col max-sm:justify-self-center items-center text-[var(--muted)]">
                  <ChevronUp size={18} strokeWidth={1.5} className="opacity-100" />
                  <ChevronUp size={18} strokeWidth={1.5} className="opacity-60" />
                  <ChevronUp size={18} strokeWidth={1.5} className="opacity-30" />
                </span>

                <Link
                  to={
                    activeModel.productId
                      ? `/product/${activeModel.productId}`
                      : isSampleModel(activeModel)
                        ? "/shop"
                        : `/product/${activeModel.id}`
                  }
                  aria-label={`Choose a size and add ${activeModel.name} to your bag`}
                  className="sm:hidden pointer-events-auto flex h-11 w-11 items-center justify-center max-sm:justify-self-end rounded-full bg-[var(--mauve-light)] text-[var(--ink)]"
                >
                  <ShoppingBag size={20} strokeWidth={1.5} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HERO — waits for the models, then mounts the carousel
   ============================================================

   `models` is null while the products are still loading: the stage is
   held open at the same height so the page doesn't jump when the
   carousel appears. `key` remounts the carousel if the list of models
   changes, so its selected-model state never points at a model that
   is no longer there.
*/
export default function Hero({ models }) {
  if (!models?.length) {
    return (
      <section
        id="hero"
        data-hero="true"
        data-no-rise="true"
        className="pt-12 md:pt-12 lg:pt-14 pb-24 md:pb-32"
      >
        <div className={`relative mx-auto ${PAGE_CONTAINER_PADDING}`}>
          <div className={`w-full ${IMAGE_HEIGHT_SELECTED}`} />
        </div>
      </section>
    );
  }

  return (
    <HeroCarousel
      key={models.map((model) => model.id).join("|")}
      models={models}
    />
  );
}