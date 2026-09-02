import { motion } from 'framer-motion';

// TIP: matches the fade-up-on-scroll pattern from the client's own
// portfolio reference (.rv / .rv.on in that site's CSS): rises 38px
// while fading in, 0.75s duration, ease [0.4,0,0.2,1]. `delay` lets
// callers stagger a group the same way that site does with its
// .d1/.d2/.d3/.d4 classes (0.08s increments).
export default function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 38 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.75, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
