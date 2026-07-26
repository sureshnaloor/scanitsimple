// Centralized animation tokens for consistency across the app
// All timings use GPU-composable properties (transform, opacity) only

export const easings = {
  smooth: [0.4, 0, 0.2, 1] as const,
  out: [0, 0, 0.2, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  expoOut: [0.16, 1, 0.3, 1] as const,
};

export const durations = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  countUp: 1.2,
};

export const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durations.slow, ease: easings.out },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: durations.normal, ease: easings.smooth },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: durations.slow, ease: easings.out },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: durations.slow, ease: easings.out },
};

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: durations.slow, ease: easings.out },
};

export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

export const staggerItem = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: easings.out },
  },
};

export const springHover = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 17,
};

export const springBounce = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
};

export const textRevealContainer = (stagger = 0.03) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: stagger,
    },
  },
});

export const textRevealChild = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.expoOut },
  },
};

export const floatAnimation = {
  animate: {
    y: [0, -12, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(0,180,216,0)',
      '0 0 20px rgba(0,180,216,0.3)',
      '0 0 0px rgba(0,180,216,0)',
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const sonarRing = {
  initial: { scale: 0.8, opacity: 0.6 },
  animate: {
    scale: 1.6,
    opacity: 0,
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeOut',
    },
  },
};

export const viewportOnce = {
  once: true,
  margin: '-10%',
};
