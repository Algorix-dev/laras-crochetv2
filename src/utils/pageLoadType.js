// TIP — HOW WE TELL A RELOAD APART FROM AN IN-APP CLICK:
// The Navigation Timing API records, once per document, HOW the browser
// arrived at this page. "navigate" (typed URL / bookmark / external
// link), "reload" (hit refresh) and "back_forward" (back/forward
// buttons) are all real document loads. Clicking a <Link> inside this
// SPA never triggers a new one of these — react-router just swaps
// components — so this value stays fixed for the page's whole visit
// once read here at module-eval time (i.e. the moment the browser
// actually loaded/reloaded this document).
const entry =
  typeof performance !== "undefined" &&
  typeof performance.getEntriesByType === "function" &&
  performance.getEntriesByType("navigation")[0];

export const IS_REAL_PAGE_LOAD = entry
  ? ["navigate", "reload", "back_forward"].includes(entry.type)
  : true; // no Navigation Timing support in this browser: fail open

// TIP — WHICH ROUTE WAS ACTUALLY LOADED: only the ONE page that matches
// the URL the browser was on on load/reload should ever get the
// branded splash — see splashOnce.js. Read once, same reasoning as
// IS_REAL_PAGE_LOAD above.
export const INITIAL_PATHNAME =
  typeof window !== "undefined" ? window.location.pathname : null;
