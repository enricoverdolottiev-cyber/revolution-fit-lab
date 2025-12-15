import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer } from '../utils/animations'

interface HeroProps {
  onOpenBooking: () => void
}

function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070)',
          filter: 'grayscale(30%) brightness(0.6)',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

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
          className="bg-brand-red text-brand-text px-12 py-4 text-lg font-barlow font-bold uppercase tracking-wide hover:bg-red-600 transition-colors"
          variants={fadeInUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          PRENOTA LEZIONE
        </motion.button>
      </motion.div>
    </section>
  )
}

export default Hero