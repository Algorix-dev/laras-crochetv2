import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import laraPortrait from '../assets/lara-sunglasses.jpg';
import scatterBeach from '../assets/scatter-beach.png';
import scatterStreet from '../assets/scatter-street.jpg';
import scatterTeal from '../assets/scatter-teal.png';
import arcFlourish1 from '../assets/arc-flourish-1.png';
import arcFlourish2 from '../assets/arc-flourish-2.png';

/*
  TIP: HOW THIS SECTION IS PINNED
  -------------------------------
  The outer <section> is tall (300vh) — that extra height is scroll
  "runway." The inner div is `sticky top-[66px]` (66px = Navbar height,
  see Navbar.jsx `h-[66px]`), so once its top hits the bottom edge of
  the fixed navbar it locks there and stays on screen while the user
  keeps scrolling through the rest of the outer section's height. Once
  the outer section runs out of height, the sticky div scrolls away
  naturally with the rest of the page — no JS pinning/unpinning logic
  needed, just CSS position:sticky + a tall parent.

  `useScroll` tracks how far through that outer section we've
  scrolled (0 → 1) and drives every animation stage below off of that
  single number — the three photos scattering into place, the four
  brand-story paragraphs cross-fading, and the testimonials fading in
  then back out one by one. Nothing here is triggered by
  "has this element entered the viewport" (that's what <Reveal> is
  for elsewhere on the page) — it's continuously tied to scroll
  position, which is what makes it feel "scrubbed" rather than just
  "triggered once."
*/

const PARAGRAPHS = [
  "Welcome to Lara's Crochet! Here, every piece here starts as a single strand of yarn and a pair of hands, no factories, no shortcuts. Made-to-order, one piece at a time, out of Lagos, Nigeria.",
  "We don't keep a stockroom.",
  "When you order, your piece is made for you — your size, your color, your fit. It takes time, because handmade always does, but it means what arrives at your door was never sitting on a shelf waiting for someone else.",
  "This isn't fast fashion. It's handmade, made with love.",
];

// TIP: only 6 real testimonials exist in the copy doc right now (see
// App.jsx's old TESTIMONIALS array) — the Figma export shows 9 slots.
// Using the 6 real ones here; ask Lara for 3 more when she has them
// rather than inventing placeholder reviews.
const TESTIMONIALS = [
  { quote: "I've never had a piece fit this well straight out of the box — literally made to my measurements. No alterations needed.", name: 'Teniola Aladese' },
  { quote: "You can tell this isn't machine-made. The detail in the stitching is unreal.", name: 'Tolu Coker' },
  { quote: 'The bikini set held up through an entire beach trip — no stretching, no losing shape. Genuinely impressed.', name: 'Halima Finny' },
  { quote: 'The Reina dress is a whole moment. I get stopped every single time I wear it.', name: 'Chidinma K.' },
  { quote: 'Ordered a custom two-piece for my birthday and it arrived exactly how I described it. Lara really listens.', name: 'Precious Ehizoge' },
  { quote: 'Customer service walked me through sizing so patiently. Made ordering online feel less scary.', name: 'Ejiro Okezie' },
];

// Final resting spot + entry direction for each of the 3 scattered photos.
const SCATTER_LAYOUT = [
  { src: scatterBeach, alt: 'Lara\'s Crochet customer wearing a turquoise two-piece on the beach', from: { x: -140, y: -60, rotate: -14 }, to: { x: -190, y: -70, rotate: -8 }, size: 'w-32 sm:w-40 md:w-48' },
  { src: scatterTeal, alt: "Lara's Crochet customer wearing a teal crochet dress", from: { x: 150, y: -40, rotate: 12 }, to: { x: 195, y: -50, rotate: 7 }, size: 'w-32 sm:w-40 md:w-48' },
  { src: scatterStreet, alt: 'Street-style portrait, styling reference', from: { x: 0, y: 180, rotate: 6 }, to: { x: 0, y: 210, rotate: -3 }, size: 'w-28 sm:w-36 md:w-44' },
];

/* Stage boundaries along the 0→1 scroll progress of the whole pinned run. */
const STAGES = {
  scatterEnd: 0.16,
  paragraphsStart: 0.16,
  paragraphsEnd: 0.52,
  reviewsStart: 0.52,
  reviewsEnd: 0.98,
};

function ScatterImage({ layout, progress }) {
  const localProgress = useTransform(progress, [0, STAGES.scatterEnd], [0, 1]);
  const x = useTransform(localProgress, [0, 1], [layout.from.x, layout.to.x]);
  const y = useTransform(localProgress, [0, 1], [layout.from.y, layout.to.y]);
  const rotate = useTransform(localProgress, [0, 1], [layout.from.rotate, layout.to.rotate]);
  const opacity = useTransform(progress, [0, STAGES.scatterEnd * 0.6, STAGES.scatterEnd], [0, 1, 1]);
  const scale = useTransform(localProgress, [0, 1], [0.7, 1]);

  return (
    <motion.img
      src={layout.src}
      alt={layout.alt}
      style={{ x, y, rotate, opacity, scale }}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${layout.size} rounded-sm object-cover shadow-xl ring-4 ring-[var(--cream)]`}
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

function ScrollTestimonial({ t, index, progress }) {
  const span = (STAGES.reviewsEnd - STAGES.reviewsStart) / TESTIMONIALS.length;
  const start = STAGES.reviewsStart + index * span;
  const fadeIn = start + span * 0.25;
  const hold = start + span * 0.7;
  const fadeOut = start + span;

  const opacity = useTransform(progress, [start, fadeIn, hold, fadeOut], [0, 1, 1, 0]);
  // TIP: enters sliding in from the left, per the "one by one, left to
  // right" request — x animates from off-left to its resting spot.
  const x = useTransform(progress, [start, fadeIn], [-40, 0]);

  return (
    <motion.div
      style={{ opacity, x }}
      className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto max-w-sm border border-[var(--line)] bg-[var(--cream)] p-5 text-center"
    >
      <p className="text-sm text-[var(--ink)] mb-3 leading-relaxed">"{t.quote}"</p>
      <p className="text-xs font-bold text-[var(--ink)] flex items-center justify-center gap-1">
        {t.name}
        <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--maroon)] text-white text-[9px]">✓</span>
      </p>
      <p className="text-[11px] text-[var(--muted)]">Verified Customer</p>
    </motion.div>
  );
}

export default function LaraShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const podiumRotate = useTransform(scrollYProgress, [0, 1], [0, 180]);

  return (
    <section ref={sectionRef} className="relative h-[300vh]">
      {/* TIP: top-[66px] matches Navbar's fixed h-[66px] — this is
          what makes the section stop right at the navbar's bottom
          edge instead of sliding underneath it. */}
      <div className="sticky top-[66px] h-[calc(100vh-66px)] overflow-hidden bg-[var(--cream)]">
        {/* Decorative arcs — same flourish used elsewhere on the page */}
        <img src={arcFlourish1} alt="" aria-hidden="true" className="pointer-events-none absolute -top-10 left-0 w-full opacity-70" />
        <img src={arcFlourish2} alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-0 w-full rotate-180 opacity-70" />

        {/* Wool/crochet-spiral backdrop, Lara up front, photos scattered on top */}
        <div className="relative mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-5">
          <div
            aria-hidden="true"
            style={{ rotate: podiumRotate }}
            className="absolute h-[70vmin] w-[70vmin] rounded-full border-2 border-dashed border-[var(--mauve)] opacity-50"
          />

          <div className="relative">
            <img
              src={laraPortrait}
              alt="Lara, founder of Lara's Crochet"
              className="relative z-10 h-[46vh] w-auto max-w-none rounded-sm object-cover shadow-2xl md:h-[56vh]"
            />
            {SCATTER_LAYOUT.map((layout, i) => (
              <ScatterImage key={i} layout={layout} progress={scrollYProgress} />
            ))}
          </div>

          {/* Paragraphs — stacked in the same spot, cross-fading */}
          <div className="relative mt-8 h-24 w-full">
            {PARAGRAPHS.map((text, i) => (
              <ScrollParagraph key={i} text={text} index={i} progress={scrollYProgress} />
            ))}
          </div>

          {/* Testimonials — stacked in the same spot, one at a time */}
          <div className="relative mt-4 h-40 w-full">
            {TESTIMONIALS.map((t, i) => (
              <ScrollTestimonial key={t.name} t={t} index={i} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
