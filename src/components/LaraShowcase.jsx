```jsx
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
  =============

  One long scroll-driven section.

  Stage 1:
    The three photos enter from different directions and converge into
    a tight tilted photo stack.

  Stage 2:
    The Lara wordmark appears and the story paragraphs cross-fade.

  Stage 3:
    Testimonials appear in groups of three.

  Everything is driven by the same scroll progress so the animation
  feels connected rather than like several unrelated animations.
*/

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece starts as a single strand of yarn and a pair of hands. No factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",

  "We don't keep a stockroom.",

  "When you order, your piece is made for you: your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",

  "This isn't fast fashion. It's handmade, made with love.",
];

const TESTIMONIALS = [
  {
    quote:
      "I've never had a piece fit this well straight out of the box. Literally made to my measurements.",
    name: "Teniola Aladese",
  },
  {
    quote:
      "You can tell this isn't machine-made. The detail in the stitching is unreal.",
    name: "Tolu Coker",
  },
  {
    quote:
      "The bikini set held up through an entire beach trip. Genuinely impressed.",
    name: "Halima Finny",
  },
  {
    quote:
      "The Reina dress is a whole moment. I get stopped every single time I wear it.",
    name: "Chidinma K.",
  },
  {
    quote:
      "Ordered a custom two-piece for my birthday and it arrived exactly how I described it.",
    name: "Precious Ehizoge",
  },
  {
    quote:
      "Customer service walked me through sizing so patiently. Made ordering online feel less scary.",
    name: "Ejiro Okezie",
  },
];

const TESTIMONIAL_GROUPS = [];

for (let i = 0; i < TESTIMONIALS.length; i += 3) {
  TESTIMONIAL_GROUPS.push(
    TESTIMONIALS.slice(i, i + 3)
  );
}

/*
  Figma-inspired scatter composition.

  Final positions are deliberately close, but NOT identical.

  The photos finish as a compact tilted stack:
    - left photo slightly left
    - center photo almost centered
    - right photo slightly right
*/
const SCATTER_LAYOUT = [
  {
    src: scatterBeach,
    alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach",

    from: {
      x: -330,
      y: -80,
      rotate: -24,
      scale: 0.55,
    },

    to: {
      x: -12,
      y: 9,
      rotate: 0,
      scale: 1,
    },

    width:
      "w-[140px] sm:w-[155px] md:w-[176px]",
  },

  {
    src: scatterStreet,
    alt: "Street-style portrait, styling reference",

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

    width:
      "w-[140px] sm:w-[155px] md:w-[176px]",
  },

  {
    src: scatterTeal,
    alt: "Lara's Crochet customer wearing a teal crochet dress",

    from: {
      x: 330,
      y: -70,
      rotate: 25,
      scale: 0.55,
    },

    to: {
      x: 22,
      y: 10,
      rotate: -8.21,
      scale: 1,
    },

    width:
      "w-[140px] sm:w-[155px] md:w-[176px]",
  },
];

/*
  Scroll stages.

  More space is deliberately given to the Lara/story area so the
  paragraphs don't feel jammed together.
*/
const STAGES = {
  scatterStart: 0,
  scatterEnd: 0.18,

  laraStart: 0.16,
  paragraphsStart: 0.25,
  paragraphsEnd: 0.56,

  reviewsStart: 0.56,
  reviewsEnd: 0.96,
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

  /*
    Fade in quickly, then remain visible.
    This keeps the fade-in effect you liked.
  */
  const opacity = useTransform(
    progress,
    [0, 0.055, STAGES.scatterEnd],
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
      className={`
        absolute
        left-1/2
        top-1/2
        -translate-x-1/2
        -translate-y-1/2
        ${layout.width}
        aspect-[175.6/103.73]
        rounded-[2px]
        object-cover
        shadow-xl
        ring-2
        ring-[var(--cream)]
        will-change-transform
      `}
    />
  );
}

/* ============================================================
   LARA WORDMARK
   ============================================================ */

function LaraWordmark({ progress }) {
  const words = ["Lara"];

  return (
    <motion.div
      className="
        relative
        z-20
        flex
        justify-center
        overflow-visible
        pointer-events-none
      "
    >
      {words.map((word, wordIndex) => {
        const start =
          STAGES.laraStart + wordIndex * 0.035;

        const end = start + 0.075;

        const opacity = useTransform(
          progress,
          [start, end],
          [0, 1]
        );

        const y = useTransform(
          progress,
          [start, end],
          [18, 0]
        );

        const blur = useTransform(
          progress,
          [start, end],
          ["blur(5px)", "blur(0px)"]
        );

        return (
          <motion.span
            key={word}
            style={{
              opacity,
              y,
              filter: blur,
            }}
            className="
              font-['Yellowtail']
              text-[4rem]
              sm:text-[5rem]
              md:text-[6.5rem]
              lg:text-[7rem]
              leading-none
              text-[var(--maroon)]
              select-none
            "
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
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
    start + span * 0.14;

  const hold =
    start + span * 0.65;

  const fadeOut =
    start + span * 0.95;

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

  /*
    The paragraphs intentionally sit farther below the Lara area.
    They also become transparent before the next paragraph replaces
    them, rather than abruptly disappearing.
  */
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

function ReviewCard({ testimonial, middle }) {
  return (
    <motion.div
      animate={{
        y: middle ? -28 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 100,
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
    start + span * 0.18;

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
    [25, 0]
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
          middle={i === 1}
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

  /*
    Decorative arcs.

    Instead of treating them as tiny corner decorations, they now
    behave like the mirrored Figma groups you supplied.
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
            FIGMA ARC FLOURISHES
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
            opacity-80
          "
        />

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
            opacity-80
          "
        />

        {/* ======================================================
            CONTENT
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
              SCATTER + LARA
              ==================================================== */}

          <div
            className="
              relative
              mt-[7vh]
              flex
              h-[245px]
              w-full
              items-center
              justify-center
              sm:h-[280px]
              md:h-[310px]
            "
          >
            {/* Lara stays visually behind the photo stack */}
            <LaraWordmark
              progress={scrollYProgress}
            />

            {/* Tight Figma-inspired photo stack */}
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
              STORY
              ==================================================== */}

          <div
            className="
              relative
              mt-[8vh]
              h-[250px]
              w-full
              sm:mt-[9vh]
              md:mt-[10vh]
              md:h-[270px]
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
              ==================================================== */}

          <div
            className="
              relative
              mt-[5vh]
              h-[260px]
              w-full
              md:mt-[4vh]
              md:h-[285px]
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
```
