import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      {/* Main About section */}
      <main className="grid min-h-[calc(100vh-66px)] md:grid-cols-2">
        {/* Left: half-page image */}
        <div className="h-[calc(100vh-66px)] w-full overflow-hidden">
          <img
            src={laraSunglasses}
            alt="Lara — founder of Lara's Crochet"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right: centered content */}
        <section className="flex min-h-[calc(100vh-66px)] items-center justify-center px-6 py-16 md:px-10 lg:px-16">
          <div className="flex w-full max-w-[580px] flex-col items-center">
            {/* Heading */}
            <div className="flex w-full max-w-[477px] flex-col items-center gap-4">
              <img
                src={aboutHeadingLockup}
                alt="This is Lara's Crochet"
                className="h-auto w-full max-w-[477px]"
              />

              {/* Meet Lara + portrait */}
              <div className="flex w-full max-w-[440px] flex-row items-end">
                {/* MEET LARA */}
                <div className="flex h-[391px] w-[24px] shrink-0 items-end justify-center">
                  <p
                    className="whitespace-nowrap"
                    style={{
                      fontFamily: "'DM Sans'",
                      fontSize: "16px",
                      lineHeight: "24px",
                      fontWeight: 700,
                      color: "#000000",
                      transform: "rotate(-90deg)",
                    }}
                  >
                    MEET LARA
                  </p>
                </div>

                {/* Portrait */}
                <div className="aspect-[416/391] w-full max-w-[416px] overflow-hidden">
                  <img
                    src={laraPortrait}
                    alt="Lara close-up portrait"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Brand story + Instagram */}
            <div className="mt-10 flex w-full flex-col items-center gap-10">
              <div className="w-full px-0 py-2.5">
                <p
                  className="w-full text-center"
                  style={{
                    fontFamily: "'DM Sans'",
                    fontSize: "16px",
                    lineHeight: "24px",
                    fontWeight: 400,
                    color: "#404040",
                  }}
                >
                  At Lara&apos;s Crochet, every piece here starts as a single
                  strand of yarn and a pair of hands, no factories, no
                  shortcuts. Made-to-order, one piece at a time, out of Lagos,
                  Nigeria.
                </p>
              </div>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="text-center text-base underline underline-offset-4"
                style={{
                  fontFamily: "'DM Sans'",
                  fontSize: "16px",
                  lineHeight: "24px",
                  fontWeight: 400,
                  color: "#564345",
                }}
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