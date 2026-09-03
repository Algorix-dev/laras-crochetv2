import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

import scatterBeach from "../assets/scatter-beach.png";
import scatterStreet from "../assets/scatter-street.jpg";
import scatterTeal from "../assets/scatter-teal.png";

import arcFlourish1 from "../assets/arc-flourish-1.png";
import arcFlourish2 from "../assets/arc-flourish-2.png";

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
   GROUP TESTIMONIALS INTO ROWS OF THREE
   ============================================================ */

const TESTIMONIAL_GROUPS = [];

for (let i = 0; i < TESTIMONIALS.length; i += 3) {
  TESTIMONIAL_GROUPS.push(
    TESTIMONIALS.slice(i, i + 3)
  );
}

/* ============================================================
   PHOTO STACK LAYOUT
   ============================================================ */

const SCATTER_LAYOUT = [
  {
    src: scatterBeach,
    alt:
      "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    from: {
      x: -300,
      y: -80,
      rotate: -24,
      scale: 0.55,
    },

    to: {
      x: -13,
      y: 8,
      rotate: 0,
      scale: 1,
    },
  },

  {
    src: scatterStreet,
    alt:
      "Street-style portrait, styling reference",

    from: {
      x: 0,
      y: 250,
      rotate: 14,
      scale: 0.55,
    },

    to: {
      x: 7,
      y: -8,
      rotate: 19.63,
      scale: 1,
    },
  },

  {
    src: scatterTeal,
    alt:
      "Lara's Crochet customer wearing a teal crochet dress",

    from: {
      x: 300,
      y: -70,
      rotate: 25,
      scale: 0.55,
    },

    to: {
      x: 23,
      y: 10,
      rotate: -8.21,
      scale: 1,
    },
  },
];

/* ============================================================
   SCROLL STAGES
   ============================================================ */

const STAGES = {
  scatterStart: 0,
  scatterEnd: 0.18,

  paragraphsStart: 0.22,
  paragraphsEnd: 0.56,

  reviewsStart: 0.58,
  reviewsEnd: 0.98,
};

/* ============================================================
   SCATTER IMAGE
   ============================================================ */

function ScatterImage({ layout, progress }) {
  const localProgress = useTransform(
    progress,
    [STAGES.scatterStart, STAGES.scatterEnd],
    [0, 1]
  );

  const x = useTransform(
    localProgress,
    [0, 1],
    [layout.from.x, layout.to.x]
  );

  const y = useTransform(
    localProgress,
    [0, 1],
    [layout.from.y, layout.to.y]
  );

  const rotate = useTransform(
    localProgress,
    [0, 1],
    [layout.from.rotate, layout.to.rotate]
  );

  const scale = useTransform(
    localProgress,
    [0, 1],
    [layout.from.scale, layout.to.scale]
  );

  const opacity = useTransform(
    progress,
    [0, 0.05, STAGES.scatterEnd],
    [0, 1, 1]
  );

  return (
    <motion.img
      src={layout.src}
      alt={layout.alt}
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
      }}
      className="
        absolute
        left-1/2
        top-1/2
        z-10
        w-[140px]
        -translate-x-1/2
        -translate-y-1/2
        rounded-[2px]
        object-cover
        shadow-xl
        ring-2
        ring-[var(--cream)]
        will-change-transform
        sm:w-[155px]
        md:w-[176px]
      "
    />
  );
}

/* ============================================================
   LARA WORDMARK
   ============================================================ */

function LaraWordmark({ progress }) {
  const opacity = useTransform(
    progress,
    [0.12, 0.22],
    [0, 1]
  );

  const y = useTransform(
    progress,
    [0.12, 0.22],
    [20, 0]
  );

  const blur = useTransform(
    progress,
    [0.12, 0.22],
    ["blur(5px)", "blur(0px)"]
  );

  return (
    <motion.span
      style={{
        opacity,
        y,
        filter: blur,
      }}
      className="
        relative
        z-20
        select-none
        font-['Yellowtail']
        text-[4rem]
        leading-none
        text-[var(--maroon)]
        pointer-events-none
        sm:text-[5rem]
        md:text-[6.5rem]
      "
    >
      Lara
    </motion.span>
  );
}

/* ============================================================
   STORY PARAGRAPH
   ============================================================ */

function ScrollParagraph({
  text,
  index,
  progress,
}) {
  const span =
    (STAGES.paragraphsEnd -
      STAGES.paragraphsStart) /
    PARAGRAPHS.length;

  const start =
    STAGES.paragraphsStart +
    index * span;

  const fadeIn =
    start + span * 0.15;

  const hold =
    start + span * 0.68;

  const fadeOut =
    start + span * 0.96;

  const opacity = useTransform(
    progress,
    [start, fadeIn, hold, fadeOut],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    [start, fadeIn],
    [20, 0]
  );

  return (
    <motion.p
      style={{
        opacity,
        y,
      }}
      className="
        absolute
        inset-x-0
        top-0
        mx-auto
        max-w-lg
        px-6
        text-center
        text-sm
        leading-[1.8]
        text-[var(--ink)]
        md:text-base
      "
    >
      {text}
    </motion.p>
  );
}

/* ============================================================
   REVIEW CARD
   ============================================================ */

function ReviewCard({
  testimonial,
  raised,
}) {
  return (
    <motion.div
      animate={{
        y: raised ? -28 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 20,
      }}
      className="
        w-full
        max-w-[15rem]
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
    </motion.div>
  );
}

/* ============================================================
   REVIEW GROUP
   ============================================================ */

function ScrollReviewGroup({
  group,
  index,
  progress,
}) {
  const span =
    (STAGES.reviewsEnd -
      STAGES.reviewsStart) /
    TESTIMONIAL_GROUPS.length;

  const start =
    STAGES.reviewsStart +
    index * span;

  const fadeIn =
    start + span * 0.2;

  const hold =
    start + span * 0.7;

  const fadeOut =
    start + span * 0.96;

  const opacity = useTransform(
    progress,
    [start, fadeIn, hold, fadeOut],
    [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    [start, fadeIn],
    [24, 0]
  );

  return (
    <motion.div
      style={{
        opacity,
        y,
      }}
      className="
        absolute
        inset-0
        flex
        items-center
        justify-center
        gap-3
        sm:gap-4
      "
    >
      {group.map((testimonial, i) => (
        <ReviewCard
          key={testimonial.name}
          testimonial={testimonial}
          raised={i === 1}
        />
      ))}
    </motion.div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function LaraShowcase() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const arcOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.2],
    [0, 0.8, 0.8]
  );

  return (
    <section
      ref={sectionRef}
      className="
        relative
        h-[275vh]
      "
    >
      {/* ==================================================
          STICKY VIEWPORT
          ================================================== */}

      <div
        className="
          sticky
          top-[66px]
          h-[calc(100vh-66px)]
          overflow-hidden
          bg-[var(--cream)]
        "
      >

        {/* ==================================================
            LEFT ARC
            ================================================== */}

        <motion.img
          src={arcFlourish1}
          alt=""
          aria-hidden="true"
          style={{
            opacity: arcOpacity,
          }}
          className="
            pointer-events-none
            absolute
            left-[-16%]
            top-[8%]
            z-0
            w-[70%]
            max-w-[1030px]
          "
        />

        {/* ==================================================
            RIGHT ARC
            ================================================== */}

        <motion.img
          src={arcFlourish2}
          alt=""
          aria-hidden="true"
          style={{
            opacity: arcOpacity,
          }}
          className="
            pointer-events-none
            absolute
            right-[-16%]
            top-[8%]
            z-0
            w-[70%]
            max-w-[1030px]
            scale-x-[-1]
          "
        />

        {/* ==================================================
            CONTENT
            ================================================== */}

        <div
          className="
            relative
            mx-auto
            flex
            h-full
            max-w-5xl
            flex-col
            items-center
            px-5
          "
        >

          {/* ==================================================
              LARA + PHOTO STACK
              ================================================== */}

          <div
            className="
              relative
              mt-[6vh]
              flex
              h-[270px]
              w-full
              items-center
              justify-center
              sm:h-[300px]
              md:h-[330px]
            "
          >
            <LaraWordmark
              progress={scrollYProgress}
            />

            {SCATTER_LAYOUT.map(
              (layout, index) => (
                <ScatterImage
                  key={index}
                  layout={layout}
                  progress={scrollYProgress}
                />
              )
            )}
          </div>

          {/* ==================================================
              BRAND STORY
              ================================================== */}

          <div
            className="
              relative
              mt-[10vh]
              h-[270px]
              w-full
              sm:mt-[11vh]
              md:mt-[12vh]
              md:h-[290px]
            "
          >
            {PARAGRAPHS.map(
              (text, index) => (
                <ScrollParagraph
                  key={index}
                  text={text}
                  index={index}
                  progress={scrollYProgress}
                />
              )
            )}
          </div>

          {/* ==================================================
              REVIEWS
              ================================================== */}

          <div
            className="
              relative
              mt-[4vh]
              h-[270px]
              w-full
              md:mt-[5vh]
              md:h-[290px]
            "
          >
            {TESTIMONIAL_GROUPS.map(
              (group, index) => (
                <ScrollReviewGroup
                  key={index}
                  group={group}
                  index={index}
                  progress={scrollYProgress}
                />
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
