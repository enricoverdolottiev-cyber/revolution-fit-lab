import { motion } from 'framer-motion'
import { Music, Zap, Users, Award } from 'lucide-react'
import Reveal from './ui/Reveal'

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const features: Feature[] = [
  { icon: Music, label: 'Sound System' },
  { icon: Zap, label: 'High Energy' },
  { icon: Users, label: 'Expert Coaches' },
  { icon: Award, label: 'Premium Quality' },
]

function About() {
  return (
    <section id="about" className="bg-zinc-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Parte Visual (Sinistra) */}
          <Reveal>
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Bordo decorativo rosso offset */}
              <motion.div 
                className="absolute -bottom-4 -right-4 w-full h-full border-2 border-brand-red pointer-events-none"
                whileHover={{ x: -4, y: -4 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Immagine */}
              <div className="relative overflow-hidden">
                <motion.img
                  src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2070"
                  alt="Instructor at Revolution Fit Lab"
                  className="w-full aspect-[4/5] object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          </Reveal>

          {/* Parte Testo (Destra) */}
          <Reveal delay={0.1}>
            {/* Titolo overline */}
            <p className="font-barlow text-sm font-bold text-brand-red uppercase tracking-wider mb-4">
              THE STUDIO
            </p>

            {/* Titolo grande */}
            <h2 className="font-barlow text-4xl md:text-5xl font-black text-brand-text uppercase tracking-tight mb-6">
              REDEFINING PILATES
            </h2>

            {/* Paragrafo */}
            <p className="font-inter text-base text-zinc-400 leading-relaxed mb-8">
              Atmosfera dark che si fonde con energia pura. Musica curata che accompagna ogni movimento, 
              creando un'esperienza immersiva che va oltre l'allenamento. Istruttori esperti guidano 
              ogni sessione con precisione e passione, trasformando il Pilates Reformer in un'arte 
              della trasformazione corporea. Qui ogni dettaglio è studiato per massimizzare il tuo potenziale.
            </p>

            {/* Features Grid 2x2 */}
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 group"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                  >
                    <motion.div
                      className="w-10 h-10 flex items-center justify-center bg-zinc-800 border border-zinc-700 group-hover:border-brand-red transition-colors"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <IconComponent className="w-5 h-5 text-brand-red" />
                    </motion.div>
                    <span className="font-inter text-sm font-medium text-zinc-300 group-hover:text-brand-text transition-colors">
                      {feature.label}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default About