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

          OPACITY CONTROLS:

          ARC:
          opacity-[0.65]

          THREAD BAND:
          opacity-[0.75]

          Try:
          0.50 = medium
          0.65 = clearly visible
          0.75 = strong
          0.85 = very strong
          1.00 = fully visible
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
            opacity-[0.65]
            blur-[1.5px]
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
            opacity-[0.65]
            blur-[1.5px]
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

            Start with 0.75.
            ====================================================== */}

        <img
          src={threadBand}
          alt=""
          className="
            absolute
            select-none
            opacity-[0.75]
            blur-[2px]
          "
          style={{
            width: "100vw",
            left: "50%",
            top: "18.69vw",
            maxWidth: "none",
            transform: "translateX(-50%)",
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

        {/* CTA */}
        <Link
          to="/contact?flow=custom"
          className="
            relative
            mt-6
            inline-block
            bg-[var(--maroon)]
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
