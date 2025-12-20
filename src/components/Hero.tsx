import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface HeroProps {
  onOpenBooking: () => void
}

function Hero({ onOpenBooking }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start']
  })
  
  // Parallax effect per background
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section 
      ref={sectionRef}
      id="home" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070)',
          filter: 'grayscale(30%) brightness(0.6)',
          y: backgroundY,
          opacity,
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="font-barlow text-6xl md:text-7xl lg:text-9xl font-black text-brand-text uppercase tracking-tight mb-8 leading-none"
          variants={fadeInUp}
        >
          Reform Your Body
        </motion.h1>
        
        <motion.p 
          className="font-inter text-xl md:text-2xl text-brand-text/90 max-w-3xl mx-auto mb-12"
          variants={fadeInUp}
        >
          Trasforma il tuo corpo con un approccio rivoluzionario al fitness
        </motion.p>
        
        <motion.button 
          onClick={onOpenBooking}
          className="relative bg-gradient-to-r from-red-600 to-red-500 text-white px-12 py-4 text-lg font-barlow font-bold uppercase tracking-wide rounded-2xl group shadow-lg hover:shadow-red-500/20 transition-shadow"
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {/* Button text */}
          <span className="relative z-10">PRENOTA LEZIONE</span>
        </motion.button>
      </motion.div>
    </section>
  )
}

export default Hero