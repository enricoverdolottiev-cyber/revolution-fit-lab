import { motion } from 'framer-motion'
import { Activity, Zap, Users } from 'lucide-react'
import Reveal from './ui/Reveal'
import { fadeInUp, staggerContainer } from '../utils/animations'

function Features() {
  const features = [
    {
      title: 'Tecnologia Reformer',
      description: 'Macchinari di precisione per isolare i gruppi muscolari senza impatto.',
      icon: Activity,
    },
    {
      title: 'Total Body Tone',
      description: 'Scolpisci e allunga ogni muscolo con resistenza progressiva.',
      icon: Zap,
    },
    {
      title: 'Classi Boutique',
      description: 'Massimo 6 persone. Attenzione maniacale alla tua postura.',
      icon: Users,
    },
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal width="fit-content" delay={0}>
          <h2 className="font-barlow text-center text-brand-dark text-4xl md:text-5xl font-semibold mb-12 mx-auto">
            Il Metodo RFL
          </h2>
        </Reveal>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div 
                key={index} 
                className="text-center group"
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <IconComponent className="text-brand-red w-12 h-12 transition-colors group-hover:text-red-600" />
                </motion.div>
                <h3 className="font-barlow text-xl font-bold text-brand-dark mb-3">
                  {feature.title}
                </h3>
                <p className="font-inter text-brand-dark/80">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

export default Features
