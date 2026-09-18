// Shared animation variants so every "group of things fading/sliding in
// together" moment in the app (dashboard cards, how-it-works steps, etc.)
// moves the same way. Import these rather than writing one-off variants
// per component, so the motion feels like one system, not scattered effects.

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const fadeUpItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
  },
};
