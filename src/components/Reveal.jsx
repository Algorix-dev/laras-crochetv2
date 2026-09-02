import { motion } from 'framer-motion';

// TIP: a reusable reveal keeps the home-page entrance motion consistent.
export default function Reveal({ children, delay = 0 }) {
  return <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5, delay }}>{children}</motion.div>;
}
