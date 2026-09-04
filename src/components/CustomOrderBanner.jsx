import customTrio from "../assets/model-images/custom-orders-trio.png";
import customWordmark from "../assets/custom-orders-wordmark.png";
import arcSwirl from "../assets/decor/arc-swirl.png";
import threadBand from "../assets/decor/thread-band.png";
import { Link } from "react-router-dom";

export default function CustomOrderBanner() {
  return (
    <section
      id="custom-orders"
      className="
        relative
        overflow-hidden
        py-14
        text-center
        md:py-20
      "
    >
      {/* ========================================================
          FIGMA DECORATIVE BACKGROUND

          TIP: pulled straight from the Figma dev-mode CSS export
          (Desktop - 5 frame). Group 30/32 (the arcs) are
          opacity 0.2 / blur(4.5px) there — this file had them at
          0.65 / 1.5px, more than 3x stronger and much less soft
          than the design. Group 33 (thread band) is opacity 0.3 /
          blur(6.5px) in Figma vs 0.75 / 2px here. Both corrected
          below to match the export exactly.

          If you want more/less punch than the real design, tweak
          from THESE numbers (0.20/0.30) rather than sliding back
          up toward 0.65/0.75 — those were guesses from before this
          spec existed.
          ======================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          z-0
          overflow-hidden
        "
      >
        {/* Left arc */}
        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            select-none
            opacity-[0.2]
            blur-[4.5px]
          "
          style={{
            width: "98.24vw",
            left: "-13.48vw",
            top: "10.11vw",
            maxWidth: "none",
          }}
        />

        {/* Right arc */}
        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            select-none
            opacity-[0.2]
            blur-[4.5px]
          "
          style={{
            width: "98.24vw",
            left: "53.44vw",
            top: "10.04vw",
            maxWidth: "none",
            transform: "scaleX(-1)",
            transformOrigin: "center",
          }}
        />

        {/* ======================================================
            COLOURED THREAD BAND

            This is the colourful decoration behind Custom.
            ====================================================== */}

        <img
          src={threadBand}
          alt=""
          className="
            absolute
            select-none
            opacity-[0.3]
            blur-[6.5px]
          "
          style={{
            width: "100vw",
            left: "50%",
            top: "18.69vw",
            maxWidth: "none",
            transform: "translateX(-50%)",
          }}
        />

        {/* ======================================================
            "Ellipse 27" from Figma — a soft rose glow sitting
            behind the supporting text + button. Wasn't in the
            code at all before; the area under the CTA rendered
            completely flat. Figma: 640x78, top 744px on a 1920px
            frame (=38.75vw), Rose/900 (--maroon-dark) @ 25%
            opacity, blur(24.5px).
            ====================================================== */}
        <div
          aria-hidden="true"
          className="
            absolute
            select-none
            left-1/2
            -translate-x-1/2
            opacity-[0.25]
            blur-[24.5px]
            bg-[var(--maroon-dark)]
          "
          style={{
            width: "33.33vw",
            height: "4.06vw",
            top: "38.75vw",
          }}
        />
      </div>

      {/* ========================================================
          CONTENT
          ======================================================== */}

      <div className="relative z-10">
        {/* Custom wordmark */}
        <h2 className="relative mb-8 inline-block">
          <img
            src={customWordmark}
            alt="Custom"
            className="
              h-16
              w-auto
              select-none
              pointer-events-none
              md:h-24
            "
          />

          <span
            className="
              absolute
              right-[6%]
              top-0
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-[var(--ink)]
              md:text-sm
            "
          >
            Orders
          </span>
        </h2>

        {/* Three custom models */}
        <img
          src={customTrio}
          alt="Three custom crochet pieces from Lara's Crochet"
          className="
            relative
            z-10
            mx-auto
            h-72
            w-auto
            object-contain
            md:h-96
          "
        />

        {/* Description */}
        <p
          className="
            relative
            mx-auto
            mt-8
            max-w-lg
            px-5
            text-sm
            leading-relaxed
            text-[var(--muted)]
          "
        >
          Not seeing exactly what you want? Tell us your size, your
          color, your vision, and we'll crochet it just for you.
          Every custom piece is made from scratch, one stitch at a
          time, out of Lagos.
        </p>

        {/* CTA
            TIP: Figma spec for this button is Gray/600 (#564345),
            which is var(--ink-warm) — NOT var(--maroon)
            (#412b2d, Gray/700). Was using --maroon before, which
            reads a full shade darker than the design. */}
        <Link
          to="/contact?flow=custom"
          className="
            relative
            mt-6
            inline-block
            bg-[var(--ink-warm)]
            px-6
            py-3
            text-xs
            font-bold
            text-white
            hover:bg-[var(--maroon-dark)]
          "
        >
          Make a custom order
        </Link>
      </div>
    </section>
  );
}