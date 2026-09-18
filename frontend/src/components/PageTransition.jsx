import { motion } from "framer-motion";

// Wraps a page's content so route changes fade/slide in and out smoothly
// instead of hard-cutting. Used once per route in AppRoutes.jsx — doesn't
// touch any page's internal logic, just wraps its output.
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
