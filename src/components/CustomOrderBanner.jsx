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
        w-full
        overflow-hidden
        py-14
        text-center
        md:py-20
      "
    >
      {/* ========================================================
          CUSTOM BACKGROUND DECORATION
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
        {/* ======================================================
            SWEEPING THREAD ARCS

            OPACITY CONTROL:
            Change BOTH 0.65 values.

            0.20 = subtle
            0.35 = noticeable
            0.50 = medium
            0.65 = strong
            0.80 = very strong
            1.00 = full
            ====================================================== */}

        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            left-1/2
            top-0
            w-[115vw]
            max-w-none
            -translate-x-1/2
            select-none
            opacity-[0.65]
            blur-[1px]
          "
        />

        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            left-1/2
            top-[16%]
            w-[115vw]
            max-w-none
            -translate-x-1/2
            select-none
            opacity-[0.65]
            blur-[1px]
            scale-x-[-1]
          "
        />

        {/* ======================================================
            COLOURED THREAD BAND

            This is the colourful glow that appears behind
            "Custom" and the three models in the Figma.

            STARTING VALUE: 0.75
            ====================================================== */}

        <img
          src={threadBand}
          alt=""
          className="
            absolute
            left-1/2
            top-[12%]
            w-[115vw]
            max-w-none
            -translate-x-1/2
            select-none
            opacity-[0.75]
            blur-[2px]
          "
        />

        {/* Soft rose glow underneath the CTA */}
        <div
          aria-hidden="true"
          className="
            absolute
            left-1/2
            top-[68%]
            h-16
            w-[55vw]
            max-w-[640px]
            -translate-x-1/2
            bg-[var(--maroon-dark)]
            opacity-[0.25]
            blur-[24px]
          "
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
            bg-[var(--ink-warm)]
            px-6
            py-3
            text-xs
            font-bold
            text-white
            transition-colors
            hover:bg-[var(--maroon-dark)]
          "
        >
          Make a custom order
        </Link>
      </div>
    </section>
  );
}