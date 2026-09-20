import laraPortrait from "../assets/lara-portrait.webp";
import laraSunglasses from "../assets/lara-sunglasses.webp";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <main className="flex flex-col md:flex-row md:items-stretch">
        {/* Left image — desktop only. On mobile, Figma wants the heading
            first and this photo second, so it's hidden here and a mobile-
            only copy is rendered inline below instead of restructuring the
            whole flex order. */}
        <div className="hidden md:block md:w-1/2 md:flex-shrink-0">
          <img
            src={laraSunglasses}
            alt="Lara — founder of Lara's Crochet"
            className="block h-full min-h-0 w-full object-cover"
          />
        </div>

        {/* Right content */}
        {/* TIP — 1920×1080 FIT: this column used to be py-12 (48px top +
            48px bottom) at every size. The heading, portrait, story and
            Instagram link stack to a bit over the ~1014px available under
            the 66px navbar, so the link fell just below the fold. Mobile
            keeps py-12; from md up the padding tightens (md:py-6 →
            lg:py-8 → 2xl:py-6). To give it more/less air, change the
            number after `py-` on the matching breakpoint below. */}
        <section className="flex w-full items-center justify-center px-6 py-12 text-center sm:px-10 md:w-1/2 md:px-8 md:py-6 lg:px-12 lg:py-8 xl:px-16 2xl:py-6">
          <div className="flex w-full max-w-[560px] flex-col items-center">
            {/* Heading */}
            <img
              src={aboutHeadingLockup}
              alt="This is Lara's Crochet"
              className="rv h-auto w-full max-w-[420px]"
            />

            {/* TIP: mobile-only duplicate of the left-column photo.
                Figma's mobile flow is heading -> this photo -> portrait,
                but desktop wants it as a separate full-height left column
                instead — easiest way to satisfy both without fighting flex
                order across a bunch of sibling elements is to render it
                twice and toggle visibility per breakpoint. */}
            <img
              src={laraSunglasses}
              alt="Lara — founder of Lara's Crochet"
              className="rv d1 mt-8 block h-auto w-full max-w-[420px] object-cover md:hidden"
            />

            {/* Meet Lara + portrait */}
            {/* TIP — STAGGER: .rv starts the element hidden + 30px low and
                the engine (scrollReveal.js) lifts it in; .d1/.d2/.d3 only
                add a transition-delay (0.06s / 0.12s / 0.18s) so the four
                blocks rise in sequence instead of all at once. These
                sit directly inside a plain (non-.rv) wrapper, so nothing
                double-rises. Portrait max-w: 416px → 380px, and 360px at
                2xl (≥1536px) so it stops pushing the Instagram link off
                screen — edit those two numbers to resize it. */}
            <div className="rv d1 relative mt-10 w-full max-w-[380px] 2xl:max-w-[360px]">
              {/* Desktop: rotated caption running up the left edge */}
              <p
                className="absolute bottom-0 right-full hidden whitespace-nowrap text-base font-bold md:block"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                MEET LARA
              </p>

              <img
                src={laraPortrait}
                alt="Lara close-up portrait"
                className="block aspect-[416/391] w-full object-cover"
              />

              {/* Mobile: plain horizontal caption below the portrait,
                  matching Figma. The rotated desktop version doesn't fit a
                  narrow viewport (it was getting clipped off-screen). */}
              <p className="mt-3 text-center text-xs font-bold uppercase tracking-wide md:hidden">
                MEET LARA
              </p>
            </div>

            {/* Story */}
            <p className="rv d2 mt-9 max-w-[520px] text-[16px] leading-6 text-[var(--muted)]">
             Lara's Crochet started with a hook, a ball of yarn, and a refusal to settle for basic. Founded by Lara, it's grown into a brand built on precision — every dress, bikini, and two-piece crocheted by hand, made to order, and shaped to fit exactly how you want it. No two customers are styled the same way, because no two bodies are. This is slow fashion done properly: considered, made-to-measure, and built to last far longer than anything off a rack.
            </p>

            {/* Instagram */}
            <div className="rv d3 mt-8 flex justify-center text-[16px] underline underline-offset-4">
              <a
                href="https://www.instagram.com/_larascrochet/"
                target="_blank"
                rel="noreferrer"
                className="text-[#564345]"
              >
                Connect with Lara&apos;s Crochet
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}