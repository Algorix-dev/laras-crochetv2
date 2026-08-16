import { Link } from "react-router-dom";
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
      {/* TIP: Main grid — single column on mobile, two columns on md+. */}
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-2 md:gap-20 md:px-8 md:py-16 lg:gap-28">
        {/* TIP: Left column — the crosswalk/sunglasses photo, full-bleed
            within its grid column. object-cover fills the frame nicely. */}
        <img
          src={laraSunglasses}
          alt="Lara — founder of Lara's Crochet"
          className="aspect-[3/4] w-full object-cover"
        />

        {/* TIP: Right column — heading, rotated label, lifestyle image, story, and links. */}
        <section className="flex flex-col justify-center">
          {/* TIP: Page heading — real logo lockup image, not live text.
              Width capped and height auto so it scales proportionally;
              the source image is 484x43, so this stays reasonably crisp
              up to a couple times that width. */}
          <img
            src={aboutHeadingLockup}
            alt="This is Lara's Crochet"
            className="h-auto w-full max-w-[420px]"
          />

          {/* TIP: Rotated "MEET LARA" label beside the close-up portrait.
              The label sits in its own narrow, height-matched wrapper —
              a CSS rotation doesn't shrink the element's LAYOUT footprint,
              only its visual appearance, so without this wrapper the
              rotated text kept its original horizontal width/height for
              spacing purposes and visually overlapped the image next to
              it. Giving it a fixed narrow width and letting it stretch to
              the image's height (self-stretch, via the parent's default
              align-items: stretch) fixes that properly. */}
          <div className="mt-10 flex gap-5">
            <div className="flex w-6 shrink-0 items-center justify-center">
              <p className="-rotate-90 whitespace-nowrap text-base font-bold">
                MEET LARA
              </p>
            </div>
            {/* TIP: the source photo is a tall 2:3 portrait, but the
                spec wants a near-square 416:391 crop — object-cover
                handles that by cropping top/bottom rather than
                distorting the image. */}
            <img
              src={laraPortrait}
              alt="Lara close-up portrait"
              className="aspect-[416/391] w-full max-w-[380px] object-cover"
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

          {/* TIP: Action links — Instagram social link and navigation back to
              the shop. "Connect with Lara's Crochet" gets the exact mauve-brown
              (#564345) the spec calls out; "Back to Shop" keeps the default ink
              color since the spec doesn't call out a different color for it. */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm underline underline-offset-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#564345]"
            >
              Connect with Lara&apos;s Crochet
            </a>
            <Link to="/">Back to Shop</Link>
          </div>
        </section>
      </main>

      <Footer showNewsletter />
    </>
  );
}
