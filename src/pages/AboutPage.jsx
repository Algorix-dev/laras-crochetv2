import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <main className="grid gap-10 md:grid-cols-[944px_580px] md:gap-20 lg:gap-28">
        {/* Left: Figma image */}
        <img
          src={laraSunglasses}
          alt="Lara — founder of Lara's Crochet"
          className="h-auto w-full object-cover md:h-[1024px] md:w-[944px]"
        />

        {/* Right column — Figma: 580px wide */}
        <section className="flex w-full max-w-[580px] flex-col items-center">
          {/* Frame 162 */}
          <div className="flex w-full max-w-[477px] flex-col items-center justify-center gap-4">
            {/* Brand heading — kept as your existing image */}
            <img
              src={aboutHeadingLockup}
              alt="This is Lara's Crochet"
              className="h-auto w-[477px] max-w-full"
            />

            {/* Frame 161 */}
            <div className="flex h-[391px] w-[440px] max-w-full flex-row items-end">
              {/* MEET LARA */}
              <div className="flex h-[391px] w-[88px] shrink-0 items-end justify-center">
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

              {/* Rectangle 46 */}
              <img
                src={laraPortrait}
                alt="Lara close-up portrait"
                className="h-[391px] w-[416px] shrink-0 object-cover"
              />
            </div>
          </div>

          {/* Frame 160 */}
          <div className="mt-10 flex w-[580px] max-w-full flex-col items-center gap-10">
            {/* Body Text */}
            <div className="flex w-full flex-col items-center gap-2.5 px-0 py-2.5">
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

            {/* Connect with Lara's Crochet */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-full text-center underline underline-offset-4"
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
        </section>
      </main>

      <Footer />
    </>
  );
}