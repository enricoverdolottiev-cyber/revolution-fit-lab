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

/**
 * Stagger container for products grid with faster animation
 * Children will animate in sequence with 0.1s delay
 */
export const staggerProducts: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 100ms delay between each child
      delayChildren: 0.1, // Initial delay before first child
    },
  },
}

/**
 * Magnetic button effect - pulls button toward mouse on hover
 * Use with onMouseMove event and motion.div
 */
export const createMagneticEffect = (
  e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ref: React.RefObject<HTMLButtonElement | HTMLDivElement>
) => {
  if (!ref.current) return

  const rect = ref.current.getBoundingClientRect()
  const x = e.clientX - rect.left - rect.width / 2
  const y = e.clientY - rect.top - rect.height / 2

  const strength = 15 // Magnetic pull strength

  ref.current.style.transform = `translate(${x / strength}px, ${y / strength}px)`
}

/**
 * Reset magnetic effect
 */
export const resetMagneticEffect = (
  ref: React.RefObject<HTMLButtonElement | HTMLDivElement>
) => {
  if (!ref.current) return
  ref.current.style.transform = 'translate(0px, 0px)'
}

/**
 * Shake animation variant for error feedback
 * Horizontal shake motion for buttons/inputs
 */
export const shake: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
}

