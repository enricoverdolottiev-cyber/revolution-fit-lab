import { Variants } from 'framer-motion'

/**
 * Fade in from bottom animation variant
 * Opacity: 0 -> 1, Y: 40 -> 0
 * Smooth easing with premium feel
 */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1], // easeOut cubic bezier for smooth premium feel
    },
  },
}

/**
 * Simple fade in animation (no Y movement)
 * For images or elements that should only fade
 */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

/**
 * Stagger container for orchestrating child element animations
 * Children will animate in sequence with delay
 */
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // 150ms delay between each child
      delayChildren: 0.2, // Initial delay before first child
    },
  },
}

