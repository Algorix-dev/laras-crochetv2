import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <main className="grid gap-10 md:grid-cols-2 md:gap-20 lg:gap-28">
        {/* Left: full-bleed Lara image */}
        <img
          src={laraSunglasses}
          alt="Lara — founder of Lara's Crochet"
          className="aspect-[3/4] w-full object-cover md:aspect-auto md:h-full"
        />

        {/* Right column */}
        <section className="flex flex-col px-5 pt-10 pb-10 md:px-8 md:pt-14 lg:pr-16">
          {/* Brand heading */}
          <img
            src={aboutHeadingLockup}
            alt="This is Lara's Crochet"
            className="h-auto w-full max-w-[420px]"
          />

          {/* Meet Lara + portrait */}
        <div className="relative mt-10 flex items-end">
          {/* MEET LARA label */}
          <div className="flex h-full w-6 shrink-0 items-end justify-end">
            <p
              className="whitespace-nowrap text-base font-bold tracking-wide"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              MEET LARA
            </p>
          </div>

          {/* Portrait */}
          <img
            src={laraPortrait}
            alt="Lara close-up portrait"
            className="aspect-[416 / 195.5] w-full max-w-[380px] object-cover"
          />
        </div>

          {/* Brand story */}
          <p className="mt-9 max-w-xl text-center text-sm leading-8 text-[var(--muted)]">
            At Lara&apos;s Crochet, every piece starts as a single strand of
            yarn and a pair of hands. No factories, no shortcuts — just crochet
            made with love, one piece at a time, out of Lagos, Nigeria. We
            believe in slow fashion that tells a story, and we&apos;d love for
            you to be part of ours.
          </p>

          {/* Instagram link */}
          <div className="mt-8 flex justify-center text-sm underline underline-offset-4">
            <a
              href="https://instagram.com"
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