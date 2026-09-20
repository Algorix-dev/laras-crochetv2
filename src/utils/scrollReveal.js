/**
 * scrollReveal.js
 *
 * Global rise-from-below engine for Lara's Crochet (modelled on
 * Emmanuel's Algorix Portfolio).
 *
 * WHAT CHANGED IN THIS VERSION
 * ----------------------------
 * 1. REPLAYS EVERY TIME. Before, an element was revealed once and then
 *    permanently locked (unobserved + data-revealed). Now, when an element
 *    has fully left the screen it is reset to its hidden state, so it rises
 *    again the next time you scroll it into view, up or down.
 * 2. ONE BY ONE. Elements that become visible in the same moment are
 *    sorted top-to-bottom / left-to-right and given a small incremental
 *    delay, so a row of cards or a stack of blocks cascades instead of
 *    popping in together.
 * 3. EVERY PAGE. Anything inside a [data-page] wrapper (see App.jsx) is
 *    scanned and its top-level blocks are given the rise automatically -
 *    no need to hand-mark each page. Opt out with data-no-rise.
 * 4. CHEAPER ON PHONES. The old version ran getBoundingClientRect() on
 *    every hidden element on every scroll frame. IntersectionObserver
 *    already reports every entry/exit, so the scroll/resize sweeps are gone.
 *
 * Still true from before:
 * - Hero, the pinned LaraShowcase, navbar, bag drawer, dialogs and form
 *   controls are never animated by this engine.
 * - After a reveal finishes, transform is cleared (data-revealed) so it
 *   can't trap position:fixed descendants in a containing block.
 * - Safe for jsdom / SSR / prefers-reduced-motion.
 */

/* ------------------------------------------------------------
   TUNING
   ------------------------------------------------------------ */

// Delay added per element when several become visible together.
const STAGGER_STEP_MS = 90;
const STAGGER_MAX_MS = 450;

// How long after `.on` is added the transform is cleared (must be longer
// than the CSS transition + the longest possible delay).
const CLEANUP_AFTER_MS = 1200;

// An element counts as "in view" once 5% of it, or this many px, is inside
// the trigger band (the second rule is for very tall blocks).
const MIN_RATIO = 0.05;
const MIN_VISIBLE_PX = 120;

// Trigger band: the bottom 8% of the screen does not count, so things
// start rising a little way up the screen where you actually see it.
const ROOT_MARGIN = "0px 0px -8% 0px";

// Auto-detection limits.
const MAX_DEPTH = 6;
const MAX_AUTO_UNITS = 160;
// A container with this many children (or more) is treated as a list/grid:
// each child rises on its own instead of the container rising as one block.
const GROUP_MIN_CHILDREN = 4;

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "TEMPLATE",
  "NOSCRIPT",
  "LINK",
  "META",
  "BR",
]);

// Elements that are always animated as ONE piece (never descended into).
const LEAF_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "IMG",
  "PICTURE",
  "FIGURE",
  "UL",
  "OL",
  "DL",
  "TABLE",
  "FORM",
  "BUTTON",
  "A",
  "BLOCKQUOTE",
  "HR",
  "SVG",
  "CANVAS",
  "VIDEO",
]);

const FORM_CONTROL_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "LABEL",
]);

const STRUCTURAL_EXCLUDE_SELECTOR = [
  "[data-no-rise]",
  "[data-reveal-ignore]",
  "[data-hero]",
  "[data-pinned]",
  "#hero",
  "#lara-showcase",
  "nav",
  "#bag-drawer",
  "[role='dialog']",
  "[data-modal]",
  "[aria-hidden='true']",
].join(",");

/* ------------------------------------------------------------
   STATE
   ------------------------------------------------------------ */

// TIP: `let`, not `const`, so teardown can hand out a fresh WeakSet. In dev,
// React StrictMode runs init -> teardown -> init; elements registered with
// the first (disconnected) observer must be picked up by the second.
let observedElements = new WeakSet();

// Elements this engine added `.rv` to itself. If React later rewrites such an
// element's className (dropping `.rv`), we leave it alone instead of hiding
// it again with no observer to bring it back.
const autoMarked = new WeakSet();

const cleanupTimers = new WeakMap();

let globalObserver = null;
let globalMutationObserver = null;
let scanQueued = false;

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const isUsable = (el) =>
  el instanceof HTMLElement && !SKIP_TAGS.has(el.tagName);

/** Excluded by WHERE it is or WHAT it is (never by how it currently looks). */
function isStructurallyExcluded(el) {
  if (!el || !(el instanceof HTMLElement)) return true;
  if (el.closest(STRUCTURAL_EXCLUDE_SELECTOR)) return true;
  // Animating inputs directly breaks hitboxes, focus and autofill.
  return FORM_CONTROL_TAGS.has(el.tagName);
}

/** Not currently rendered (display:none itself or via an ancestor). */
function isUnrenderable(el) {
  if (typeof el.getClientRects === "function" && el.getClientRects().length === 0) {
    return true;
  }
  const style = window.getComputedStyle(el);
  return style.display === "none" || style.visibility === "hidden";
}

/** Auto-detected elements only: skip anything whose own geometry we'd break. */
function isGeometryBlocked(el) {
  const style = window.getComputedStyle(el);
  if (style.position === "fixed" || style.position === "sticky") return true;
  if (style.opacity === "0") return true;
  // An existing non-identity transform (e.g. rotated captions) would be
  // overwritten by the rise.
  return Boolean(style.transform) && style.transform !== "none";
}

/**
 * A "layered composition": a container whose children are positioned
 * absolutely (wordmark + photos, banner with models, etc). Splitting these
 * up would break their stacking, so they rise as ONE block.
 */
function isLayered(children) {
  return children.some((child) => {
    const position = window.getComputedStyle(child).position;
    return position === "absolute" || position === "fixed";
  });
}

function clearPendingCleanup(el) {
  const id = cleanupTimers.get(el);
  if (id !== undefined) {
    clearTimeout(id);
    cleanupTimers.delete(el);
  }
}

function scheduleCleanup(el, afterMs) {
  clearPendingCleanup(el);
  const id = setTimeout(() => {
    cleanupTimers.delete(el);
    // Only lock in the settled state if it is still revealed. (A reset in
    // the meantime cancels this timer, but be defensive anyway.)
    if (el.classList.contains("on")) {
      el.setAttribute("data-revealed", "true");
      el.style.removeProperty("transition-delay");
    }
  }, afterMs);
  cleanupTimers.set(el, id);
}

const HAS_DELAY_CLASS = /(^|\s)d[1-6](\s|$)/;

/* ------------------------------------------------------------
   REVEAL / RESET
   ------------------------------------------------------------ */

/**
 * Reveal a group of elements that became visible together, one after
 * another. `items` is [{ el, top, left }].
 */
function revealBatch(items) {
  const fresh = items.filter(({ el }) => !el.classList.contains("on"));
  if (fresh.length === 0) return;

  // Top to bottom (rows ~48px tall count as the same row), then left to right.
  fresh.sort((a, b) => {
    const rowDiff = Math.round(a.top / 48) - Math.round(b.top / 48);
    return rowDiff || a.left - b.left;
  });

  fresh.forEach(({ el }, index) => {
    const base = Number(el.getAttribute("data-rise-delay")) || 0;
    // Elements that already carry a .d1-.d6 class bring their own delay.
    const stagger = HAS_DELAY_CLASS.test(el.className)
      ? 0
      : Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS);
    const total = base + stagger;

    if (total > 0) el.style.transitionDelay = `${total}ms`;
    else el.style.removeProperty("transition-delay");

    el.classList.add("on");
    scheduleCleanup(el, CLEANUP_AFTER_MS + total);
  });
}

/** Reveal one element straight away (public helper). */
export function revealElement(el) {
  if (!el || el.classList.contains("on")) return;
  revealBatch([{ el, top: 0, left: 0 }]);
}

/** Put an element back to its hidden, ready-to-rise-again state. */
function resetElement(el) {
  if (!el.classList.contains("on")) return;
  clearPendingCleanup(el);
  el.removeAttribute("data-revealed");
  el.style.removeProperty("transition-delay");
  el.classList.remove("on");
}

function forceShow(el) {
  el.classList.add("on");
  el.setAttribute("data-revealed", "true");
}

function showAll(container) {
  container.querySelectorAll(".rv:not(.on)").forEach(forceShow);
}

function onIntersect(entries) {
  const entering = [];

  for (const entry of entries) {
    const el = entry.target;
    const visiblePx = entry.intersectionRect ? entry.intersectionRect.height : 0;

    if (
      entry.isIntersecting &&
      (entry.intersectionRatio >= MIN_RATIO || visiblePx >= MIN_VISIBLE_PX)
    ) {
      entering.push({
        el,
        top: entry.boundingClientRect.top,
        left: entry.boundingClientRect.left,
      });
    } else if (entry.intersectionRatio === 0) {
      // Fully out of the trigger band: get ready to rise again next time.
      resetElement(el);
    }
  }

  revealBatch(entering);
}

/* ------------------------------------------------------------
   AUTO-DETECTION ("rise units")
   ------------------------------------------------------------ */

function consider(el, depth, out) {
  if (out.length >= MAX_AUTO_UNITS || SKIP_TAGS.has(el.tagName)) return;

  // Explicitly marked in JSX (or by a previous scan).
  if (el.classList.contains("rv")) {
    out.push(el);
    return;
  }

  if (isStructurallyExcluded(el) || autoMarked.has(el) || isUnrenderable(el)) {
    return;
  }

  // Hand-marked blocks (kept from the old system): rise as one piece -
  // unless they contain hand-placed .rv elements, which then rise instead
  // (never both, or the block and its contents would move twice).
  if (
    (el.hasAttribute("data-auto-rise") || el.hasAttribute("data-reveal")) &&
    !el.querySelector(".rv")
  ) {
    if (!isGeometryBlocked(el)) out.push(el);
    return;
  }

  const kids = Array.from(el.children).filter(isUsable);

  // Explicit stagger group: every child is its own unit.
  if (el.hasAttribute("data-stagger-group")) {
    kids.forEach((kid) => consider(kid, MAX_DEPTH, out));
    return;
  }

  // Contains hand-placed .rv elements or hand-marked blocks somewhere
  // inside (e.g. a <form> wrapping several data-auto-rise sections): don't
  // animate the container as well, just look inside it.
  if (el.querySelector(".rv, [data-auto-rise], [data-reveal]")) {
    kids.forEach((kid) => consider(kid, depth + 1, out));
    return;
  }

  if (isGeometryBlocked(el)) return;

  if (LEAF_TAGS.has(el.tagName) || depth >= MAX_DEPTH || kids.length === 0) {
    out.push(el);
    return;
  }

  if (isLayered(kids)) {
    out.push(el);
    return;
  }

  if (kids.length >= GROUP_MIN_CHILDREN) {
    // A list / grid: each child rises on its own (one by one).
    kids.forEach((kid) => consider(kid, MAX_DEPTH, out));
    return;
  }

  // A plain layout wrapper: look inside.
  kids.forEach((kid) => consider(kid, depth + 1, out));
}

/* ------------------------------------------------------------
   SCANNING
   ------------------------------------------------------------ */

function observeElement(el) {
  if (observedElements.has(el)) return;
  observedElements.add(el);
  globalObserver.observe(el);
}

/**
 * Finds every element that should rise (hand-placed .rv elements plus
 * auto-detected blocks inside [data-page]) and hands them to the observer.
 * Safe to call repeatedly; already-registered elements are skipped.
 */
export function scanAndRegisterElements(container = document.body) {
  if (typeof window === "undefined" || !container) return;

  if (prefersReducedMotion() || !globalObserver) {
    // Nothing will ever animate them, so make sure nothing stays hidden.
    showAll(container);
    return;
  }

  const targets = new Set();

  // 1. Hand-placed .rv elements (e.g. <Reveal>, About page).
  container.querySelectorAll(".rv").forEach((el) => {
    if (isStructurallyExcluded(el)) {
      // e.g. an .rv inside the hero: never leave it stuck invisible.
      forceShow(el);
      return;
    }
    targets.add(el);
  });

  // 2. Auto-detected blocks inside each page wrapper.
  const roots = [];
  if (container.matches && container.matches("[data-page]")) roots.push(container);
  container.querySelectorAll("[data-page]").forEach((root) => roots.push(root));

  const units = [];
  roots.forEach((root) => {
    Array.from(root.children).filter(isUsable).forEach((kid) => consider(kid, 0, units));
  });

  units.forEach((el) => {
    if (!el.classList.contains("rv")) {
      el.classList.add("rv");
      autoMarked.add(el);
    }
    targets.add(el);
  });

  targets.forEach(observeElement);
}

/**
 * All scan requests inside one tick collapse into one microtask. It is a
 * microtask (not requestAnimationFrame) on purpose: it runs BEFORE the
 * browser paints the freshly mounted content, so newly added blocks are
 * hidden from their very first frame instead of flashing visible and then
 * fading out.
 */
function scheduleScan() {
  if (scanQueued) return;
  scanQueued = true;
  Promise.resolve().then(() => {
    scanQueued = false;
    // Torn down in the meantime (StrictMode / unmount): nothing to do.
    if (!globalObserver) return;
    scanAndRegisterElements(document.body);
  });
}

/**
 * Manual sweep: reveal anything currently inside the trigger band.
 * (The observer normally does this by itself; kept for callers that
 * want to force it, e.g. after a layout-changing action.)
 */
export function sweepVisibleElements() {
  if (typeof window === "undefined") return;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const bandBottom = viewportHeight * 0.92;

  const items = [];
  document.querySelectorAll(".rv:not(.on)").forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && rect.top < bandBottom && rect.bottom > 0) {
      items.push({ el, top: rect.top, left: rect.left });
    }
  });
  revealBatch(items);
}

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */

export function initScrollReveal() {
  if (typeof window === "undefined") return () => {};

  if (!("IntersectionObserver" in window)) {
    // Very old browser: no animation, but never leave content hidden.
    showAll(document.body);
    return () => {};
  }

  if (!globalObserver) {
    globalObserver = new IntersectionObserver(onIntersect, {
      // Several thresholds so we hear about tall blocks early and get a
      // callback both when an element enters and when it fully leaves.
      threshold: [0, 0.01, MIN_RATIO],
      rootMargin: ROOT_MARGIN,
    });
  }

  scanAndRegisterElements(document.body);

  // Pick up content React mounts later (route changes, fetched products).
  if (!globalMutationObserver && "MutationObserver" in window) {
    globalMutationObserver = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          scheduleScan();
          return;
        }
      }
    });

    globalMutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  return () => {
    if (globalObserver) {
      globalObserver.disconnect();
      globalObserver = null;
    }
    if (globalMutationObserver) {
      globalMutationObserver.disconnect();
      globalMutationObserver = null;
    }
    observedElements = new WeakSet();
  };
}