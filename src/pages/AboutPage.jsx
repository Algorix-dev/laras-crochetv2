import laraPortrait from "../assets/lara-portrait.jpg";
import laraSunglasses from "../assets/lara-sunglasses.jpg";
import aboutHeadingLockup from "../assets/about-heading-lockup.png";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      {/* About Page */}
      <main className="flex w-full flex-col md:flex-row md:items-center bg-[#FFFCFC]">
        {/* Left: Figma-style full-height image */}
        <div className="w-full md:h-[calc(100vh-66px)] md:w-1/2 lg:w-[49.1667%] shrink-0 overflow-hidden">
          <img
            src={laraSunglasses}
            alt="Lara — founder of Lara's Crochet"
            className="block h-full w-full object-cover"
          />
        </div>

        {/* Right: centered Figma content */}
        <section className="flex w-full flex-1 items-center justify-center px-6 py-16 md:min-h-[calc(100vh-66px)] md:px-8 lg:px-12">
          <div className="flex w-full max-w-[580px] flex-col items-center gap-10">
            {/* Frame 162 */}
            <div className="flex w-full max-w-[477px] flex-col items-center justify-center gap-4">
              {/* This is Lara's Crochet */}
              <img
                src={aboutHeadingLockup}
                alt="This is Lara's Crochet"
                className="h-[78px] w-[477px] max-w-full object-contain"
              />

              {/* Frame 161 */}
              <div className="flex h-[391px] w-full max-w-[440px] flex-row items-end">
                {/* MEET LARA */}
                <div className="flex h-[391px] w-[24px] shrink-0 items-center justify-center">
                  <p
                    className="whitespace-nowrap font-['DM_Sans'] text-[16px] font-bold leading-6 text-black"
                    style={{
                      transform: "rotate(-90deg)",
                    }}
                  >
                    MEET LARA
                  </p>
                </div>

                {/* Rectangle 46 */}
                <div className="h-[391px] w-[416px] shrink-0 overflow-hidden">
                  <img
                    src={laraPortrait}
                    alt="Lara close-up portrait"
                    className="block h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Frame 160 */}
            <div className="flex w-full flex-col items-center gap-10">
              {/* Body Text */}
              <div className="w-full px-0 py-2.5">
                <p className="w-full text-center font-['DM_Sans'] text-[16px] font-normal leading-6 text-[#404040]">
                  At Lara&apos;s Crochet, every piece here starts as a single
                  strand of yarn and a pair of hands, no factories, no
                  shortcuts. Made-to-order, one piece at a time, out of Lagos,
                  Nigeria.
                </p>
              </div>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-full text-center font-['DM_Sans'] text-[16px] font-normal leading-6 text-[#564345] underline underline-offset-4"
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