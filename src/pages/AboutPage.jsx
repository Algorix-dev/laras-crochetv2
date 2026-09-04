import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
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
        <section className="flex w-full items-center justify-center px-6 py-16 text-center sm:px-10 md:w-1/2 md:px-8 lg:px-12 xl:px-16">
          <div className="flex w-full max-w-[560px] flex-col items-center">
            {/* Heading */}
            <img
              src={aboutHeadingLockup}
              alt="This is Lara's Crochet"
              className="h-auto w-full max-w-[420px]"
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
              className="mt-8 block h-auto w-full max-w-[420px] object-cover md:hidden"
            />

            {/* Meet Lara + portrait */}
            <div className="relative mt-10 w-full max-w-[416px]">
              {/* Desktop: rotated caption running up the left edge */}
              <p
                className="absolute bottom-0 right-full mr-2 hidden whitespace-nowrap text-base font-bold md:block"
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
            <p className="mt-9 max-w-[520px] text-sm leading-8 text-[var(--muted)]">
              At Lara&apos;s Crochet, every piece starts as a single strand of
              yarn and a pair of hands. No factories, no shortcuts — just
              crochet made with love, one piece at a time, out of Lagos,
              Nigeria. We believe in slow fashion that tells a story, and
              we&apos;d love for you to be part of ours.
            </p>

            {/* Instagram */}
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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}