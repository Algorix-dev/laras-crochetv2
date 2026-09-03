import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import scatterBeach from '../assets/scatter-beach.png';
import scatterStreet from '../assets/scatter-street.jpg';
import scatterTeal from '../assets/scatter-teal.png';
import arcFlourish1 from '../assets/arc-flourish-1.png';
import arcFlourish2 from '../assets/arc-flourish-2.png';

/*
  TIP: HOW THIS SECTION IS PINNED
  -------------------------------
  The outer <section> is tall (260vh) — that extra height is scroll
  "runway." The inner div is `sticky top-[66px]` (66px = Navbar
  height, see Navbar.jsx `h-[66px]`), so once its top hits the bottom
  edge of the sticky navbar it locks there and stays on screen while
  the user keeps scrolling through the rest of the outer section's
  height. Once the outer section runs out of height, the sticky div
  scrolls away naturally — no manual pin/unpin JS needed.

  `useScroll` tracks progress through that outer section (0 → 1) and
  drives every stage below off that one number: the 3 photos
  converging onto the LARA wordmark, the 4 brand-story paragraphs
  cross-fading, and the testimonials fading in/out in staggered
  groups of 3. It's continuously tied to scroll position (scrubbed),
  not a "did this enter the viewport" trigger.

  CORRECTION FROM THE FIRST PASS: "Lara" in the brief refers to the
  cursive "LARA" wordmark (see Group_4.png / the existing footer
  monogram treatment, font-family Yellowtail) — NOT a photo of Lara
  herself. Rendered as live text here (same technique Footer.jsx
  already uses via font-['Yellowtail']) so it stays crisp at any
  size, rather than as an image.
*/

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece here starts as a single strand of yarn and a pair of hands, no factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",
  "We don't keep a stockroom.",
  "When you order, your piece is made for you — your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",
  "This isn't fast fashion. It's handmade, made with love.",
];

// TIP: only 6 real testimonials exist in the copy doc right now — the
// Figma export shows 9 slots. Grouped 3-at-a-time below (2 full
// groups); ask Lara for 3 more whenever she has them so the 3rd group
// isn't empty.
const TESTIMONIALS = [
  { quote: "I've never had a piece fit this well straight out of the box — literally made to my measurements. No alterations needed.", name: 'Teniola Aladese' },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: 'Tolu Coker' },
  { quote: 'The bikini set held up through an entire beach trip — no stretching, no losing shape. Genuinely impressed.', name: 'Halima Finny' },
  { quote: 'The Reina dress is a whole moment. I get stopped every single time I wear it.', name: 'Chidinma K.' },
  { quote: 'Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.', name: 'Precious Ehizoge' },
  { quote: 'Customer service walked me through sizing so patiently. Made ordering online feel less scary.', name: 'Ejiro Okezie' },
];
const TESTIMONIAL_GROUPS = [];
for (let i = 0; i < TESTIMONIALS.length; i += 3) {
  TESTIMONIAL_GROUPS.push(TESTIMONIALS.slice(i, i + 3));
}

// TIP: converge from left, right, and below (per Lara's note) onto a
// small tilted collage nested around the wordmark — much smaller
// footprint than the first pass's full-height treatment.
const SCATTER_LAYOUT = [
  { src: scatterBeach, alt: "Lara's Crochet customer wearing a turquoise two-piece on the beach", from: { x: -260, y: -40, rotate: -20 }, to: { x: -78, y: -6, rotate: -9 }, size: 'w-20 sm:w-24 md:w-28' },
  { src: scatterTeal, alt: "Lara's Crochet customer wearing a teal crochet dress", from: { x: 260, y: -40, rotate: 20 }, to: { x: 78, y: -6, rotate: 8 }, size: 'w-20 sm:w-24 md:w-28' },
  { src: scatterStreet, alt: 'Street-style portrait, styling reference', from: { x: 0, y: 220, rotate: 8 }, to: { x: 0, y: 30, rotate: -4 }, size: 'w-16 sm:w-20 md:w-24' },
];

/* Stage boundaries along the 0→1 scroll progress of the whole pinned run. */
const STAGES = {
  scatterEnd: 0.14,
  paragraphsStart: 0.14,
  paragraphsEnd: 0.5,
  reviewsStart: 0.5,
  reviewsEnd: 0.98,
};

function ScatterImage({ layout, progress }) {
  const localProgress = useTransform(progress, [0, STAGES.scatterEnd], [0, 1]);
  const x = useTransform(localProgress, [0, 1], [layout.from.x, layout.to.x]);
  const y = useTransform(localProgress, [0, 1], [layout.from.y, layout.to.y]);
  const rotate = useTransform(localProgress, [0, 1], [layout.from.rotate, layout.to.rotate]);
  const opacity = useTransform(progress, [0, STAGES.scatterEnd * 0.6, STAGES.scatterEnd], [0, 1, 1]);
  const scale = useTransform(localProgress, [0, 1], [0.6, 1]);

  return (
    <motion.img
      src={layout.src}
      alt={layout.alt}
      style={{ x, y, rotate, opacity, scale }}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${layout.size} rounded-sm object-cover shadow-xl ring-2 ring-[var(--cream)]`}
    />
  );
}

function ScrollParagraph({ text, index, progress }) {
  const span = (STAGES.paragraphsEnd - STAGES.paragraphsStart) / PARAGRAPHS.length;
  const start = STAGES.paragraphsStart + index * span;
  const fadeIn = start + span * 0.15;
  const hold = start + span * 0.75;
  const fadeOut = start + span;

  const opacity = useTransform(progress, [start, fadeIn, hold, fadeOut], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, fadeIn], [16, 0]);

  return (
    <motion.p
      style={{ opacity, y }}
      className="absolute inset-x-0 text-sm md:text-base leading-relaxed text-[var(--ink)] max-w-md mx-auto px-4"
    >
      {text}
    </motion.p>
  );
}

function ReviewCard({ t, raised }) {
  return (
    <div
      className={`border border-[var(--line)] bg-[var(--cream)] p-5 w-full max-w-[15rem] text-center ${raised ? '-translate-y-4' : ''}`}
    >
      <p className="text-sm text-[var(--ink)] mb-3 leading-relaxed">"{t.quote}"</p>
      <p className="text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1">
        {t.name}
        <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-white text-[9px]">✓</span>
      </p>
      <p className="text-[11px] text-[var(--muted)]">Verified Customer</p>
    </div>
  );
}

function ScrollReviewGroup({ group, index, progress }) {
  const span = (STAGES.reviewsEnd - STAGES.reviewsStart) / TESTIMONIAL_GROUPS.length;
  const start = STAGES.reviewsStart + index * span;
  const fadeIn = start + span * 0.25;
  const hold = start + span * 0.7;
  const fadeOut = start + span;

  const opacity = useTransform(progress, [start, fadeIn, hold, fadeOut], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, fadeIn], [24, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      // TIP: "not straight" per Lara's screenshot — the middle card
      // sits a little higher than its neighbors (see ReviewCard's
      // `raised` prop), not a flat row of 3.
      className="absolute inset-0 flex items-center justify-center gap-4"
    >
      {group.map((t, i) => (
        <ReviewCard key={t.name} t={t} raised={i === 1} />
      ))}
    </motion.div>
  );
}

export default function LaraShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  return (
    <section ref={sectionRef} className="relative h-[260vh]">
      {/* TIP: top-[66px] matches Navbar's fixed h-[66px] — this is
          what makes the section stop right at the navbar's bottom
          edge instead of sliding underneath it. */}
      <div className="sticky top-[66px] h-[calc(100vh-66px)] overflow-hidden bg-[var(--cream)]">
        {/* Decorative arcs — kept at their natural aspect ratio and
            tucked into a corner instead of stretched edge-to-edge, so
            the diagonal sweep reads correctly instead of flattening
            into straight lines. */}
        <img src={arcFlourish1} alt="" aria-hidden="true" className="pointer-events-none absolute -top-6 -left-10 w-[55%] max-w-md opacity-70" />
        <img src={arcFlourish2} alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-6 -right-10 w-[55%] max-w-md opacity-70" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-5">
          {/* LARA wordmark + the 3 photos converging onto it */}
          <div className="relative flex items-center justify-center h-40 md:h-48 w-full">
            <span className="font-['Yellowtail'] text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] leading-none text-[var(--maroon)] select-none">
              Lara
            </span>
            {SCATTER_LAYOUT.map((layout, i) => (
              <ScatterImage key={i} layout={layout} progress={scrollYProgress} />
            ))}
          </div>

          {/* Paragraphs — stacked in the same spot, cross-fading */}
          <div className="relative mt-6 h-24 w-full">
            {PARAGRAPHS.map((text, i) => (
              <ScrollParagraph key={i} text={text} index={i} progress={scrollYProgress} />
            ))}
          </div>

          {/* Testimonials — 3 at a time, staggered, fading in then out as a group */}
          <div className="relative mt-6 h-56 w-full">
            {TESTIMONIAL_GROUPS.map((group, i) => (
              <ScrollReviewGroup key={i} group={group} index={i} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}