import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <main className="flex flex-col md:flex-row md:items-stretch">
        {/* Left image */}
        <div className="w-full md:w-1/2 md:flex-shrink-0">
          <img
            src={laraSunglasses}
            alt="Lara — founder of Lara's Crochet"
            className="block h-auto min-h-[500px] w-full object-cover md:h-full md:min-h-0"
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

            {/* Meet Lara + portrait */}
            <div className="relative mt-10 w-full max-w-[416px]">
              <p
                className="absolute bottom-0 right-full mr-2 whitespace-nowrap text-base font-bold"
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