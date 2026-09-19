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

  if (reduceMotion) return <div>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05, margin: '0px 0px 8% 0px' }}
      transition={{ duration: 0.4, delay: Math.min(delay, MAX_DELAY), ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}