import Reveal from "./Reveal";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import arcSwirl from "../assets/decor/arc-swirl.png";

// TIP: this replaces the old LaraShowcase.jsx. That version pinned
// the section and scrubbed everything (photos, paragraphs,
// testimonials) frame-by-frame off scroll progress — cool effect,
// but the Figma export shows all of this content sitting still on
// the page at once, nothing animates in/out as you scroll past it.
// So this is the same real copy and the same 3 reference photos,
// just laid out statically. The only animation left is Reveal — the
// same gentle fade-up-on-scroll-into-view used elsewhere on the
// site (Hero, ProductGrid, etc.) — so this section still feels
// consistent with the rest of the page instead of flat and static.
// The LARA wordmark itself is the real Genty Demo export
// (lara-wordmark-solid.png), not a font substitute — same approach
// as the Footer's monogram and the Navbar logo.

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",
  "We don't keep a stockroom.",
  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",
  "This isn't fast fashion. It's handmade, made with love.",
];

// TIP: these are real customer quotes Emmanuel already wrote in the
// old LaraShowcase file (better than the Figma's own placeholder
// "Untitled..." template text) — carried over as-is, just rendered
// in a plain CSS grid instead of scroll-triggered fade groups.
const TESTIMONIALS = [
  { quote: "I've never had a piece fit this well straight out of the box. Literally made to my measurements. No alterations needed.", name: "Teniola Aladese" },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: "Tolu Coker" },
  { quote: "The bikini set held up through an entire beach trip. No stretching, no losing shape. Genuinely impressed.", name: "Halima Finny" },
  { quote: "The Reina dress is a whole moment. I get stopped every single time I wear it.", name: "Chidinma K." },
  { quote: "Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.", name: "Precious Ehizoge" },
  { quote: "Customer service walked me through sizing so patiently. Made ordering online feel less scary.", name: "Ejiro Okezie" },
];

// TIP: static end-position of the 3 scattered reference photos, taken
// straight from the old file's `to` values (the position they used
// to settle into once you'd scrolled all the way through the pin).
// Same visual result, no scroll math needed to get there anymore.
const SCATTER_PHOTOS = [
  { src: scatterBeach, alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach", style: { transform: "translate(-13px, 8px) rotate(0deg)", zIndex: 3 } },
  { src: scatterStreet, alt: "Street-style portrait, styling reference", style: { transform: "translate(7px, -8px) rotate(19.63deg)", zIndex: 2 } },
  { src: scatterTeal, alt: "Lara's Crochet customer wearing a teal crochet dress", style: { transform: "translate(23px, 10px) rotate(-8.21deg)", zIndex: 1 } },
];

export default function BrandStory() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 text-center">
      {/* Decorative crochet-thread arcs behind the wordmark/copy —
          Figma's Group 30 (left) + Group 32 (right, same asset
          mirrored via scaleX(-1) rather than a second file, since
          Group 32 is pixel-for-pixel Group 30 flipped).

          Group 30/32 are the exact same 1341x556 / 1365x556 boxes
          used behind the Custom Orders wordmark in
          CustomOrderBanner.jsx — Figma just repositions them lower
          on the page here (top:824/823px vs top:194/193px), nothing
          else changes. So this reuses CustomOrderBanner's width/left
          values (98.24vw / -13.48vw and 53.44vw, tuned there to
          match the arc-swirl.png asset's actual padding, since the
          literal 1341px/1920 conversion undersizes it) and only
          swaps in this section's own top offset: 824.32/1920=42.9vw,
          823/1920=42.86vw.

          This layer lives in its own full-bleed wrapper (same
          pattern as CustomOrderBanner) instead of inside the
          max-w-4xl content box below. It was nested inside that
          narrow, overflow-clipped box before, which cut the arcs
          down to whatever sliver fell inside 896px — that's why
          they weren't showing up. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <img
          src={arcSwirl}
          alt=""
          className="select-none absolute opacity-20 blur-[4.5px]"
          style={{ width: "98.24vw", left: "-13.48vw", top: "42.9vw", maxWidth: "none" }}
        />
        <img
          src={arcSwirl}
          alt=""
          className="select-none absolute opacity-20 blur-[4.5px]"
          style={{ width: "98.24vw", left: "53.44vw", top: "42.86vw", maxWidth: "none", transform: "scaleX(-1)" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-5">
        {/* Lara wordmark + photo stack — real Genty Demo export now
            (lara-wordmark-solid.png), photos centered over it the way
            the Figma has them sitting over the R/A, instead of the old
            Yellowtail-text-plus-side-photos placeholder. */}
        <Reveal>
          <div className="relative mx-auto mb-14 md:mb-20 w-full max-w-[560px] md:max-w-[720px]">
            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="w-full h-auto select-none pointer-events-none"
            />
            <div className="absolute left-1/2 top-1/2 w-[110px] h-[80px] sm:w-[140px] sm:h-[100px] md:w-[160px] md:h-[115px] -translate-x-1/2 -translate-y-1/2">
              {SCATTER_PHOTOS.map((p) => (
                <img
                  key={p.alt}
                  src={p.src}
                  alt={p.alt}
                  style={p.style}
                  className="absolute inset-0 w-full h-full object-cover shadow-md"
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* Brand story copy — all visible at once, like the Figma, not
            cycled one paragraph at a time */}
        <Reveal delay={0.1}>
          <div className="relative max-w-lg mx-auto space-y-5 text-sm md:text-base leading-[1.8] text-[var(--ink)]">
            {PARAGRAPHS.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        {/* Testimonials */}
        <div className="relative mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={0.05 * i}>
              <div className="h-full border border-[var(--line)] bg-[var(--cream)] p-5 text-center">
                <p className="mb-4 text-sm leading-relaxed text-[var(--ink)]">"{t.quote}"</p>
                <p className="flex items-center justify-center gap-1 text-xs font-bold text-[var(--ink)]">
                  {t.name}
                  <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-[9px] text-white">
                    ✓
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">Verified Customer</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}