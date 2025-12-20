import { motion } from 'framer-motion'
import { Instagram, Linkedin } from 'lucide-react'
import Reveal from './ui/Reveal'
import { staggerContainer } from '../utils/animations'

interface Instructor {
  id: number
  name: string
  role: string
  bio: string
  image: string
  instagram?: string
  linkedin?: string
}

const INSTRUCTORS: Instructor[] = [
  {
    id: 1,
    name: 'ALEX RIVERA',
    role: 'Pilates Reformer Expert',
    bio: '10 anni di esperienza nel Pilates Reformer. Trasforma il corpo attraverso movimento preciso e potente. Specializzato in postura e riabilitazione.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000',
    instagram: '@alex_rivera_fit',
    linkedin: 'alex-rivera-pilates'
  },
  {
    id: 2,
    name: 'MARA BLACK',
    role: 'Strength & Conditioning Coach',
    bio: 'Ex-atleta professionista con background in cross-training. Combina forza e mobilità per risultati straordinari. Passione per il movimento funzionale.',
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?q=80&w=1000',
    instagram: '@mara_black_strength'
  },
  {
    id: 3,
    name: 'JORDAN CORE',
    role: 'Movement Master & Flow Specialist',
    bio: 'Specialista in flow e dinamica del movimento. Ogni lezione è un viaggio verso l\'equilibrio perfetto tra forza, flessibilità e controllo.',
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1000',
    instagram: '@jordan_core_movement',
    linkedin: 'jordan-core'
  },
  {
    id: 4,
    name: 'RILEY POWER',
    role: 'Cardio & High-Intensity Specialist',
    bio: 'Energia pura e dinamismo. Trasforma il cardio in un\'esperienza ad alto impatto e divertente. Expert in Jumpboard e Power Pilates.',
    image: 'https://images.unsplash.com/photo-1549472654-11a6d141b46e?q=80&w=1000',
    instagram: '@riley_power_cardio'
  },
]

function Instructors() {
  return (
    <section id="instructors" className="bg-zinc-950 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal width="fit-content" delay={0}>
          <div className="text-center mb-4">
            <h2 className="font-barlow text-5xl md:text-6xl font-black text-brand-text uppercase tracking-tight mb-4">
              I Nostri Coach
            </h2>
            <p className="font-inter text-lg text-zinc-400 max-w-2xl mx-auto">
              Team di professionisti dedicati alla tua trasformazione
            </p>
          </div>
        </Reveal>

        {/* Instructors Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {INSTRUCTORS.map((instructor) => (
            <motion.div
              key={instructor.id}
              className="group bg-zinc-900 border border-zinc-800 overflow-hidden transition-all duration-300 hover:border-zinc-700"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <motion.img
                  src={instructor.image}
                  alt={instructor.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {/* Overlay gradient for bio visibility */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/20 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Name & Role */}
                <div className="mb-4">
                  <h3 className="font-barlow text-xl font-bold text-brand-text uppercase tracking-tight mb-1">
                    {instructor.name}
                  </h3>
                  <p className="font-barlow text-sm font-semibold text-brand-red uppercase tracking-wide">
                    {instructor.role}
                  </p>
                </div>

                {/* Bio - Visible on mobile, enhanced on hover desktop */}
                <div className="md:hidden mb-4">
                  <p className="font-inter text-sm text-zinc-400 leading-relaxed">
                    {instructor.bio}
                  </p>
                </div>

                <div className="hidden md:block">
                  <p className="font-inter text-sm text-zinc-400 leading-relaxed opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-96 transition-all duration-500 overflow-hidden">
                    {instructor.bio}
                  </p>
                </div>

                {/* Social Links */}
                <motion.div 
                  className="flex items-center gap-3 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {instructor.instagram && (
                    <motion.a
                      href={`https://instagram.com/${instructor.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-brand-red transition-colors"
                      aria-label={`Instagram di ${instructor.name}`}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Instagram size={18} />
                    </motion.a>
                  )}
                  {instructor.linkedin && (
                    <motion.a
                      href={`https://linkedin.com/in/${instructor.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-brand-red transition-colors"
                      aria-label={`LinkedIn di ${instructor.name}`}
                      whileHover={{ scale: 1.2, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Linkedin size={18} />
                    </motion.a>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Instructors
