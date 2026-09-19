/**
 * scrollReveal.js
 *
 * Global auto-rise and outermost-element detection engine for Lara's Crochet.
 * Inspired by Emmanuel's Algorix Portfolio (https://algorix-portfolio.vercel.app/).
 *
 * Features:
 * - Outermost-element detection algorithm avoiding double animation.
 * - Ancestor eligibility conflict resolution.
 * - Exclusion of Hero, pinned sections, fixed overlays, and interactive form inputs.
 * - Fast-scroll sweep so fast flings never skip elements.
 * - Mid-page scroll landing handler for instant above-fold reveal.
 * - MutationObserver for dynamic asynchronously loaded content.
 * - Transition cleanup: resets transform to 'none' upon completion to prevent
 *   stacking-context & containing-block bugs on fixed/sticky descendants.
 * - Safe for jsdom / SSR / prefers-reduced-motion.
 */

// Track observed and revealed elements across the page lifecycle
const observedElements = new WeakSet();
const animatedElements = new WeakSet();

let globalObserver = null;
let globalMutationObserver = null;
let sweepScheduled = false;

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Checks if an element or any of its ancestors should be excluded
 */
function isExcluded(el) {
  if (!el || !(el instanceof HTMLElement)) return true;

  // Explicit ignores
  if (
    el.hasAttribute("data-no-rise") ||
    el.hasAttribute("data-reveal-ignore") ||
    el.hasAttribute("data-hero") ||
    el.hasAttribute("data-pinned")
  ) {
    return true;
  }

  // Pinned, hero, or fixed overlays
  if (
    el.closest("#hero") ||
    el.closest("#lara-showcase") ||
    el.closest("[data-hero]") ||
    el.closest("[data-pinned]") ||
    el.closest("nav") ||
    el.closest("#bag-drawer") ||
    el.closest("[role='dialog']") ||
    el.closest("[data-modal]") ||
    el.closest("[aria-hidden='true']")
  ) {
    return true;
  }

  // Interactive inputs and form controls (animating them directly breaks hitboxes/focus/autofill)
  const tag = el.tagName.toLowerCase();
  if (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    tag === "option" ||
    tag === "label"
  ) {
    return true;
  }

  // Hidden elements
  if (
    el.offsetParent === null &&
    window.getComputedStyle(el).position !== "fixed"
  ) {
    return true;
  }

  const style = window.getComputedStyle(el);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return true;
  }

  // Elements with explicit existing non-identity transform (e.g. rotated captions like "MEET LARA")
  if (
    style.transform &&
    style.transform !== "none" &&
    !el.classList.contains("rv")
  ) {
    return true;
  }

  // Fixed or sticky elements (transform would break their viewport anchoring)
  if (style.position === "fixed" || style.position === "sticky") {
    return true;
  }

  return false;
}

/**
 * Checks if any ancestor of el is already designated to animate.
 * Prevents "nested double rise" unless explicitly designated as a stagger child.
 */
function hasAnimatedAncestor(el) {
  let parent = el.parentElement;
  while (parent && parent !== document.body) {
    if (parent.hasAttribute("data-reveal-wrapper")) {
      return true;
    }
    if (parent.classList && parent.classList.contains("rv")) {
      // If child is explicitly marked as a stagger card inside a group, allow it
      if (el.hasAttribute("data-stagger-child") || el.hasAttribute("data-reveal-card")) {
        return false;
      }
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Transition completion handler:
 * Clears the transform and will-change property so the element returns to static geometry.
 */
function handleRevealComplete(el) {
  if (!el || animatedElements.has(el)) return;
  animatedElements.add(el);

  const cleanup = () => {
    el.setAttribute("data-revealed", "true");
    el.removeEventListener("transitionend", onEnd);
  };

  const onEnd = (e) => {
    // Only trigger on the element itself, not bubbling from children
    if (e.target === el && (e.propertyName === "transform" || e.propertyName === "opacity")) {
      cleanup();
    }
  };

  el.addEventListener("transitionend", onEnd, { passive: true });

  // Safety timeout in case transitionend does not fire (e.g. tab switched)
  setTimeout(cleanup, 850);
}

/**
 * Triggers reveal on an individual element
 */
export function revealElement(el) {
  if (!el || el.classList.contains("on")) return;

  el.classList.add("on");
  handleRevealComplete(el);

  if (globalObserver) {
    globalObserver.unobserve(el);
  }
}

/**
 * Sweeps any elements currently above or within view.
 * Essential for fast flings, trackpad flick scrolling, and mid-page landings!
 */
export function sweepVisibleElements() {
  if (typeof window === "undefined") return;

  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const elements = document.querySelectorAll(".rv:not(.on)");

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const rect = el.getBoundingClientRect();
    // Reveal if it has entered the viewport or was already scrolled past
    if (rect.top <= windowHeight + 20) {
      revealElement(el);
    }
  }
}

/**
 * Schedule a sweep using requestAnimationFrame to prevent layout thrashing
 */
function scheduleSweep() {
  if (sweepScheduled) return;
  sweepScheduled = true;
  requestAnimationFrame(() => {
    sweepVisibleElements();
    sweepScheduled = false;
  });
}

/**
 * Outermost-element scanner:
 * Discovers candidates across the container, groups card grids, and attaches .rv
 */
export function scanAndRegisterElements(container = document.body) {
  if (typeof window === "undefined" || !container) return;

  if (prefersReducedMotion()) {
    // Reveal everything immediately if reduced motion is requested
    const unrevealed = container.querySelectorAll(".rv:not(.on)");
    unrevealed.forEach((el) => {
      el.classList.add("on");
      el.setAttribute("data-revealed", "true");
    });
    return;
  }

  // 1. Register explicit .rv elements already placed in JSX
  const explicitElements = container.querySelectorAll(".rv");
  explicitElements.forEach((el) => {
    if (isExcluded(el)) return;
    registerElement(el);
  });

  // 2. Scan for candidate block roots (e.g. sections, article cards, heading rows)
  const candidateSelectors = [
    "[data-auto-rise='true']",
    "[data-reveal='true']",
    "section > h1:not(.rv)",
    "section > h2:not(.rv)",
    "section > h3:not(.rv)",
    ".product-card:not(.rv)",
    "[data-stagger-group] > *:not(.rv)",
  ];

  const candidates = container.querySelectorAll(candidateSelectors.join(","));

  candidates.forEach((el) => {
    if (isExcluded(el)) return;
    if (hasAnimatedAncestor(el)) return;

    if (!el.classList.contains("rv")) {
      el.classList.add("rv");
    }
    registerElement(el);
  });

  // 3. Coordinate stagger delays on grid children if container has data-stagger-group
  const staggerGroups = container.querySelectorAll("[data-stagger-group]");
  staggerGroups.forEach((group) => {
    const children = Array.from(group.children).filter(
      (c) => !isExcluded(c) && c.classList.contains("rv")
    );
    children.forEach((child, index) => {
      const staggerClass = `d${Math.min((index % 6) + 1, 6)}`;
      child.classList.add(staggerClass);
    });
  });

  // Immediate sweep for elements already visible
  scheduleSweep();
}

/**
 * Registers an individual element into the IntersectionObserver
 */
function registerElement(el) {
  if (!el || observedElements.has(el)) return;
  observedElements.add(el);

  // If already scrolled past, reveal immediately
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  if (rect.top <= windowHeight) {
    revealElement(el);
    return;
  }

  if (globalObserver) {
    globalObserver.observe(el);
  }
}

/**
 * Initializes the global IntersectionObserver and MutationObserver
 */
export function initScrollReveal() {
  if (typeof window === "undefined") return () => {};

  if (!("IntersectionObserver" in window)) {
    // Fallback for environments lacking IntersectionObserver
    sweepVisibleElements();
    return () => {};
  }

  // Create global IntersectionObserver with tuned threshold and margin
  if (!globalObserver) {
    globalObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px", // Snappy reveal right before entering eye level
      }
    );
  }

  // Attach passive scroll and resize listeners for fast-scroll sweeps
  window.addEventListener("scroll", scheduleSweep, { passive: true });
  window.addEventListener("resize", scheduleSweep, { passive: true });

  // Initial scan
  scanAndRegisterElements(document.body);

  // Set up MutationObserver to detect dynamically mounted nodes
  if (!globalMutationObserver && "MutationObserver" in window) {
    globalMutationObserver = new MutationObserver((mutations) => {
      let needsScan = false;
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          needsScan = true;
          break;
        }
      }
      if (needsScan) {
        scanAndRegisterElements(document.body);
      }
    });

    globalMutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Return teardown function
  return () => {
    window.removeEventListener("scroll", scheduleSweep);
    window.removeEventListener("resize", scheduleSweep);
    if (globalObserver) {
      globalObserver.disconnect();
      globalObserver = null;
    }
    if (globalMutationObserver) {
      globalMutationObserver.disconnect();
      globalMutationObserver = null;
    }
  };
}
