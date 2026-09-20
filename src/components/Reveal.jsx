import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// TIP: a reusable "comes up from underneath" reveal, used across the
// site so every section enters the same way.
//
// Tuned to feel FAST and seamless rather than laggy:
// - it fires slightly BEFORE the block reaches the viewport (positive
//   bottom margin), so by the time you scroll it into view it's
//   already rising instead of sitting blank and then popping in
// - 0.4s with a soft ease-out (was 0.5s, default ease)
// - stagger delays are capped, so the last card in a big grid never
//   makes you wait
const EASE_OUT = [0.22, 1, 0.36, 1];
const MAX_DELAY = 0.2;

export default function Reveal({ children, delay = 0, y = 28 }) {
  const reduceMotion = useReducedMotion();

  // TIP: the ref has to be created BEFORE the reduced-motion early
  // return below. React requires hooks to run in the same order on
  // every render, so a hook that only runs on the animated path
  // would crash the moment the OS setting flips.
  const ref = useRef(null);

  if (reduceMotion) return <div>{children}</div>;

  return (
    <motion.div
      ref={ref}
      data-reveal-wrapper="true"
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05, margin: '0px 0px 8% 0px' }}
      transition={{ duration: 0.45, delay: Math.min(delay, MAX_DELAY), ease: EASE_OUT }}
      onAnimationComplete={() => {
        // TIP: this handler used to be an empty comment, so the cleanup
        // it promised never ran. Any leftover transform / will-change on
        // a wrapper turns it into a containing block for position:fixed
        // children (e.g. anything modal-like inside a <Reveal>) and
        // creates a stacking context. Clearing both on the DOM node
        // itself, once the rise is finished, mirrors what the CSS
        // [data-revealed="true"] rule does for scrollReveal-managed
        // elements. (The ?. guards the tiny window where the node has
        // already unmounted.)
        const node = ref.current;
        if (!node) return;
        node.style.transform = 'none';
        node.style.willChange = 'auto';
      }}
    >
      {children}
    </motion.div>
  );
}