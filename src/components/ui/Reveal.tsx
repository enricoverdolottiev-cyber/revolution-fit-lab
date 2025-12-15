import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  width?: 'fit-content' | 'full'
  delay?: number
}

function Reveal({ children, width = 'full', delay = 0 }: RevealProps) {
  return (
    <motion.div
      style={{ width: width === 'fit-content' ? 'fit-content' : '100%' }}
      initial={{ opacity: 0, y: 75 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

export default Reveal

