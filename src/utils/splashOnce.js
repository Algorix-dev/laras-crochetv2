import { IS_REAL_PAGE_LOAD, INITIAL_PATHNAME } from "./pageLoadType";

// TIP — WHY A PLAIN MODULE VARIABLE, NOT REACT STATE OR sessionStorage:
// Per Lara's feedback, the branded logo splash (BrandedLoader) should
// only ever appear on an actual browser reload — never when someone
// just clicks from Home to Shop, or switches a category tab, inside
// the running app. This module only runs ONCE per real page load: the
// browser re-executes every JS file from scratch on an actual reload,
// which resets `claimed` back to false — but clicking around the SPA
// afterwards never re-runs this file, so `claimed` stays true for the
// rest of that visit. sessionStorage would NOT work here: it survives
// reloads on purpose, so it can't tell a reload apart from a click.
let claimed = false;

// Call this from the page's own loading check, passing its route
// (e.g. "/shop"). Only the page matching the URL the browser was
// actually on when it loaded/reloaded gets `true`, and only once —
// every other page, and every later loading moment on the same page
// (a category tab switch, navigating away and back), gets `false`
// and should show the lighter ProductGridSkeleton-style loader
// instead.
export function shouldShowSplash(pathname) {
  if (claimed) return false;
  if (pathname !== INITIAL_PATHNAME) return false;
  claimed = true;
  return IS_REAL_PAGE_LOAD;
}
