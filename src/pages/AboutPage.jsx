import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

/*
  TIP: This is the About page — it tells the story behind Lara's Crochet.
  The left column shows a full-body portrait of Lara, and the right column
  has the brand heading, a smaller lifestyle photo, the story, and links.

  TIP — image assignment: the big left photo is the crosswalk/sunglasses
  shot, and the small photo next to "MEET LARA" is the close-up portrait
  with no glasses — confirmed directly by Emmanuel against the spec.

  TIP — the heading: "Genty Demo" (named in the Figma spec) is confirmed
  personal-use-only and NOT on Google Fonts (checked directly — it's from
  a foundry called Flavor Type, and commercial/web use needs a separate
  paid license). Rather than approximate it with a substitute font, we're
  using the exact PNG lockup Emmanuel provided (which already has the
  real Genty styling, presumably exported by Lara/whoever designed it) —
  same approach already used for the LAC monogram in Footer.jsx, and for
  the "Lara's Crochet" logo on the Sign In page (src/assets/lara-crochet-
  logo.png). If Lara buys the commercial Genty license later and wants
  this to be real selectable/editable text instead of an image, that's
  the point to revisit this.
*/
export default function AboutPage() {
  return (
    <>
      {/* TIP: Main grid — single column on mobile, two columns on md+.
          No max-w/padding/mx-auto here on purpose: the left photo needs
          to touch the true top-left viewport edge (full-bleed), not just
          the edge of a centered max-w-7xl container — on any screen wider
          than 1280px, a centered container would leave a visible gap the
          image shouldn't have. Padding for readability is applied only
          to the text column below, not to this outer grid. */}
      <main className="grid items-start md:grid-cols-[944px_1fr]">
        {/* TIP: Left column — the crosswalk/sunglasses photo, genuinely
            full-bleed: flush with the top and left edges of the browser
            viewport. Locked to the exact Figma spec (Rectangle 45:
            944x1024) on both axes, not just height — the source image's
            aspect ratio (2832x3072 ≈ 0.922) exactly matches 944/1024, so
            with both dimensions fixed there's nothing left for
            object-cover to crop. Previously only height was fixed while
            width stayed w-full (i.e. whatever the grid column happened
            to render at); on any column narrower than 944px that forced
            object-cover to crop hard from the sides, zooming in on just
            her face instead of showing the full photo. */}
        <img
          src={laraSunglasses}
          alt="Lara — founder of Lara's Crochet"
          className="aspect-[3/4] w-full object-cover md:aspect-auto md:h-[1024px] md:w-[944px]"
        />

        {/* TIP: Right column — heading, rotated label, lifestyle image, story, and links.
            Padding lives here instead of on the outer grid, so this column
            stays readable while the image column stays edge-to-edge.
            items-center + text-center centers every child (heading image,
            Meet Lara block, paragraph, link) horizontally within the column. */}
        <section className="flex flex-col items-center px-5 pt-10 pb-10 text-center md:px-8 md:pt-14 lg:pr-16">
          {/* TIP: Page heading — real logo lockup image, not live text.
              Width capped and height auto so it scales proportionally;
              the source image is 484x43, so this stays reasonably crisp
              up to a couple times that width. mx-auto centers it since
              its own width (max-w-420) is narrower than the column. */}
          <img
            src={aboutHeadingLockup}
            alt="This is Lara's Crochet"
            className="mx-auto h-auto w-full max-w-[420px]"
          />

          {/* TIP: Rotated "MEET LARA" label beside the close-up portrait.
              Previously this sat in a sibling flex column that relied on
              align-items: stretch to match the image's height, with the
              text pinned to its bottom via items-end — that only holds up
              if the stretch calculation resolves exactly right, and it
              was drifting off the image's actual bottom edge whenever
              that broke. Anchoring the label with position: absolute
              directly against the image's own wrapper (bottom-0 = same
              bottom edge as the image, right-full = fully outside its
              left edge) ties it to the image's real rendered box instead
              of a height calculated elsewhere, so it can't drift no
              matter what the image does. writing-mode: vertical-rl plus
              a 180deg rotation gives bottom-to-top vertical text without
              needing a separate rotated wrapper. */}
          <div className="relative mt-10 w-full max-w-[440px]">
            <p
              className="absolute bottom-0 left-0 -translate-x-full whitespace-nowrap text-base font-bold"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              MEET LARA
            </p>

            {/* TIP: the source photo is a tall 2:3 portrait, but the
                spec wants a near-square 416:391 crop — object-cover
                handles that by cropping top/bottom rather than
                distorting the image. */}
            <img
              src={laraPortrait}
              alt="Lara close-up portrait"
              className="ml-auto aspect-[416/391] w-[416px] object-cover"
            />
          </div>

          {/* TIP: Brand story paragraph — explains the handmade, slow-fashion ethos. */}
          <p className="mt-9 max-w-xl text-sm leading-8 text-[var(--muted)]">
            At Lara&apos;s Crochet, every piece starts as a single strand of
            yarn and a pair of hands. No factories, no shortcuts — just crochet
            made with love, one piece at a time, out of Lagos, Nigeria. We
            believe in slow fashion that tells a story, and we&apos;d love for
            you to be part of ours.
          </p>

          {/* TIP: Action link — Instagram social link only. "Connect with
              Lara's Crochet" gets the exact mauve-brown (#564345) the spec
              calls out. This is the only link here (per Emmanuel's
              corrections list) — no "Back to Shop" link, and it's centered. */}
          <div className="mt-8 flex justify-center text-sm underline underline-offset-4">
            <a
              href="https://www.instagram.com/_larascrochet/"
              target="_blank"
              rel="noreferrer"
              className="text-[#564345]"
            >
              Connect with Lara&apos;s Crochet
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
