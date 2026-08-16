import { Link } from "react-router-dom";
import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import Footer from "../components/Footer";

/*
  TIP: This is the About page — it tells the story behind Lara's Crochet.
  The left column shows a full-body portrait of Lara, and the right column
  has the brand heading, a smaller lifestyle photo, the story, and links.

  The two photos are real images of Lara (not product shots), so we use
  object-cover to fill the frame nicely instead of object-contain.

  TIP — the heading font: the Figma spec calls for "Genty Demo", but
  that font's license is personal-use-only and explicitly forbids web
  embedding (see the same note in Footer.jsx, where the LAC monogram
  hit the same issue). Using Yellowtail (Google Fonts, free for
  commercial use) here too, for a consistent brand feel across both
  spots. If Lara buys the commercial Genty license later, swap
  font-['Yellowtail'] below for font-['Genty_Demo'] once it's set up
  as a real @font-face in index.css.
*/
export default function AboutPage() {
  return (
    <>
      {/* TIP: Main grid — single column on mobile, two columns on md+.
          gap widened to better match the spacious feel in the Figma
          (202px at the 1920px design width, scaled down responsively). */}
      <main className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-2 md:gap-20 md:px-8 md:py-16 lg:gap-28">
        {/* TIP: Left column — full-body portrait of Lara.
            We use object-cover so the photo fills the frame nicely,
            and a tall aspect ratio to match the full-body shot. */}
        <img
          src={laraPortrait}
          alt="Lara — founder of Lara's Crochet"
          className="aspect-[3/4] w-full object-cover"
        />

        {/* TIP: Right column — heading, rotated label, lifestyle image, story, and links. */}
        <section className="flex flex-col justify-center">
          {/* TIP: Page heading — Yellowtail script font, regular weight
              (the font is already script-shaped, so no italic transform
              needed on top of it). Sized to the spec's 52px/78px
              line-height at the md+ breakpoint. */}
          <h1 className="font-['Yellowtail'] text-[42px] leading-[1.5] md:text-[52px] md:leading-[78px]">
            This is Lara&apos;s Crochet
          </h1>

          {/* TIP: Rotated "MEET LARA" label beside a lifestyle photo.
              Bold, 16px, normal tracking — matches the spec exactly
              (previously this had small light text with wide tracking). */}
          <div className="mt-10 flex items-center gap-5">
            <p className="-rotate-90 whitespace-nowrap text-base font-bold shrink-0">
              MEET LARA
            </p>
            {/* TIP: the source photo is a tall 2:3 portrait, but the
                spec wants a near-square 416:391 crop — object-cover
                handles that by cropping top/bottom rather than
                distorting the image. */}
            <img
              src={laraSunglasses}
              alt="Lara on a crosswalk"
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

      <Footer />
    </>
  );
}
