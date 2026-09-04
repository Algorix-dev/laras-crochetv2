import Reveal from "./Reveal";

import laraWordmark from "../assets/lara-wordmark-solid.png";
import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";
import arcSwirl from "../assets/decor/arc-swirl.png";

/* ============================================================
   BRAND STORY
   ============================================================ */

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you, your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

/* ============================================================
   CUSTOMER TESTIMONIALS
   ============================================================ */

const TESTIMONIALS = [
  {
    quote:
      "I've never had a piece fit this well straight out of the box. Literally made to my measurements. No alterations needed.",
    name: "Teniola Aladese",
  },
  {
    quote:
      "You can tell this isn't machine-made. The detail in the stitching is unreal.",
    name: "Tolu Coker",
  },
  {
    quote:
      "The bikini set held up through an entire beach trip. No stretching, no losing shape. Genuinely impressed.",
    name: "Halima Finny",
  },
  {
    quote:
      "The Reina dress is a whole moment. I get stopped every single time I wear it.",
    name: "Chidinma K.",
  },
  {
    quote:
      "Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.",
    name: "Precious Ehizoge",
  },
  {
    quote:
      "Customer service walked me through sizing so patiently. Made ordering online feel less scary.",
    name: "Ejiro Okezie",
  },
];

/* ============================================================
   STATIC LARA PHOTO STACK
   ============================================================ */

const SCATTER_PHOTOS = [
  {
    src: scatterBeach,
    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",
    style: {
      transform: "translate(-13px, 8px) rotate(0deg)",
      zIndex: 3,
    },
  },
  {
    src: scatterStreet,
    alt: "Street-style portrait",
    style: {
      transform: "translate(7px, -8px) rotate(19.63deg)",
      zIndex: 2,
    },
  },
  {
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",
    style: {
      transform: "translate(23px, 10px) rotate(-8.21deg)",
      zIndex: 1,
    },
  },
];

export default function LaraShowcase() {
  return (
    <section className="relative overflow-hidden bg-[var(--cream)]">
      {/* ========================================================
          FIGMA DECORATION
          Large crochet-thread arcs behind the Lara section.
          These are intentionally static for now.
          ======================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        {/* Left arc */}
        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            select-none
            opacity-[0.32]
            blur-[3.5px]
          "
          style={{
            width: "98.24vw",
            left: "-13.48vw",
            top: "42.9vw",
            maxWidth: "none",
          }}
        />

        {/* Right mirrored arc */}
        <img
          src={arcSwirl}
          alt=""
          className="
            absolute
            select-none
            opacity-[0.32]
            blur-[3.5px]
          "
          style={{
            width: "98.24vw",
            left: "53.44vw",
            top: "42.9vw",
            maxWidth: "none",
            transform: "scaleX(-1)",
            transformOrigin: "center",
          }}
        />
      </div>

      {/* ========================================================
          CONTENT
          ======================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-4xl
          px-5
          py-16
          text-center
          md:py-24
        "
      >
        {/* ======================================================
            LARA WORDMARK + PHOTOS
            ====================================================== */}

        <Reveal>
          <div
            className="
              relative
              mx-auto
              mb-14
              w-full
              max-w-[560px]
              md:mb-20
              md:max-w-[720px]
            "
          >
            <img
              src={laraWordmark}
              alt="Lara's Crochet"
              className="
                block
                h-auto
                w-full
                select-none
                pointer-events-none
              "
            />

            {/* Static photo cluster over the LARA wordmark */}
            <div
              className="
                absolute
                left-1/2
                top-1/2
                h-[80px]
                w-[110px]
                -translate-x-1/2
                -translate-y-1/2
                sm:h-[100px]
                sm:w-[140px]
                md:h-[115px]
                md:w-[160px]
              "
            >
              {SCATTER_PHOTOS.map((photo) => (
                <img
                  key={photo.alt}
                  src={photo.src}
                  alt={photo.alt}
                  style={photo.style}
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    rounded-[2px]
                    object-cover
                    shadow-md
                    ring-1
                    ring-[var(--cream)]
                  "
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* ======================================================
            BRAND STORY COPY
            ====================================================== */}

        <Reveal delay={0.1}>
          <div
            className="
              relative
              mx-auto
              max-w-lg
              space-y-5
              text-sm
              leading-[1.8]
              text-[var(--ink)]
              md:text-base
            "
          >
            {PARAGRAPHS.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        {/* ======================================================
            TESTIMONIALS
            ====================================================== */}

        <div
          className="
            relative
            mt-16
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-2
            md:mt-20
            md:grid-cols-3
          "
        >
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal
              key={testimonial.name}
              delay={0.05 * index}
            >
              <div
                className="
                  h-full
                  border
                  border-[var(--line)]
                  bg-[var(--cream)]
                  p-5
                  text-center
                "
              >
                <p
                  className="
                    mb-4
                    text-sm
                    leading-relaxed
                    text-[var(--ink)]
                  "
                >
                  "{testimonial.quote}"
                </p>

                <p
                  className="
                    flex
                    items-center
                    justify-center
                    gap-1
                    text-xs
                    font-bold
                    text-[var(--ink)]
                  "
                >
                  {testimonial.name}

                  <span
                    aria-hidden="true"
                    className="
                      inline-flex
                      h-3.5
                      w-3.5
                      items-center
                      justify-center
                      rounded-full
                      bg-[var(--maroon)]
                      text-[9px]
                      text-white
                    "
                  >
                    ✓
                  </span>
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-[var(--muted)]
                  "
                >
                  Verified Customer
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
