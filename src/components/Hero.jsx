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

/*
  LARA SHOWCASE

  This section is controlled by one scroll progress value.

  The animation moves through three major stages:

  1. The three scattered photos fade in and converge into
     a small, tight tilted stack.

  2. The Lara wordmark and brand story appear.
     The paragraphs cross-fade instead of sitting on top
     of each other.

  3. The customer reviews appear in groups of three.
     Only the middle review is raised.
*/

/* Brand story paragraphs */
const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece here starts as a single strand of yarn and a pair of hands, no factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you — your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

/* Customer testimonials */
const TESTIMONIALS = [
  {
    quote:
      "I've never had a piece fit this well straight out of the box — literally made to my measurements. No alterations needed.",
    name: "Teniola Aladese",
  },
  {
    quote:
      "You can tell this isn't machine-made. The detail in the stitching is unreal.",
    name: "Tolu Coker",
  },
  {
    quote:
      "The bikini set held up through an entire beach trip — no stretching, no losing shape. Genuinely impressed.",
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

/*
  Divide the testimonials into groups of three.

  This gives us:

  Row 1:
  [ review ] [ review ] [ review ]

  Row 2:
  [ review ] [ review ] [ review ]
*/
const TESTIMONIAL_GROUPS = [];

for (let i = 0; i < TESTIMONIALS.length; i += 3) {
  TESTIMONIAL_GROUPS.push(
    TESTIMONIALS.slice(i, i + 3)
  );
}

/*
  FIGMA PHOTO STACK

  The final positions are intentionally close together.

  They overlap like a real tilted photo stack, but each image
  remains visible instead of collapsing into one image.

  Approximate Figma values:
  - 175.6 × 103.73
  - 0°
  - 19.63°
  - -8.21°
*/
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

/*
  Scroll stages.

  More room is given to the story section so the paragraphs
  do not feel too close to the Lara/photo area.
*/
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
  /*
    Convert the overall scroll progress into a local
    0 → 1 progress for the scatter animation.
  */
  const localProgress = useTransform(
    progress,
    [STAGES.scatterStart, STAGES.scatterEnd],
    [0, 1]
  );

  /* Horizontal movement */
  const x = useTransform(
    localProgress,
    [0, 1],
    [layout.from.x, layout.to.x]
  );

  /* Vertical movement */
  const y = useTransform(
    localProgress,
    [0, 1],
    [layout.from.y, layout.to.y]
  );

  /* Rotation */
  const rotate = useTransform(
    localProgress,
    [0, 1],
    [layout.from.rotate, layout.to.rotate]
  );

  /* Scale */
  const scale = useTransform(
    localProgress,
    [0, 1],
    [layout.from.scale, layout.to.scale]
  );

  /*
    Fade in fairly quickly.

    After the image has appeared, it remains fully visible
    while the other parts of the section continue.
  */
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
        -translate-x-1/2
        -translate-y-1/2
        w-[140px]
        sm:w-[155px]
        md:w-[176px]
        aspect-[175.6/103.73]
        rounded-[2px]
        object-cover
        shadow-xl
        ring-2
        ring-[var(--cream)]
        will-change-transform
      "
    />
  );
}

/* ============================================================
   LARA WORDMARK
   ============================================================ */

function LaraWordmark({ progress }) {
  /*
    "Lara" is intentionally kept as live text because the existing
    project already uses the Yellowtail font treatment.

    The word fades in and rises slightly as the scroll reaches
    the Lara section.
  */
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
        font-['Yellowtail']
        text-[4rem]
        sm:text-[5rem]
        md:text-[6.5rem]
        leading-none
        text-[var(--maroon)]
        select-none
        pointer-events-none
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
  /*
    Divide the paragraph section equally between all
    four paragraphs.
  */
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

  /*
    Each paragraph:
    fade in → remain visible → become transparent.
  */
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
        md:text-base
        leading-[1.8]
        text-[var(--ink)]
      "
    >
      {text}
    </motion.p>
  );
}

/* ============================================================
   REVIEW CARD
   ============================================================ */

function ReviewCard({ testimonial, raised }) {
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
      {/* Review text */}
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

      {/* Customer name */}
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

        {/* Verification mark */}
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

      {/* Verified customer label */}
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
  /*
    Divide the review section between each group of three.
  */
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

  /* Group fade */
  const opacity = useTransform(
    progress,
    [start, fadeIn, hold, fadeOut],
    [0, 1, 1, 0]
  );

  /* Group entrance */
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

  /*
    Track how far the user has scrolled through the entire
    Lara showcase section.
  */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  /*
    Fade the decorative arcs in as the section begins.
  */
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
      {/* Sticky viewport for the entire scroll animation */}
      <div
        className="
          sticky
          top-[66px]
          h-[calc(100vh-66px)]
          overflow-hidden
          bg-[var(--cream)]
        "
      >

        {/* ======================================================
            LEFT ARC FLOURISH
            ====================================================== */}

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

        {/* ======================================================
            RIGHT ARC FLOURISH
            ====================================================== */}

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

        {/* ======================================================
            MAIN CONTENT
            ====================================================== */}

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

          {/* ====================================================
              LARA + PHOTO STACK
              ==================================================== */}

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
            {/* Lara wordmark */}
            <LaraWordmark
              progress={scrollYProgress}
            />

            {/* Scattered photos */}
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

          {/* ====================================================
              BRAND STORY
              ====================================================

              Extra margin is intentionally added here.

              This keeps the paragraphs away from the Lara image
              and gives the section more breathing room.
          */}

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

          {/* ====================================================
              REVIEWS
              ====================================================

              The review section has its own breathing room.

              Only the middle card in each row is raised.
          */}

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