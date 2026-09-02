# Lara's Crochet — Project Handoff

For whoever (human or AI) picks this up next. Written mid-build, so it
covers what exists, what was decided and why, and what's still open.

## The job

Emmanuel (a CS student, freelance developer, brand: Algorix-dev) is
building his **first paid client site** — ₦30,000 agreed price — for
**Lara's Crochet**, a handmade crochet/knit swimwear and dress brand
out of Lagos, Nigeria. Made-to-order, no stockroom. Client sent a
Figma prototype (unfinished, still being designed) and wants the site
built from it, live for a same-evening deadline originally, though
the relationship is ongoing and iterating.

**Scope, as understood:**
- Public storefront: hero, category intro, product grid, custom-order
  section, footer — all built.
- Product detail page (color/shade/size selectors, add to bag) —
  **not built yet**, this is the next major piece.
- Payment integration — Paystack or Flutterwave, **not built yet**.
  Needs a small backend (see "Payment gateway" section below).
- Client wants scroll-triggered "swipe up and settle" motion across
  sections, "not too much."

## Stack

- **Vite + React** (`npm create vite`, template `react`, not TS)
- **Tailwind CSS v4** — note this is the *new* config style: no
  `tailwind.config.js`, just `@tailwindcss/vite` plugin in
  `vite.config.js` and `@import "tailwindcss";` at the top of
  `src/index.css`. Don't reach for the old v3 config-file pattern.
- **framer-motion** — all scroll-reveal and carousel animation
- **lucide-react** — icon set (Heart, Share2, MoreVertical,
  ShoppingBag, User, ChevronDown, Menu, X). Chosen because it's
  clean/generic and looks far better than emoji, but it is **not**
  Lara's actual icon set — if she sends real SVGs, swap them in.
- **react-router-dom** — installed, not yet wired up (no routes
  exist yet; everything is one page in `App.jsx`). Will be needed
  once the product detail page exists.
- Deploy target: not chosen yet. Vercel or Netlify both fine for the
  frontend. See "Payment gateway" for backend hosting notes.

## Design tokens (`src/index.css`)

```css
--maroon: #4a0e1e;      /* custom order banner, accents */
--maroon-dark: #350a16;
--cream: #f7f6f3;        /* page background */
--ink: #15141a;          /* body text */
--muted: #6f6d76;        /* secondary text */
--line: #e4e2dd;         /* borders/dividers */
--mauve: #c9aeb4;        /* footer monogram */
```
Fonts: `Instrument Serif` (italic, for the "Lara's Crochet" wordmark
and the big product-name display text, `.font-display` class) +
`Inter` (body). Both loaded via Google Fonts `@import` at the top of
`index.css`.

**Client feedback so far on color/branding:** none yet beyond "the
navbar font/weight/color needs work" (flagged, not yet fixed —
still open). Emmanuel was told explicitly: **never silently change a
color/style choice — tell him how to change it in code himself** if
it's a minor tweak, rather than just doing it. This preference should
carry forward.

## File structure

```
src/
  data/
    products.js       — product data. See below, this had a major
                         restructure partway through the build.
  components/
    Navbar.jsx         — responsive, real icons, mobile hamburger
    Hero.jsx           — see "Hero section" below, most-iterated part
    CategoryIntro.jsx  — "Bikinis/Dresses/Two-Pieces" + brand story copy
    ProductGrid.jsx    — grid of ProductCard, staggered Reveal
    ProductCard.jsx    — name left / price right (not stacked)
    CustomOrderBanner.jsx — maroon section, horizontal scroll on mobile
    Footer.jsx          — link columns + big "LC" cursive monogram
    Reveal.jsx           — THE scroll-animation wrapper, reused everywhere
    ProductPlaceholder.jsx — SVG silhouette fallback, kept only as a
                              safety net for products with no photo yet;
                              not currently visible anywhere since all
                              current products have real images
  assets/
    reina-front.png         — front-facing shot, trimmed/transparent
    reina-three-quarter.png — 3/4 turn, facing left
    reina-profile.png       — full side profile, facing left
    reina-back.png          — back view (not used yet — earmarked for
                               product detail page thumbnails)
```

## Hero section — the most-iterated part, read this carefully

This went through **four different versions** based on client
feedback. Know the history so you don't repeat mistakes:

1. **v1:** flat row of 5 images with negative-margin overlap under
   the "REINA" wordmark, no interactivity.
2. **v2:** made it a real carousel — clicking a thumbnail set it
   active, but it was modeled as **5 different products** (Amara,
   Zuri, Reina, Nia, Simi) with different fake prices. **This was
   wrong** — client's actual photoshoot is one product from multiple
   camera angles, not five products. Caught in v4.
3. **v3:** added a background card (`bg-[#efece6] rounded-md`)
   behind the active image to mimic what looked like a container in
   a reference screenshot. **Also wrong** — client's actual Figma has
   NO background box at all. The "card" look in her design is just
   the product photo's own transparent-PNG edges plus the big
   wordmark text showing through the transparent areas behind it —
   an illusion created by PNG alpha + z-index, not an actual div.
   Client explicitly said: no bg color, no box-shadow on a container,
   only a soft ground-shadow ellipse under the model's feet.
4. **v4 (current):** single product, `angles` array of 5 entries.
   Real photoshoot only had 4 distinct angles (front, 3/4-turn,
   profile, back), all shot facing left. Since there's no right-
   facing shot, the two right-side carousel slots **reuse the
   left-facing photos with `flip: true`**, mirrored via CSS
   `scaleX(-1)` in `Hero.jsx`. This is a legitimate technique (shoots
   often only cover one side, body treated as symmetric) but it's a
   judgment call — flag it to the client so she knows "5 angles" is
   really "4 photos, one mirrored." The back view isn't in the hero
   rotation; it's saved for the product detail page.

**Current Hero mechanics**, for whoever edits this next:
- All 5 angle images render simultaneously (nothing mounts/unmounts
  on click) — only `opacity`/`scale`/`scaleX` animate via
  framer-motion. This is deliberate: animating properties on
  persistent nodes is smoother than remounting elements.
- Ground shadow is a blurred `div` positioned at the bottom of the
  active image (`bg-black/20 blur-md rounded-full`), not a box-shadow
  on a container.
- Accessibility: the clickable wrapper is a `<div role="button"
  tabIndex={0}>` with `onKeyDown` for Enter/Space, NOT a real
  `<button>` — because it contains real `<button>` elements (heart/
  share/more), and a `<button>` cannot contain another `<button>` in
  valid HTML. This was a real bug caught and fixed mid-build; don't
  reintroduce it.
- `products.js` exports `heroProduct` (the single product +
  `angles` array) separately from `products` (the array used by the
  grid below, which currently has 3 entries, all pointing to the
  same `reina-front.png` since only one product exists so far).

## What's confirmed vs. still placeholder

**Confirmed / real:**
- Brand name, copy in `CategoryIntro.jsx` (from her Figma directly)
- Reina product name + ₦70,000 price
- All product photography currently in `src/assets/` (from client)
- Color palette approximation (sampled from her Figma screenshots —
  not confirmed exact hex values from her)

**Still placeholder / needs client input:**
- Icon set (using lucide-react, not her exact icons)
- Currency-selector flag (crude 3-stripe placeholder, not a real
  Nigerian flag asset)
- Navbar wordmark styling (client flagged font/weight/color as off,
  not yet fixed)
- Only one real product exists (Reina) — grid shows it 3x as a
  stand-in for a real catalog
- Custom order banner reuses the one product photo 4x

## Payment gateway (not built yet)

Plan discussed with Emmanuel, not yet implemented:
- Paystack or Flutterwave Inline JS on the frontend (works fine with
  plain fetch/vanilla JS, no React-specific library required)
- **Must** verify the transaction server-side before marking an order
  paid — client-side "success" callbacks can be spoofed. Needs a
  small backend (Node/Express on Render or Railway, or Vercel
  serverless functions) with a verify-transaction route that calls
  Paystack/Flutterwave's REST API using the *secret* key.
- Secret key must never ship in frontend code — `.env` +
  `.gitignore`, standard practice, was explained to Emmanuel already.

## Product catalog / CMS question (discussed, decision made)

Emmanuel asked how the client will add products after launch, since
there's no admin panel. Decision: **for this ₦30k first project,
products stay hardcoded in `products.js`.** Client sends new product
photos/details to Emmanuel directly, he edits the file and redeploys.
A self-serve admin panel (Supabase backend + custom upload page, or a
headless CMS like Sanity) was discussed as a legitimate future
upsell/phase 2, not something to build now — flagged as a separate,
separately-priced piece of work, not implied as included in the
current ₦30k.

## Working style notes for whoever continues this

- Emmanuel is a CS student, comfortable with HTML/CSS/JS/Tailwind,
  new to React — he's learning ON this project deliberately and
  wants **tips/hints explaining the "why"** behind code choices, not
  just code dropped in silently. Keep leaving TIP comments in the
  code itself (see the existing files for the tone/format used) —
  he's reading them.
- He wants iterative screenshot-based feedback loops — expect him to
  paste side-by-side screenshots of his Figma vs. the live build and
  point out specific mismatches. Take those comparisons literally and
  precisely; he corrects the model on misreadings (e.g. the "invisible
  container" clarification, the "5 angles not 5 products"
  realization) — build the habit of double-checking which screenshot
  is "the design" vs. "the current build" before assuming.
- Explicit instruction from him: don't silently change colors/styles
  he might want control over — explain how to change them in code so
  he can do it himself when it's a minor tweak.
- Accessibility and responsiveness are explicit requirements he
  cares about (asked for keyboard focus states, `prefers-reduced-
  motion`, aria-labels, mobile/tablet/desktop) — keep holding that
  bar, don't relax it for speed.
